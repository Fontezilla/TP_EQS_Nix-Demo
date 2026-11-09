// Passo 7: leilões em tempo real
// Eventos do cliente:   'join' (auctionId), 'leave' (auctionId), 'bid' ({ auctionId, amount })
// Eventos do servidor:  'state' ({ auction, bids, now }), 'presence' (n.º), 'new-bid',
//                       'rejected' ({ message, minimum }), 'not-found', 'started' e 'ended' (do auctionCycle)
// Para todos os clientes: 'auction-updated' (nova licitação) e 'auctions-changed' (começou/terminou),
// para as listas de leilões se atualizarem sem estar sempre a perguntar ao servidor.
// Os eventos de sala levam o id do leilão, para o cliente ignorar os de uma sala que já deixou.
const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');
const { POPULATE, formatAuction, formatBid } = require('../utils/auctions');

const room = (auctionId) => `auction:${auctionId}`;
const isValid = (id) => mongoose.isValidObjectId(id);
const money = (v) => `${v.toFixed(2).replace('.', ',')} €`;

function emitPresence(io, auctionId) {
  const n = io.sockets.adapter.rooms.get(room(auctionId))?.size ?? 0;
  io.to(room(auctionId)).emit('presence', { auction: auctionId, n });
}

// Explica ao comprador porque é que a licitação não foi aceite
async function rejectionReason(auctionId, amount) {
  const a = await Auction.findById(auctionId);
  if (!a) return { message: 'Este leilão já não existe.' };
  if (a.status === 'scheduled') return { message: 'O leilão ainda não começou.' };
  if (a.status === 'ended' || a.endsAt <= new Date()) return { message: 'O leilão já terminou.' };
  const minimum = Math.round((a.currentBid.amount + a.increment) * 100) / 100;
  if (amount < minimum) return { message: `Licitação recusada: o mínimo agora é ${money(minimum)}.`, minimum };
  return { message: 'Licitação recusada. Tente outra vez.', minimum };
}

module.exports = (io, socket) => {
  socket.on('join', async (auctionId) => {
    if (!isValid(auctionId)) return socket.emit('not-found', { auction: auctionId });
    socket.join(room(auctionId));
    emitPresence(io, auctionId);

    const a = await Auction.findById(auctionId).populate(POPULATE);
    if (!a) return socket.emit('not-found', { auction: auctionId });
    const bids = await Bid.find({ auction: auctionId }).sort({ amount: -1 }).limit(20);
    // "now" permite ao cliente acertar o relógio com o do servidor (contagem sincronizada)
    socket.emit('state', { auction: formatAuction(a), bids: bids.map(formatBid), now: Date.now() });
  });

  socket.on('leave', (auctionId) => {
    socket.leave(room(auctionId));
    emitPresence(io, auctionId);
  });

  socket.on('bid', async ({ auctionId, amount } = {}) => {
    if (socket.user?.role !== 'buyer') {
      return socket.emit('rejected', { message: 'Só as contas de comprador podem licitar.' });
    }
    amount = Math.round(Number(amount) * 100) / 100;
    if (!isValid(auctionId) || !Number.isFinite(amount) || amount <= 0) {
      return socket.emit('rejected', { message: 'Valor inválido.' });
    }

    try {
      // O token pode ser de uma conta que já não existe (ex.: apagada pelo administrador)
      if (!(await User.exists({ _id: socket.user.id, role: 'buyer' }))) {
        return socket.emit('rejected', { message: 'A sua sessão já não é válida. Volte a entrar.' });
      }
      const now = new Date();
      // Desafio central: validar e gravar numa ÚNICA operação atómica. Se dois compradores licitarem
      // o mesmo valor ao mesmo tempo, só o primeiro cumpre a condição; o segundo recebe null.
      const a = await Auction.findOneAndUpdate(
        {
          _id: auctionId,
          status: 'live',
          endsAt: { $gt: now },
          $expr: { $gte: [amount, { $add: ['$currentBid.amount', '$increment'] }] }
        },
        {
          $set: { currentBid: { amount, buyer: socket.user.id, name: socket.user.name, at: now } },
          $inc: { bidCount: 1 }
        },
        { new: true }
      );
      if (!a) return socket.emit('rejected', await rejectionReason(auctionId, amount));

      // Só depois de aceite se grava a licitação e se avisa toda a sala
      const b = await Bid.create({ auction: a._id, buyer: socket.user.id, name: socket.user.name, amount });
      io.to(room(auctionId)).emit('new-bid', {
        auction: auctionId,
        currentBid: a.currentBid,
        bidCount: a.bidCount,
        bid: formatBid(b)
      });
      io.emit('auction-updated', { _id: auctionId, currentBid: a.currentBid, bidCount: a.bidCount });
    } catch (e) {
      console.error('Licitar:', e.message);
      socket.emit('rejected', { message: 'Não foi possível registar a licitação. Tente outra vez.' });
    }
  });

  // Atualizar a presença quando o utilizador fecha a página
  socket.on('disconnecting', () => {
    for (const r of socket.rooms) {
      if (r.startsWith('auction:')) {
        setImmediate(() => emitPresence(io, r.slice('auction:'.length)));
      }
    }
  });
};
