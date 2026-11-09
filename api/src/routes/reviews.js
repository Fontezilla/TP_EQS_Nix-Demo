const router = require('express').Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const asyncHandler = require('../utils/async');
const { HttpError } = require('../utils/httpError');

// POST /api/reviews  (comprador)  { order, rating, comment } -> 201 | 400 | 404 | 409
// Só depois de a encomenda estar entregue e uma única vez por encomenda.
// Conta para o produtor e para os produtos dessa encomenda.
router.post('/', auth('buyer'), asyncHandler(async (req, res) => {
  const { order, comment } = req.body;
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Escolha de 1 a 5 estrelas');

  // Marca a encomenda como avaliada de forma atómica: duas avaliações ao mesmo tempo não passam as duas
  const o = await Order.findOneAndUpdate(
    { _id: order, buyer: req.user.id, status: 'delivered', reviewed: false },
    { reviewed: true }
  );
  if (!o) {
    const mine = await Order.findOne({ _id: order, buyer: req.user.id });
    if (!mine) throw new HttpError(404, 'Encomenda não encontrada');
    throw new HttpError(409, mine.reviewed ? 'Esta encomenda já foi avaliada' : 'Só pode avaliar depois de a encomenda ser entregue');
  }

  try {
    const r = await Review.create({
      author: req.user.id, authorName: req.user.name, producer: o.producer, order: o._id,
      products: o.items.map((i) => i.product).filter(Boolean),
      rating, comment: comment ? String(comment).trim() : undefined
    });
    res.status(201).json(r);
  } catch (err) {
    await Order.updateOne({ _id: o._id }, { reviewed: false }); // não ficou gravada: pode tentar outra vez
    throw err;
  }
}));

// GET /api/reviews?producer=&product=&page=&limit=  -> 200 { items, total, page, pages }
// Avaliações visíveis, da mais recente para a mais antiga. Quem denunciou não é público:
// só se diz se foi o próprio utilizador (reportedByMe).
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const filter = { status: { $ne: 'hidden' } };
  if (req.query.producer) filter.producer = req.query.producer;
  if (req.query.product) filter.products = req.query.product;
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

  const total = await Review.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), pages);
  const list = await Review.find(filter).sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit).limit(limit)
    .populate('products', 'name');

  const items = list.map((r) => {
    const { reportedBy, ...rest } = r.toObject();
    return { ...rest, at: r.createdAt, reportedByMe: !!req.user && reportedBy.some((id) => id.equals(req.user.id)) };
  });
  res.json({ items, total, page, pages });
}));

// POST /api/reviews/:id/report  -> 204 | 404
// $addToSet: a mesma pessoa só conta uma vez; uma avaliação oculta não volta a aparecer
router.post('/:id/report', auth(), asyncHandler(async (req, res) => {
  const r = await Review.findOneAndUpdate(
    { _id: req.params.id, author: { $ne: req.user.id }, status: { $ne: 'hidden' } },
    { $addToSet: { reportedBy: req.user.id }, status: 'reported' }
  );
  if (!r) throw new HttpError(404, 'Avaliação não encontrada');
  req.app.get('io')?.to('admins').emit('review-reported', { id: r._id });
  res.status(204).end();
}));

module.exports = router;
