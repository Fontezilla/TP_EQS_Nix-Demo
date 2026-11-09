// Produtos e produtores. Com USE_MOCK_DATA lê os JSON; senão pede à API (Passo 3).
import { api, USE_MOCK_DATA } from './client.js';
import { db, byId, respond, fail, average, producerSummary } from './mock.js';
import { normalize } from '../utils/format.js';

const isVerified = (producerId) => byId('users', producerId)?.producer?.verified;

function withProducer(p) {
  const { average: avg, count } = average((r) => r.products.includes(p._id));
  return { ...p, producer: producerSummary(p.producer), averageRating: avg, reviewCount: count };
}

const SORTS = {
  newest: () => 0,
  name: (a, b) => a.name.localeCompare(b.name),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price
};

// filter: { q, category, organic, season, cities: [], producer, maxPrice, sort, page, limit }
// Devolve uma página: { items, total, page, pages }
export function listProducts(filter = {}, token) {
  if (!USE_MOCK_DATA) {
    const q = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((x) => q.append(k, x));
      else if (v !== undefined && v !== '' && v !== false) q.set(k, v);
    });
    return api(`/products?${q}`, { token });
  }

  const text = normalize(filter.q || '');
  const list = db.products
    .filter((p) => (isVerified(p.producer) && !p.hidden) || (filter.producer === p.producer && token === `mock.${p.producer}`))
    .map(withProducer)
    .filter((p) =>
      (!text || [p.name, p.description, p.producer.name].some((t) => normalize(t).includes(text))) &&
      (!filter.producer || p.producer._id === filter.producer) &&
      (!filter.category || p.category === filter.category) &&
      (!filter.organic || p.organic) &&
      (!filter.season || p.seasons.includes(filter.season)) &&
      (!filter.cities?.length || filter.cities.includes(p.producer.city)) &&
      (!filter.maxPrice || p.price <= filter.maxPrice))
    .sort(SORTS[filter.sort] || SORTS.newest);

  const limit = filter.limit || 15;
  const pages = Math.max(1, Math.ceil(list.length / limit));
  const page = Math.min(Math.max(1, filter.page || 1), pages);
  return respond({ items: list.slice((page - 1) * limit, page * limit), total: list.length, page, pages });
}

// Página pública: dados do produtor e média das avaliações (produtos e avaliações têm pedidos próprios).
// Com token, o próprio produtor vê a página mesmo antes de ser validado.
export function getProducer(id, token) {
  if (!USE_MOCK_DATA) return api(`/producers/${id}`, { token });

  const u = byId('users', id);
  const own = token === `mock.${id}`;
  if (!u || u.role !== 'producer' || (!u.producer.verified && !own)) return fail(404, 'Produtor não encontrado');
  const { average: avg, count } = average((r) => r.producer === id);
  return respond({ _id: u._id, name: u.name, producer: { ...u.producer, averageRating: avg, reviewCount: count } });
}

// O produtor edita a sua página pública: { name, description, city, address, location: { lat, lng } }
export function updateProducerPage(data, token) {
  if (!USE_MOCK_DATA) return api('/producers/me', { method: 'PUT', body: data, token });

  const u = byId('users', token.replace('mock.', ''));
  const { name, ...producer } = data;
  u.name = name;
  u.producer = { ...u.producer, ...producer };
  return respond({ _id: u._id, name: u.name, producer: u.producer });
}

// Painel do produtor: indicadores (vendas do mês, encomendas por tratar, stock baixo, avaliação, leilão ao vivo)
export const getDashboardSummary = (token) => api('/producers/me/summary', { token });

// Os meus produtos (produtor). Só com a API: a fotografia vai para o servidor (Passo 8: storage na Cloud)
export const createProduct = (data, token) => api('/products', { method: 'POST', body: data, token });
export const updateProduct = (id, data, token) => api(`/products/${id}`, { method: 'PUT', body: data, token });
export const deleteProduct = (id, token) => api(`/products/${id}`, { method: 'DELETE', token });
export const deleteImage = (id, token) => api(`/products/${id}/image`, { method: 'DELETE', token });
export function uploadImage(id, file, token) {
  const body = new FormData();
  body.append('image', file);
  return api(`/products/${id}/image`, { method: 'POST', body, token });
}
