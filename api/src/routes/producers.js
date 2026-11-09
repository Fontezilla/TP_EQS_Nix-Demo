// Páginas públicas dos produtores
const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Auction = require('../models/Auction');
const { POPULATE, formatAuction } = require('../utils/auctions');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const asyncHandler = require('../utils/async');
const { HttpError } = require('../utils/httpError');

// GET /api/producers?city=  -> 200 [produtores validados]
router.get('/', asyncHandler(async (req, res) => {
  const filter = { role: 'producer', 'producer.verified': true };
  if (req.query.city) filter['producer.city'] = req.query.city;
  res.json(await User.find(filter).select('name producer').sort('name'));
}));

// PUT /api/producers/me  (produtor)  -> 200 dados da página pública
// Só se copiam os campos editáveis: o produtor não pode mudar o papel nem validar-se a si próprio
router.put('/me', auth('producer'), asyncHandler(async (req, res) => {
  const { name, description, city, address, location } = req.body;
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  if (location && (!(Math.abs(lat) <= 90) || !(Math.abs(lng) <= 180))) throw new HttpError(400, 'Localização inválida');

  const u = await User.findOneAndUpdate(
    { _id: req.user.id, role: 'producer' },
    {
      name,
      'producer.description': description,
      'producer.city': city,
      'producer.address': address,
      ...(location && { 'producer.location': { lat, lng } })
    },
    { new: true, runValidators: true }
  ).select('name producer');
  if (!u) throw new HttpError(404, 'Produtor não encontrado');
  res.json(u);
}));

// Total de uma encomenda dentro de um aggregate (soma de preço x quantidade das linhas)
const TOTAL = { $reduce: { input: '$items', initialValue: 0, in: { $add: ['$$value', { $multiply: ['$$this.unitPrice', '$$this.quantity'] }] } } };

// GET /api/producers/me/summary  (produtor)  -> 200 indicadores do painel
// Vendas do mês e variação face ao mês anterior, encomendas por tratar, stock baixo, avaliação e leilão ao vivo
router.get('/me/summary', auth('producer'), asyncHandler(async (req, res) => {
  const producer = new mongoose.Types.ObjectId(req.user.id);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [u, sales, toHandle, toCollect, productCount, lowStock, [rating], live] = await Promise.all([
    User.findById(producer).select('name producer.verified'),
    Order.aggregate([
      { $match: { producer, createdAt: { $gte: previousMonthStart } } },
      { $group: { _id: { $cond: [{ $gte: ['$createdAt', monthStart] }, 'current', 'previous'] }, total: { $sum: TOTAL }, count: { $sum: 1 } } }
    ]),
    Order.countDocuments({ producer, status: { $in: ['pending', 'confirmed', 'ready'] } }),
    Order.countDocuments({ producer, status: 'ready', 'delivery.type': 'pickup' }),
    Product.countDocuments({ producer }),
    Product.find({ producer, $expr: { $lte: ['$stock', '$minStock'] } }).sort({ stock: 1 }).select('name stock minStock unit category imageUrl'),
    Review.aggregate([
      { $match: { producer, status: { $ne: 'hidden' } } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]),
    Auction.findOne({ producer, status: 'live' }).sort({ endsAt: 1 }).populate(POPULATE)
  ]);

  if (!u) throw new HttpError(404, 'Produtor não encontrado');
  const month = (key) => sales.find((s) => s._id === key) || { total: 0, count: 0 };
  const current = month('current');
  const previous = month('previous');
  res.json({
    name: u.name,
    verified: u.producer.verified,
    sales: {
      month: Math.round(current.total * 100) / 100,
      orders: current.count,
      previousMonth: Math.round(previous.total * 100) / 100,
      change: previous.total ? Math.round(((current.total - previous.total) / previous.total) * 100) : null
    },
    orders: { toHandle, toCollect },
    products: { total: productCount, lowStock },
    rating: { average: rating ? Math.round(rating.average * 10) / 10 : null, count: rating?.count || 0 },
    liveAuction: live ? formatAuction(live) : null
  });
}));

// GET /api/producers/:id  -> 200 { _id, name, producer } | 404
// Um produtor ainda por validar só é visível para ele próprio
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const own = req.user?.id === req.params.id;
  const u = await User.findOne({ _id: req.params.id, role: 'producer', ...(!own && { 'producer.verified': true }) })
    .select('name producer');
  if (!u) throw new HttpError(404, 'Produtor não encontrado');

  // Os produtos e as avaliações têm endpoints próprios, com paginação (/products?producer=, /reviews?producer=)
  const [rating] = await Review.aggregate([
    { $match: { producer: u._id, status: { $ne: 'hidden' } } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  res.json({
    _id: u._id,
    name: u.name,
    producer: {
      ...u.producer.toObject(),
      averageRating: rating ? Math.round(rating.average * 10) / 10 : null,
      reviewCount: rating?.count || 0
    }
  });
}));

module.exports = router;
