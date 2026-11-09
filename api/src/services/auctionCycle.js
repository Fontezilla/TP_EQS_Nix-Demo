// Ciclo de vida dos leilões, verificado a cada 2 s: scheduled -> live -> ended.
// Quando termina, o vencedor tem um prazo para confirmar a compra (ver services/awarding.js).
const Auction = require('../models/Auction');
const { openConfirmation, checkDeadlines } = require('./awarding');

async function tick(io) {
  const now = new Date();
  const starting = await Auction.find({ status: 'scheduled', startsAt: { $lte: now } }).select('_id');
  if (starting.length) {
    await Auction.updateMany({ _id: { $in: starting.map((a) => a._id) }, status: 'scheduled' }, { status: 'live' });
    starting.forEach((a) => io?.to(`auction:${a._id}`).emit('started', { auction: a._id }));
    io?.emit('auctions-changed');
  }

  // Um a um e de forma atómica: se dois ciclos correrem ao mesmo tempo, só um fecha cada leilão
  let auction;
  // eslint-disable-next-line no-cond-assign
  while ((auction = await Auction.findOneAndUpdate(
    { status: 'live', endsAt: { $lte: now } }, { status: 'ended' }, { new: true }
  ))) {
    io?.to(`auction:${auction._id}`).emit('ended', { auction: auction._id, currentBid: auction.currentBid });
    await openConfirmation(io, auction);
  }

  await checkDeadlines(io);
}

module.exports = function startAuctionCycle(io) {
  const run = () => tick(io).catch((e) => console.error('Ciclo dos leilões:', e.message));
  run();
  return setInterval(run, 2000);
};
