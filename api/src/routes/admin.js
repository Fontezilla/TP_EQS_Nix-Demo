// Painel do administrador
const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Auction = require('../models/Auction');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/async');
const { HttpError } = require('../utils/httpError');
const { getContainer } = require('../services/images');

router.use(auth('admin'));

const TOTAL = { $reduce: { input: '$items', initialValue: 0, in: { $add: ['$$value', { $multiply: ['$$this.unitPrice', '$$this.quantity'] }] } } };

// GET /api/admin/stats  -> 200 utilizadores, produtores, encomendas e vendas de hoje, leilões ao vivo
router.get('/stats', asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const [users, newUsers, producers, pending, [sales], live] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    User.countDocuments({ role: 'producer', 'producer.verified': true }),
    User.countDocuments({ role: 'producer', 'producer.verified': false }),
    Order.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: TOTAL } } }]),
    Auction.countDocuments({ status: 'live' })
  ]);
  res.json({
    users: { total: users, newThisWeek: newUsers },
    producers: { verified: producers, pending },
    ordersToday: { count: sales?.count || 0, total: Math.round((sales?.total || 0) * 100) / 100 },
    auctions: { live, connections: req.app.get('io')?.engine.clientsCount || 0 }
  });
}));

// GET /api/admin/producers/pending  -> 200 [produtores por validar], os mais antigos primeiro
router.get('/producers/pending', asyncHandler(async (req, res) => {
  res.json(await User.find({ role: 'producer', 'producer.verified': false }).select('name email producer createdAt').sort({ createdAt: 1 }));
}));

// PATCH /api/admin/producers/:id/verification  { approved: true|false }  -> 200 | 404
// Aprovar: os produtos passam a aparecer no catálogo. Rejeitar: a conta (e o que preparou) é apagada.
router.patch('/producers/:id/verification', asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, role: 'producer', 'producer.verified': false };
  const io = req.app.get('io');
  if (req.body.approved === true) {
    const u = await User.findOneAndUpdate(filter, { 'producer.verified': true }, { new: true });
    if (!u) throw new HttpError(404, 'Pedido não encontrado (já foi tratado?)');
    io?.to(`user:${u._id}`).emit('account-verified');
    return res.json({ result: 'approved' });
  }
  if (req.body.approved === false) {
    const u = await User.findOneAndDelete(filter);
    if (!u) throw new HttpError(404, 'Pedido não encontrado (já foi tratado?)');
    await Product.deleteMany({ producer: u._id });
    return res.json({ result: 'rejected' });
  }
  throw new HttpError(400, 'Indique se aprova ou rejeita (approved: true ou false)');
}));

// GET /api/admin/reviews/reported  -> 200 [avaliações denunciadas], as mais denunciadas primeiro
router.get('/reviews/reported', asyncHandler(async (req, res) => {
  const list = await Review.find({ status: 'reported' }).populate('producer', 'name').sort({ updatedAt: -1 });
  res.json(list.map((r) => {
    const { reportedBy, ...rest } = r.toObject();
    return { ...rest, reportCount: reportedBy.length };
  }).sort((a, b) => b.reportCount - a.reportCount));
}));

// PATCH /api/admin/reviews/:id  { decision: 'keep' | 'hide' }  -> 200 | 400 | 404
router.patch('/reviews/:id', asyncHandler(async (req, res) => {
  const { decision } = req.body;
  if (!['keep', 'hide'].includes(decision)) throw new HttpError(400, 'A decisão tem de ser keep ou hide');
  const r = await Review.findOneAndUpdate(
    { _id: req.params.id, status: 'reported' },
    decision === 'keep' ? { status: 'visible', reportedBy: [] } : { status: 'hidden' },
    { new: true }
  );
  if (!r) throw new HttpError(404, 'Avaliação não encontrada (já foi moderada?)');
  res.json(r);
}));

// PATCH /api/admin/products/:id/visibility  { hidden: true|false }  -> 200 | 400 | 404
// Moderação de conteúdos: um produto oculto sai do catálogo e não pode ser encomendado, mas o produtor continua a vê-lo
router.patch('/products/:id/visibility', asyncHandler(async (req, res) => {
  if (typeof req.body.hidden !== 'boolean') throw new HttpError(400, 'Indique se o produto fica oculto (hidden: true ou false)');
  const p = await Product.findByIdAndUpdate(req.params.id, { hidden: req.body.hidden }, { new: true });
  if (!p) throw new HttpError(404, 'Produto não encontrado');
  res.json(p);
}));

// Mede quanto tempo demora uma verificação; acima de 'slowMs' conta como resposta lenta
async function check(name, detail, probe, slowMs = 800) {
  const start = Date.now();
  try {
    const info = await probe();
    const ms = Date.now() - start;
    return { name, detail, status: ms > slowMs ? 'slow' : 'ok', ms, info };
  } catch (e) {
    return { name, detail, status: 'down', ms: Date.now() - start, info: e.message };
  }
}

// GET /api/admin/services  -> 200 [estado de cada serviço]: API, Socket.io, MongoDB Atlas, imagens e Swagger
router.get('/services', asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  // A API testa-se a si própria: o pedido pode vir de outro serviço (ex.: o backoffice num contentor)
  const base = `http://localhost:${process.env.PORT || 3000}`;
  res.json(await Promise.all([
    check('API REST', process.env.WEBSITE_SITE_NAME ? 'Azure App Service' : 'Node.js · Express', async () => `ativa há ${Math.round(process.uptime() / 60)} min`),
    check('Tempo real', 'Socket.io', async () => {
      if (!io) throw new Error('Socket.io não está ligado');
      return `${io.engine.clientsCount} ligações`;
    }),
    check('Base de dados', 'MongoDB Atlas', async () => {
      await mongoose.connection.db.admin().ping();
      return 'ligada';
    }),
    check('Imagens', process.env.STORAGE_CONN ? 'Azure Blob Storage' : 'Pasta local (sem storage na Cloud)', async () => {
      if (!process.env.STORAGE_CONN) return 'em desenvolvimento';
      await getContainer().getProperties();
      return 'contentor acessível';
    }),
    check('Documentação da API', 'Swagger UI, /api-docs', async () => {
      const r = await fetch(`${base}/api-docs/`);
      if (!r.ok) throw new Error(`respondeu ${r.status}`);
      return 'disponível';
    })
  ]));
}));

module.exports = router;
