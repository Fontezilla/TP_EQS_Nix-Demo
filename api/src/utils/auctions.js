// Forma dos leilões e licitações enviada à SPA (pela API REST e pelo Socket.io)
const POPULATE = [
  { path: 'product', select: 'name category imageUrl unit' },
  { path: 'producer', select: 'name producer.city' }
];

// Quem desistiu de um lote não é público
const formatAuction = (a) => {
  const { declined, ...o } = a.toObject(); // eslint-disable-line no-unused-vars
  return { ...o, producer: { _id: a.producer._id, name: a.producer.name, city: a.producer.producer?.city } };
};

const formatBid = (b) => ({ _id: b._id, buyer: b.buyer, name: b.name, amount: b.amount, at: b.createdAt });

module.exports = { POPULATE, formatAuction, formatBid };
