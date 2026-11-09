// Passo 7: autenticação dos sockets com o mesmo JWT da API.
// Sem token, a ligação é aceite como visitante: pode assistir aos leilões, mas não licitar.
const jwt = require('jsonwebtoken');
const registerAuctions = require('./auctions');

module.exports = (io) => {
  io.use((socket, next) => {
    const { token } = socket.handshake.auth || {};
    if (!token) return next();
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('não autorizado')); // token inválido ou expirado: o cliente deve voltar a entrar
    }
  });

  io.on('connection', (socket) => {
    // Sala pessoal: permite notificar este utilizador (ex.: estado da encomenda, leilão ganho)
    if (socket.user) socket.join(`user:${socket.user.id}`);
    // Os administradores recebem avisos para moderar (produtor novo, avaliação denunciada)
    if (socket.user?.role === 'admin') socket.join('admins');
    registerAuctions(io, socket);
  });
};
