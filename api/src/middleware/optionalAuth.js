// Para rotas públicas que mostram mais a quem tem sessão: lê o token se existir, sem o exigir
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch { /* token inválido: segue como visitante */ }
  }
  next();
};
