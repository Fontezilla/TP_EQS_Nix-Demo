// Só produtores validados pelo administrador podem vender em leilão (usar depois de auth('producer'))
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const verified = await User.exists({ _id: req.user.id, 'producer.verified': true });
    if (!verified) return res.status(403).json({ error: 'A sua conta ainda não foi validada pelo administrador.' });
    next();
  } catch (e) {
    next(e);
  }
};
