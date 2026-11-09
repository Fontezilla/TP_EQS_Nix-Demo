// Passo 6: autenticação por JWT + controlo de acesso por papel.
// Uso: router.post('/', auth('producer'), handler)  -> só produtores
//      router.get('/', auth(), handler)             -> qualquer utilizador autenticado
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (...roles) => async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role, name }
  } catch {
    return res.status(401).json({ error: 'Token inválido ou em falta' });
  }
  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Sem permissão' });
  }
  // Um token continua válido até expirar: confirma que a conta ainda existe com o mesmo papel
  // (ex.: um produtor rejeitado e apagado pelo administrador deixa logo de ter acesso)
  try {
    if (!(await User.exists({ _id: req.user.id, role: req.user.role }))) {
      return res.status(401).json({ error: 'A sessão já não é válida. Volte a entrar.' });
    }
  } catch (e) {
    return next(e);
  }
  next();
};
