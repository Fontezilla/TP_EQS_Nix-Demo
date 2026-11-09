// Passo 3: recurso /api/products
const router = require('express').Router();
const multer = require('multer');
const Product = require('../models/Product');
const User = require('../models/User');
const Auction = require('../models/Auction');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const asyncHandler = require('../utils/async');
const { HttpError } = require('../utils/httpError');
const { accentInsensitiveRegex } = require('../utils/text');
const { saveImage, deleteImage } = require('../services/images');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const SORTS = { newest: { createdAt: -1, _id: 1 }, name: { name: 1 }, 'price-asc': { price: 1, _id: 1 }, 'price-desc': { price: -1, _id: 1 } };
const asList = (v) => (v === undefined ? [] : [].concat(v)); // ?cities=a&cities=b

// Forma usada pela SPA: o produtor vem resumido
const formatProduct = (p) => {
  const o = p.toObject();
  const u = p.producer;
  return { ...o, producer: u?._id ? { _id: u._id, name: u.name, city: u.producer?.city } : o.producer };
};

// GET /api/products?q=&category=&organic=&season=&cities=&producer=&maxPrice=&sort=&page=&limit=
//   -> 200 { items, total, page, pages }
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { q, category, organic, season, maxPrice, sort, producer } = req.query;
  const limit = Math.min(Math.max(Number(req.query.limit) || 15, 1), 1000);

  // Só aparecem produtos de produtores validados (e da localidade pedida);
  // na sua própria página, um produtor por validar também vê os seus
  const own = producer && req.user?.id === producer;
  const producerFilter = { role: 'producer', ...(!own && { 'producer.verified': true }) };
  if (producer) producerFilter._id = producer;
  const cities = asList(req.query.cities);
  if (cities.length) producerFilter['producer.city'] = { $in: cities };
  const producers = await User.find(producerFilter).select('_id name');

  // Os produtos ocultados pelo administrador só aparecem ao próprio produtor
  const filter = { producer: { $in: producers.map((u) => u._id) }, ...(!own && { hidden: { $ne: true } }) };
  if (q) {
    // Pesquisa por nome, ingrediente (descrição) ou nome do produtor
    const re = accentInsensitiveRegex(String(q).trim());
    filter.$or = [{ name: re }, { description: re }, { producer: { $in: producers.filter((u) => re.test(u.name)).map((u) => u._id) } }];
  }
  if (category) filter.category = category;
  if (organic === 'true') filter.organic = true;
  if (season) filter.seasons = season;
  if (maxPrice) filter.price = { $lte: Number(maxPrice) };

  const total = await Product.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), pages);
  const items = await Product.find(filter)
    .sort(SORTS[sort] || SORTS.newest)
    .skip((page - 1) * limit).limit(limit)
    .populate('producer', 'name producer.city');

  res.json({ items: items.map(formatProduct), total, page, pages });
}));

// GET /api/products/:id  -> 200 | 404 (um produto ocultado só existe para o próprio produtor)
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id).populate('producer', 'name producer.city');
  if (!p || (p.hidden && req.user?.id !== String(p.producer._id))) throw new HttpError(404, 'Produto não encontrado');
  res.json(formatProduct(p));
}));

// Só estes campos podem vir do cliente (evita mass assignment: o produtor nunca vem do corpo do pedido)
const FIELDS = ['name', 'description', 'category', 'price', 'unit', 'stock', 'minStock', 'organic', 'seasons'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
const baseUrl = (req) => `${req.protocol}://${req.get('host')}`;

// POST /api/products  (produtor)  -> 201 + Location | 400
router.post('/', auth('producer'), asyncHandler(async (req, res) => {
  const p = await Product.create({ ...pick(req.body), producer: req.user.id });
  res.status(201).location(`/api/products/${p._id}`).json(p);
}));

// PUT /api/products/:id  (produtor dono)  -> 200 | 400 | 404
// 404 (e não 403) quando o produto é de outro produtor: não se revela que existe
router.put('/:id', auth('producer'), asyncHandler(async (req, res) => {
  const p = await Product.findOneAndUpdate({ _id: req.params.id, producer: req.user.id }, pick(req.body),
    { new: true, runValidators: true });
  if (!p) throw new HttpError(404, 'Produto não encontrado');
  res.json(p);
}));

// DELETE /api/products/:id  (produtor dono)  -> 204 | 404 | 409
// As encomendas guardam cópia do nome e do preço, por isso não ficam afetadas
router.delete('/:id', auth('producer'), asyncHandler(async (req, res) => {
  const inAuction = await Auction.exists({ product: req.params.id, status: { $in: ['scheduled', 'live'] } });
  if (inAuction) throw new HttpError(409, 'Este produto tem um leilão agendado ou a decorrer');
  const p = await Product.findOneAndDelete({ _id: req.params.id, producer: req.user.id });
  if (!p) throw new HttpError(404, 'Produto não encontrado');
  await deleteImage(p.imageUrl);
  res.status(204).end();
}));

// POST /api/products/:id/image  (multipart, campo "image", até 5 MB)  -> 200 produto
// Passo 8: com STORAGE_CONN vai para o Azure Blob Storage (services/images.js)
router.post('/:id/image', auth('producer'), upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Escolha uma fotografia');
  const before = await Product.findOne({ _id: req.params.id, producer: req.user.id });
  if (!before) throw new HttpError(404, 'Produto não encontrado');
  const imageUrl = await saveImage(req.file, baseUrl(req));
  const p = await Product.findByIdAndUpdate(before._id, { imageUrl }, { new: true });
  await deleteImage(before.imageUrl);
  res.json(p);
}));

// DELETE /api/products/:id/image  (produtor dono)  -> 200 produto (volta à ilustração da categoria)
router.delete('/:id/image', auth('producer'), asyncHandler(async (req, res) => {
  const before = await Product.findOneAndUpdate({ _id: req.params.id, producer: req.user.id }, { $unset: { imageUrl: 1 } });
  if (!before) throw new HttpError(404, 'Produto não encontrado');
  await deleteImage(before.imageUrl);
  res.json(await Product.findById(before._id));
}));

module.exports = router;
