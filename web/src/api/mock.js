// Passo 2: "base de dados" em memória a partir dos JSON de src/data (os mesmos que o seed usa no Passo 4).
// As datas dos JSON são relativas ("-25m", "+1d18:00") para haver sempre leilões ao vivo.
import users from '../data/users.json';
import products from '../data/products.json';
import auctions from '../data/auctions.json';
import bids from '../data/bids.json';
import orders from '../data/orders.json';
import reviews from '../data/reviews.json';

const NOW = Date.now();
const UNITS = { s: 1e3, m: 6e4, h: 36e5 };

export function when(relative) {
  const short = /^([+-]\d+)([smh])$/.exec(relative);
  if (short) return new Date(NOW + Number(short[1]) * UNITS[short[2]]).toISOString();
  const [, days, h, min] = /^([+-]\d+)d(\d\d):(\d\d)$/.exec(relative);
  const date = new Date(NOW);
  date.setDate(date.getDate() + Number(days));
  date.setHours(Number(h), Number(min), 0, 0);
  return date.toISOString();
}

export const db = {
  users: users.map((u) => ({ ...u, createdAt: u.createdAt && when(u.createdAt) })),
  products: products.map((p) => ({ ...p })),
  auctions: auctions.map(({ start, durationMin, ...a }) => {
    const startsAt = when(start);
    return { ...a, startsAt, endsAt: new Date(Date.parse(startsAt) + durationMin * 6e4).toISOString() };
  }),
  bids: bids.map((b) => ({ ...b, at: when(b.at) })),
  orders: orders.map((o) => ({
    ...o,
    createdAt: when(o.createdAt),
    history: o.history.map((h) => ({ ...h, at: when(h.at) }))
  })),
  reviews: reviews.map((r) => ({ ...r, at: when(r.at) }))
};

export const byId = (collection, id) => db[collection].find((d) => d._id === id);

// Simula a latência da rede e devolve uma cópia, como faria a API
export const respond = (data) => new Promise((ok) => setTimeout(() => ok(structuredClone(data)), 120));

export function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  return Promise.reject(e);
}

// Média das avaliações visíveis que cumprem o critério
export function average(criterion) {
  const list = db.reviews.filter((r) => r.status !== 'hidden' && criterion(r));
  const sum = list.reduce((s, r) => s + r.rating, 0);
  return { average: list.length ? Math.round((sum / list.length) * 10) / 10 : null, count: list.length };
}

// Dados públicos do produtor que acompanham produtos e leilões (como um populate)
export function producerSummary(id) {
  const u = byId('users', id);
  return { _id: u._id, name: u.name, city: u.producer.city };
}
