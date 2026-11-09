// Avaliações
import { api, USE_MOCK_DATA } from './client.js';
import { db, byId, respond, fail } from './mock.js';

export function reportReview(id, token) {
  if (!USE_MOCK_DATA) return api(`/reviews/${id}/report`, { method: 'POST', token });

  const r = byId('reviews', id);
  const who = token.replace('mock.', '');
  if (!r || r.author === who || r.status === 'hidden') return fail(404, 'Avaliação não encontrada');
  if (!r.reportedBy.includes(who)) r.reportedBy.push(who);
  r.status = 'reported';
  return respond(null);
}

// filter: { producer, page, limit } -> { items, total, page, pages }, da mais recente para a mais antiga
export function listReviews(filter = {}, token) {
  if (!USE_MOCK_DATA) return api(`/reviews?${new URLSearchParams(filter)}`, { token });

  const list = db.reviews
    .filter((r) => r.status !== 'hidden' && (!filter.producer || r.producer === filter.producer))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const limit = filter.limit || 10;
  const pages = Math.max(1, Math.ceil(list.length / limit));
  const page = Math.min(Math.max(1, filter.page || 1), pages);
  const items = list.slice((page - 1) * limit, page * limit).map(({ reportedBy, ...r }) => ({
    ...r,
    products: r.products.map((id) => ({ _id: id, name: byId('products', id)?.name })),
    reportedByMe: reportedBy.some((id) => token === `mock.${id}`)
  }));
  return respond({ items, total: list.length, page, pages });
}

// Avaliar uma encomenda entregue: { order, rating, comment }
export function createReview(data, token) {
  if (!USE_MOCK_DATA) return api('/reviews', { method: 'POST', body: data, token });
  return fail(503, 'Avaliar precisa da API ligada.');
}
