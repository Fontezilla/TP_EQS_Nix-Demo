// Depois de um leilão terminar: o vencedor tem um prazo para confirmar a compra.
// Se não confirmar a tempo (ou recusar), o lote passa ao comprador com a licitação seguinte mais alta.
// Cada passo é uma operação atómica: dois pedidos ao mesmo tempo nunca dão o lote a duas pessoas.
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { HttpError } = require('../utils/httpError');
const payments = require('./payments');

const DEADLINE_MIN = Number(process.env.CONFIRMATION_DEADLINE_MIN) || 60;
const newDeadline = () => new Date(Date.now() + DEADLINE_MIN * 6e4);

// Licitação mais alta de quem ainda não desistiu (a mais alta de cada comprador)
async function bestBid(auctionId, excluded) {
  const b = await Bid.findOne({ auction: auctionId, buyer: { $nin: excluded } }).sort({ amount: -1, createdAt: 1 });
  return b && { buyer: b.buyer, name: b.name, amount: b.amount, deadline: newDeadline() };
}

function notify(io, a) {
  io?.to(`auction:${a._id}`).emit('outcome', { auction: a._id, outcome: a.outcome, winner: a.winner, order: a.order });
  io?.emit('auctions-changed');
  if (a.outcome === 'awaiting') {
    io?.to(`user:${a.winner.buyer}`).emit('auction-won', { auction: a._id, lot: a.lot, amount: a.winner.amount, deadline: a.winner.deadline });
  }
}

// Lote sem comprador: a quantidade reservada volta ao stock do produto.
// O filtro stockReleased: false garante que só volta uma vez, mesmo com dois pedidos ao mesmo tempo.
async function releaseStock(auction) {
  const a = await Auction.findOneAndUpdate({ _id: auction._id, stockReleased: { $ne: true } }, { stockReleased: true });
  if (a?.quantity) await Product.updateOne({ _id: a.product }, { $inc: { stock: a.quantity } });
}

// Chamado quando o leilão fecha: o vencedor é a licitação mais alta
async function openConfirmation(io, auction) {
  const winner = await bestBid(auction._id, []);
  const a = await Auction.findOneAndUpdate(
    { _id: auction._id, outcome: { $exists: false } },
    winner ? { outcome: 'awaiting', winner } : { outcome: 'unsold' },
    { new: true }
  );
  if (!a) return;
  if (a.outcome === 'unsold') await releaseStock(a);
  notify(io, a);
}

// O vencedor atual perde a vez (prazo esgotado ou recusou): passa ao seguinte, ou fica sem comprador
async function passToNext(io, auction, reason) {
  const current = auction.winner.buyer;
  const next = await bestBid(auction._id, [...auction.declined, current]);
  const a = await Auction.findOneAndUpdate(
    { _id: auction._id, outcome: 'awaiting', 'winner.buyer': current },
    next
      ? { $push: { declined: current }, winner: next }
      : { $push: { declined: current }, outcome: 'unsold', $unset: { winner: 1 } },
    { new: true }
  );
  if (!a) return; // outro pedido já tratou deste leilão
  if (reason === 'deadline') io?.to(`user:${current}`).emit('auction-lost', { auction: a._id, lot: a.lot });
  if (a.outcome === 'unsold') await releaseStock(a);
  notify(io, a);
}

// O vencedor paga (pagamento fictício) e confirma a compra dentro do prazo
async function confirm(io, auctionId, buyerId, paymentInput) {
  const payment = payments.validate(paymentInput);
  const waiting = await Auction.exists({ _id: auctionId, outcome: 'awaiting', 'winner.buyer': buyerId, 'winner.deadline': { $gt: new Date() } });
  if (!waiting) throw new HttpError(409, 'Já não pode confirmar este leilão (o prazo terminou ou o lote passou a outro comprador).');
  const reference = payments.charge(payment); // 402 se for recusado: o lote continua à espera, dentro do prazo

  const a = await Auction.findOneAndUpdate(
    { _id: auctionId, outcome: 'awaiting', 'winner.buyer': buyerId, 'winner.deadline': { $gt: new Date() } },
    { outcome: 'sold' },
    { new: true }
  );
  if (!a) throw new HttpError(409, 'Já não pode confirmar este leilão (o prazo terminou ou o lote passou a outro comprador).');

  const order = await Order.create({
    buyer: buyerId,
    producer: a.producer,
    items: [{ product: a.product, name: a.lot, unitPrice: a.winner.amount, quantity: 1, unit: 'lote' }],
    status: 'confirmed',
    history: [{ status: 'confirmed' }],
    source: 'auction',
    auction: a._id
  });
  a.order = order._id;
  await Auction.updateOne({ _id: a._id }, { order: order._id });
  await payments.record(payment, reference, { buyer: buyerId, orders: [order], amount: a.winner.amount, auction: a._id });

  io?.to(`user:${a.producer}`).emit('new-order', { id: order._id, buyer: a.winner.name, total: order.total });
  notify(io, a);
  return { auction: a, order };
}

async function decline(io, auctionId, buyerId) {
  const a = await Auction.findOne({ _id: auctionId, outcome: 'awaiting', 'winner.buyer': buyerId });
  if (!a) throw new HttpError(409, 'Este leilão já não está à espera da sua confirmação.');
  await passToNext(io, a, 'declined');
}

// Chamado pelo ciclo dos leilões: quem deixou passar o prazo perde a vez
async function checkDeadlines(io) {
  const expired = await Auction.find({ outcome: 'awaiting', 'winner.deadline': { $lte: new Date() } });
  for (const a of expired) await passToNext(io, a, 'deadline');
}

module.exports = { openConfirmation, confirm, decline, checkDeadlines, DEADLINE_MIN };
