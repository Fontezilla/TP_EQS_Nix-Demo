// Encomendas
const router = require('express').Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/async');
const { HttpError } = require('../utils/httpError');
const payments = require('../services/payments');

const { STATUSES } = Order;
const POPULATE = [
  { path: 'producer', select: 'name producer.city producer.address' },
  { path: 'buyer', select: 'name email' }
];

// Repõe o stock já reservado quando uma encomenda não pode ser feita
const restoreStock = (reservations) => Promise.all(reservations.map(({ product, quantity }) =>
  Product.updateOne({ _id: product }, { $inc: { stock: quantity } })));

// POST /api/orders  (comprador)  -> 201 [encomendas criadas] | 400 | 402 | 409
// Corpo: { items: [{ product, quantity }], deliveries: { [producerId]: { type, address } }, payment }
// payment: { method: 'card', number, expiry: 'MM/AA', cvc, name } | { method: 'mbway', phone }
// Cria UMA encomenda por produtor e UM pagamento (fictício) que as cobre a todas.
// O nome e o preço vêm da base de dados (nunca do cliente).
router.post('/', auth('buyer'), asyncHandler(async (req, res) => {
  const { items, deliveries = {} } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'O cesto está vazio');
  const payment = payments.validate(req.body.payment); // 400 antes de mexer no stock

  // Junta linhas repetidas do mesmo produto e valida as quantidades
  const requested = new Map();
  for (const i of items) {
    const q = Number(i.quantity);
    if (!mongoose.isValidObjectId(i.product) || !Number.isInteger(q) || q < 1) throw new HttpError(400, 'Linha do cesto inválida');
    requested.set(String(i.product), (requested.get(String(i.product)) || 0) + q);
  }

  const products = await Product.find({ _id: { $in: [...requested.keys()] } });
  const verified = await User.find({ _id: { $in: products.map((p) => p.producer) }, 'producer.verified': true }).select('_id');
  const verifiedIds = new Set(verified.map((u) => String(u._id)));
  if (products.length !== requested.size || products.some((p) => p.hidden || !verifiedIds.has(String(p.producer)))) {
    throw new HttpError(400, 'Um dos produtos do cesto já não está à venda');
  }

  // Reserva o stock de forma ATÓMICA: só desconta se ainda houver quantidade suficiente.
  // Se um produto falhar, repõe o que já tinha sido reservado e não cria nenhuma encomenda.
  const reservations = [];
  for (const p of products) {
    const quantity = requested.get(String(p._id));
    const ok = await Product.findOneAndUpdate({ _id: p._id, stock: { $gte: quantity } }, { $inc: { stock: -quantity } });
    if (!ok) {
      await restoreStock(reservations);
      throw new HttpError(409, `Não há stock suficiente de ${p.name} (restam ${(await Product.findById(p._id))?.stock ?? 0} ${p.unit}).`);
    }
    reservations.push({ product: p._id, quantity });
  }

  // Uma encomenda por produtor, com cópia do nome e do preço no momento da compra
  const byProducer = new Map();
  for (const p of products) {
    const id = String(p.producer);
    if (!byProducer.has(id)) byProducer.set(id, []);
    byProducer.get(id).push({ product: p._id, name: p.name, unitPrice: p.price, quantity: requested.get(String(p._id)), unit: p.unit });
  }
  const amount = Math.round(products.reduce((s, p) => s + p.price * requested.get(String(p._id)), 0) * 100) / 100;

  // Se a morada faltar ou o pagamento for recusado, o stock reservado volta e nada fica criado
  let created;
  try {
    const orders = [...byProducer].map(([producer, orderItems]) => {
      const delivery = deliveries[producer]?.type === 'delivery'
        ? { type: 'delivery', address: String(deliveries[producer].address || '').trim() }
        : { type: 'pickup' };
      if (delivery.type === 'delivery' && !delivery.address) throw new HttpError(400, 'Indique a morada de entrega');
      return { buyer: req.user.id, producer, items: orderItems, delivery, history: [{ status: 'pending' }] };
    });
    const reference = payments.charge(payment); // 402 se o pagamento for recusado
    created = await Order.create(orders);
    await payments.record(payment, reference, { buyer: req.user.id, orders: created, amount });
  } catch (e) {
    await restoreStock(reservations);
    throw e;
  }

  // Avisa cada produtor em tempo real
  const io = req.app.get('io');
  created.forEach((o) => io?.to(`user:${o.producer}`).emit('new-order', { id: o._id, buyer: req.user.name, total: o.total }));

  res.status(201).location('/api/orders').json(created);
}));

// GET /api/orders?status=&page=&limit=  -> 200 { items, total, page, pages }
// O comprador vê as suas encomendas; o produtor, as que recebeu; o administrador, todas.
router.get('/', auth(), asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'buyer') filter.buyer = req.user.id;
  if (req.user.role === 'producer') filter.producer = req.user.id;
  // ?status=pending,confirmed,ready  (um ou vários estados separados por vírgulas)
  if (req.query.status) {
    const statuses = String(req.query.status).split(',').filter((s) => STATUSES.includes(s));
    if (!statuses.length) throw new HttpError(400, 'Estado inválido');
    filter.status = { $in: statuses };
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const total = await Order.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), pages);
  const items = await Order.find(filter).sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit).limit(limit).populate(POPULATE);
  res.json({ items, total, page, pages });
}));

// GET /api/orders/:id  -> 200 | 404 (também 404 se a encomenda for de outra pessoa)
router.get('/:id', auth(), asyncHandler(async (req, res) => {
  const owner = req.user.role === 'admin' ? {} : { $or: [{ buyer: req.user.id }, { producer: req.user.id }] };
  const o = await Order.findOne({ _id: req.params.id, ...owner }).populate(POPULATE);
  if (!o) throw new HttpError(404, 'Encomenda não encontrada');
  res.json(o);
}));

// PATCH /api/orders/:id/status  (produtor)  { status } -> 200 | 400 | 404 | 409
// O estado só avança (pending -> confirmed -> ready -> delivered): o filtro só aceita estados anteriores
router.patch('/:id/status', auth('producer'), asyncHandler(async (req, res) => {
  const next = STATUSES.indexOf(req.body.status);
  if (next < 1) throw new HttpError(400, 'Estado inválido');

  const o = await Order.findOneAndUpdate(
    { _id: req.params.id, producer: req.user.id, status: { $in: STATUSES.slice(0, next) } },
    { status: STATUSES[next], $push: { history: { status: STATUSES[next], at: new Date() } } },
    { new: true }
  ).populate(POPULATE);

  if (!o) {
    const exists = await Order.exists({ _id: req.params.id, producer: req.user.id });
    if (!exists) throw new HttpError(404, 'Encomenda não encontrada');
    throw new HttpError(409, 'O estado de uma encomenda só pode avançar');
  }

  req.app.get('io')?.to(`user:${o.buyer._id}`).emit('order-updated', { id: o._id, status: o.status, producer: o.producer.name });
  res.json(o);
}));

module.exports = router;
