// Passo 6: registo e login
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/async');
const { HttpError } = require('../utils/httpError');

function session(u) {
  const token = jwt.sign({ id: u._id, role: u.role, name: u.name }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
  return { token, user: u.toPublic() };
}

// POST /api/auth/register  -> 201 { token, user }
// Só se escolhem os campos permitidos (nunca o papel admin nem producer.verified vindos do cliente)
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, role, producer } = req.body;
  if (!['buyer', 'producer'].includes(role)) throw new HttpError(400, 'Tipo de conta inválido');
  if (typeof password !== 'string' || password.length < 8) throw new HttpError(400, 'A password precisa de pelo menos 8 caracteres');
  if (await User.exists({ email: String(email).toLowerCase().trim() })) throw new HttpError(409, 'Já existe uma conta com este email.');

  const u = await User.create({
    name, email, role,
    passwordHash: await bcrypt.hash(password, 12),
    ...(role === 'producer' && {
      producer: { city: producer?.city, address: producer?.address, description: producer?.description, verified: false }
    })
  });
  if (role === 'producer') req.app.get('io')?.to('admins').emit('producer-registered', { id: u._id, name: u.name });
  res.status(201).location('/api/auth/me').json(session(u));
}));

// POST /api/auth/login  -> 200 { token, user } | 401
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email: String(email || '').toLowerCase().trim() }).select('+passwordHash');
  // A mesma mensagem para email e password errados, para não revelar que contas existem
  if (!u || !(await bcrypt.compare(String(password || ''), u.passwordHash))) {
    throw new HttpError(401, 'O email ou a password não estão corretos.');
  }
  res.json(session(u));
}));

// GET /api/auth/me  -> 200 dados do utilizador autenticado
router.get('/me', auth(), asyncHandler(async (req, res) => {
  const u = await User.findById(req.user.id);
  if (!u) throw new HttpError(404, 'Utilizador não encontrado');
  res.json(u.toPublic());
}));

module.exports = router;
