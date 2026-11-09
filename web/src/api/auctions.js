// Leilões. O estado (scheduled, live, ended) vem das datas, como no ciclo do servidor.
import { api, USE_MOCK_DATA } from './client.js';
import { db, byId, respond, fail, producerSummary } from './mock.js';

function statusOf(a, now = Date.now()) {
  if (now < Date.parse(a.startsAt)) return 'scheduled';
  if (now < Date.parse(a.endsAt)) return 'live';
  return 'ended';
}

function complete(a) {
  const bids = db.bids.filter((b) => b.auction === a._id && Date.parse(b.at) <= Date.now());
  const last = bids.reduce((max, b) => (!max || b.amount > max.amount ? b : max), null);
  const product = byId('products', a.product);
  return {
    ...a,
    status: statusOf(a),
    product: { _id: product._id, name: product.name, category: product.category, imageUrl: product.imageUrl, unit: product.unit },
    producer: producerSummary(a.producer),
    currentBid: last
      ? { amount: last.amount, buyer: last.buyer, name: last.name, at: last.at }
      : { amount: a.startPrice },
    bidCount: bids.length
  };
}

const SORTS = {
  live: (a, b) => Date.parse(a.endsAt) - Date.parse(b.endsAt),
  scheduled: (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
  ended: (a, b) => Date.parse(b.endsAt) - Date.parse(a.endsAt)
};

// filter: { status, page, limit } -> { items, total, page, pages }
// Ao vivo pelos que acabam primeiro, agendados pelos que começam primeiro, terminados dos mais recentes
export function listAuctions(filter = {}) {
  if (!USE_MOCK_DATA) return api(`/auctions?${new URLSearchParams(filter)}`);

  const list = db.auctions.map(complete)
    .filter((a) => !filter.status || a.status === filter.status)
    .sort(SORTS[filter.status] || SORTS.scheduled);
  const limit = filter.limit || 20;
  const pages = Math.max(1, Math.ceil(list.length / limit));
  const page = Math.min(Math.max(1, filter.page || 1), pages);
  return respond({ items: list.slice((page - 1) * limit, page * limit), total: list.length, page, pages });
}

export function getAuction(id) {
  if (!USE_MOCK_DATA) return api(`/auctions/${id}`);
  const a = byId('auctions', id);
  if (!a) return fail(404, 'Leilão não encontrado');
  return respond({
    ...complete(a),
    bids: db.bids.filter((b) => b.auction === id && Date.parse(b.at) <= Date.now())
      .sort((x, y) => y.amount - x.amount)
  });
}

// Leilões ganhos pelo comprador à espera da confirmação da compra (com prazo)
export const listAwaitingConfirmation = (token) => api('/auctions/awaiting', { token });
export const confirmAuction = (id, payment, token) => api(`/auctions/${id}/confirm`, { method: 'POST', body: { payment }, token });
export const declineAuction = (id, token) => api(`/auctions/${id}/decline`, { method: 'POST', token });

// Produtor: criar leilão { product, lot, quantity, description, startPrice, increment, durationMin, startsAt? }
export const createAuction = (data, token) => api('/auctions', { method: 'POST', body: data, token });
