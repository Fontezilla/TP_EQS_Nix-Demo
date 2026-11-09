// Leilões (a parte REST; as licitações em direto são feitas por Socket.io)
const router = require('express').Router();
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const verifiedProducer = require('../middleware/verifiedProducer');
const asyncHandler = require('../utils/async');
const { HttpError } = require('../utils/httpError');
const { POPULATE, formatAuction, formatBid } = require('../utils/auctions');
const { confirm, decline } = require('../services/awarding');

// Ordem de cada lista: ao vivo pelos que acabam primeiro, agendados pelos que começam primeiro,
// terminados dos mais recentes para os mais antigos
const SORTS = {
  live: { endsAt: 1, _id: 1 },
  scheduled: { startsAt: 1, _id: 1 },
  ended: { endsAt: -1, _id: 1 }
};

// GET /api/auctions?status=&page=&limit=  -> 200 { items, total, page, pages }
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) {
    if (!SORTS[status]) throw new HttpError(400, 'Estado inválido');
    filter.status = status;
  }
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const total = await Auction.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), pages);
  const auctions = await Auction.find(filter).sort(SORTS[status] || SORTS.scheduled)
    .skip((page - 1) * limit).limit(limit).populate(POPULATE);
  res.json({ items: auctions.map(formatAuction), total, page, pages });
}));

// GET /api/auctions/awaiting  (comprador)  -> 200 [leilões ganhos à espera da confirmação dele]
router.get('/awaiting', auth('buyer'), asyncHandler(async (req, res) => {
  const auctions = await Auction.find({ outcome: 'awaiting', 'winner.buyer': req.user.id })
    .sort({ 'winner.deadline': 1 }).populate(POPULATE);
  res.json(auctions.map(formatAuction));
}));

// POST /api/auctions/:id/confirm  (comprador vencedor)  { payment } -> 201 { order } | 400 | 402 | 409
router.post('/:id/confirm', auth('buyer'), asyncHandler(async (req, res) => {
  const { order } = await confirm(req.app.get('io'), req.params.id, req.user.id, req.body.payment);
  res.status(201).location(`/api/orders/${order._id}`).json({ order });
}));

// POST /api/auctions/:id/decline  (comprador vencedor)  -> 204 | 409: o lote passa à licitação seguinte
router.post('/:id/decline', auth('buyer'), asyncHandler(async (req, res) => {
  await decline(req.app.get('io'), req.params.id, req.user.id);
  res.status(204).end();
}));

// GET /api/auctions/:id  -> 200 leilão + licitações | 404
router.get('/:id', asyncHandler(async (req, res) => {
  const a = await Auction.findById(req.params.id).populate(POPULATE);
  if (!a) throw new HttpError(404, 'Leilão não encontrado');
  const bids = await Bid.find({ auction: a._id }).sort({ amount: -1 }).limit(50);
  res.json({ ...formatAuction(a), bids: bids.map(formatBid) });
}));

// POST /api/auctions  (produtor validado)  -> 201 + Location | 400 | 403 | 404 | 409
// Corpo: { product, lot, quantity, description, startPrice, increment, durationMin, startsAt? }
// Sem startsAt (ou com uma data passada) o leilão abre de imediato.
// A quantidade sai do stock do produto enquanto o leilão decorre; volta se o lote ficar sem comprador.
router.post('/', auth('producer'), verifiedProducer, asyncHandler(async (req, res) => {
  const { product, lot, description } = req.body;
  const durationMin = Number(req.body.durationMin);
  if (!Number.isInteger(durationMin) || durationMin < 1 || durationMin > 24 * 60) throw new HttpError(400, 'A duração tem de ser entre 1 minuto e 24 horas');
  const quantity = Math.round(Number(req.body.quantity) * 100) / 100;
  if (!Number.isFinite(quantity) || quantity <= 0) throw new HttpError(400, 'Indique a quantidade do lote');

  const p = await Product.findOne({ _id: product, producer: req.user.id });
  if (!p) throw new HttpError(404, 'Produto não encontrado');
  if (p.hidden) throw new HttpError(409, 'Este produto foi ocultado pelo administrador e não pode ir a leilão');

  const now = new Date();
  let startsAt = req.body.startsAt ? new Date(req.body.startsAt) : now;
  if (Number.isNaN(startsAt.getTime())) throw new HttpError(400, 'Data de início inválida');
  if (startsAt < now) startsAt = now;
  if (startsAt - now > 60 * 864e5) throw new HttpError(400, 'O leilão tem de começar nos próximos 60 dias');

  // Reserva ATÓMICA: só desconta se ainda houver stock (uma encomenda ao mesmo tempo não o deixa negativo)
  const reserved = await Product.findOneAndUpdate({ _id: p._id, stock: { $gte: quantity } }, { $inc: { stock: -quantity } }, { new: true });
  if (!reserved) {
    const left = (await Product.findById(p._id))?.stock ?? 0;
    throw new HttpError(409, `Não há stock suficiente de ${p.name} para este lote (disponível: ${left} ${p.unit}).`);
  }

  const startPrice = Number(req.body.startPrice);
  let a;
  try {
    a = await Auction.create({
      producer: req.user.id, product: p._id, lot, quantity, description,
      startPrice, increment: Number(req.body.increment),
      currentBid: { amount: startPrice }, // a 1.ª licitação tem de ser >= preço base + incremento
      startsAt, endsAt: new Date(startsAt.getTime() + durationMin * 6e4),
      status: startsAt <= now ? 'live' : 'scheduled'
    });
  } catch (e) {
    await Product.updateOne({ _id: p._id }, { $inc: { stock: quantity } }); // o leilão não foi criado: a reserva volta
    throw e;
  }

  req.app.get('io')?.emit('auctions-changed');
  res.status(201).location(`/api/auctions/${a._id}`).json(a);
}));

// GET /api/auctions/:id/bids  -> 200 [licitações]
router.get('/:id/bids', asyncHandler(async (req, res) => {
  const bids = await Bid.find({ auction: req.params.id }).sort({ amount: -1 }).limit(50);
  res.json(bids.map(formatBid));
}));

module.exports = router;
