// Dados de exemplo: npm run seed   (APAGA as coleções antes de inserir)
// Lê os mesmos JSON que a SPA usa em modo simulado (web/src/data), para a BD ter exatamente esses dados.
// As datas dos JSON são relativas ao momento do seed ("-25m", "+1d18:00"): há sempre leilões ao vivo.
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const { DEADLINE_MIN } = require('../services/awarding');

const DATA = path.join(__dirname, '..', '..', '..', 'web', 'src', 'data');
const load = (name) => require(path.join(DATA, `${name}.json`));

const NOW = Date.now();
const UNITS = { s: 1e3, m: 6e4, h: 36e5 };
function when(relative) {
  const short = /^([+-]\d+)([smh])$/.exec(relative);
  if (short) return new Date(NOW + Number(short[1]) * UNITS[short[2]]);
  const [, days, h, min] = /^([+-]\d+)d(\d\d):(\d\d)$/.exec(relative);
  const date = new Date(NOW);
  date.setDate(date.getDate() + Number(days));
  date.setHours(Number(h), Number(min), 0, 0);
  return date;
}

// Os JSON usam ids legíveis ("u-horta"); cada um passa a ter um ObjectId
const ids = new Map();
const id = (readable) => {
  if (readable == null) return undefined;
  if (!ids.has(readable)) ids.set(readable, new mongoose.Types.ObjectId());
  return ids.get(readable);
};

// Valida com o schema e insere sem o Mongoose reescrever o createdAt
async function insert(Model, docs) {
  const valid = docs.map((d) => {
    const doc = new Model(d);
    const error = doc.validateSync();
    if (error) throw error;
    return doc.toObject({ virtuals: false });
  });
  await Model.collection.insertMany(valid);
  return valid.length;
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User, Product, Auction, Bid, Order, Review, Payment].map((M) => M.deleteMany()));
  await Promise.all([User, Product, Auction, Bid, Order, Review, Payment].map((M) => M.syncIndexes()));

  const passwordHash = await bcrypt.hash('password123', 12);
  const now = new Date(NOW);

  const users = load('users').map((u) => ({
    _id: id(u._id), name: u.name, email: u.email, passwordHash, role: u.role, address: u.address,
    producer: u.producer, createdAt: u.createdAt ? when(u.createdAt) : now, updatedAt: now
  }));

  const products = load('products').map((p) => ({
    ...p, _id: id(p._id), producer: id(p.producer), createdAt: now, updatedAt: now
  }));

  const bids = load('bids').map((b) => ({
    _id: id(b._id), auction: id(b.auction), buyer: id(b.buyer), name: b.name, amount: b.amount,
    createdAt: when(b.at), updatedAt: when(b.at)
  }));

  const auctions = load('auctions').map((a) => {
    const startsAt = when(a.start);
    const endsAt = new Date(startsAt.getTime() + a.durationMin * 6e4);
    const own = bids.filter((b) => b.auction.equals(id(a._id)));
    const last = own.reduce((max, b) => (!max || b.amount > max.amount ? b : max), null);
    let status = 'ended';
    if (NOW < startsAt) status = 'scheduled';
    else if (NOW < endsAt) status = 'live';

    // Terminado: vendido (já tem encomenda), à espera da confirmação do vencedor ou sem comprador
    let closing = {};
    if (status === 'ended') {
      const winner = last && { buyer: last.buyer, name: last.name, amount: last.amount };
      if (a.order) closing = { outcome: 'sold', winner };
      else if (winner) closing = { outcome: 'awaiting', winner: { ...winner, deadline: new Date(endsAt.getTime() + DEADLINE_MIN * 6e4) } };
      else closing = { outcome: 'unsold' };
    }
    return {
      _id: id(a._id), producer: id(a.producer), product: id(a.product), lot: a.lot, quantity: a.quantity,
      description: a.description, startPrice: a.startPrice, increment: a.increment, startsAt, endsAt, status,
      currentBid: last
        ? { amount: last.amount, buyer: last.buyer, name: last.name, at: last.createdAt }
        : { amount: a.startPrice },
      bidCount: own.length, order: id(a.order), ...closing,
      // O stock dos JSON já é o disponível; a reserva de um lote sem comprador conta como devolvida
      stockReleased: closing.outcome === 'unsold', createdAt: now, updatedAt: now
    };
  });

  const orders = load('orders').map((o) => ({
    _id: id(o._id), buyer: id(o.buyer), producer: id(o.producer), status: o.status,
    items: o.items.map((i) => ({ ...i, product: id(i.product) })),
    history: o.history.map((h) => ({ status: h.status, at: when(h.at) })),
    delivery: o.delivery, source: o.source, auction: id(o.auction), reviewed: o.reviewed,
    createdAt: when(o.createdAt), updatedAt: now
  }));

  // Cada encomenda de exemplo já foi paga (pagamento fictício), alternando cartão e MB WAY
  const payments = orders.map((o, i) => {
    const card = i % 2 === 0;
    const amount = Math.round(o.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0) * 100) / 100;
    const reference = `PAY-${String(o._id).slice(-8).toUpperCase()}`;
    const details = card ? { method: 'card', card: { brand: 'Visa', last4: '4242' } } : { method: 'mbway', phone: '91*****78' };
    o.payment = { reference, method: details.method, label: card ? 'Visa •••• 4242' : 'MB WAY 91*****78', paidAt: o.createdAt };
    return { _id: new mongoose.Types.ObjectId(), reference, buyer: o.buyer, orders: [o._id], auction: o.auction, amount, ...details,
      status: 'paid', createdAt: o.createdAt, updatedAt: o.createdAt };
  });

  const reviews = load('reviews').map((r) => ({
    _id: id(r._id), author: id(r.author), authorName: r.authorName, producer: id(r.producer), order: id(r.order),
    products: r.products.map(id), rating: r.rating, comment: r.comment, status: r.status,
    reportedBy: r.reportedBy.map(id), createdAt: when(r.at), updatedAt: when(r.at)
  }));

  const counts = {
    users: await insert(User, users),
    products: await insert(Product, products),
    auctions: await insert(Auction, auctions),
    bids: await insert(Bid, bids),
    orders: await insert(Order, orders),
    reviews: await insert(Review, reviews),
    payments: await insert(Payment, payments)
  };

  console.log('Seed concluído:', counts);
  console.log('Contas de teste (password: password123): tasca@exemplo.pt, horta@exemplo.pt, admin@exemplo.pt');
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
