// Ponto de entrada: servidor HTTP partilhado pela API REST e pelo Socket.io
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
const registerSockets = require('./sockets');
const startAuctionCycle = require('./services/auctionCycle');
const corsOrigin = require('./config/cors');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: corsOrigin }
  });

  // Disponibiliza o io às rotas (ex.: notificar o comprador quando a encomenda muda)
  app.set('io', io);
  registerSockets(io);
  startAuctionCycle(io);

  server.listen(PORT, () => {
    console.log(`API em http://localhost:${PORT}`);
    console.log(`Documentação em http://localhost:${PORT}/api-docs`);
  });
}

start().catch((err) => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});
