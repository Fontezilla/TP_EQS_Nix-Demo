// Encomendas (só com a API: o fluxo de compra precisa do servidor para reservar o stock)
import { api } from './client.js';

// items: [{ product, quantity }]; deliveries: { [producerId]: { type, address } }; payment: ver PaymentForm
export const createOrders = (items, deliveries, payment, token) =>
  api('/orders', { method: 'POST', body: { items, deliveries, payment }, token });

// filter: { status, page, limit } -> { items, total, page, pages }
export const listOrders = (filter, token) =>
  api(`/orders?${new URLSearchParams(filter)}`, { token });

export const updateOrderStatus = (id, status, token) =>
  api(`/orders/${id}/status`, { method: 'PATCH', body: { status }, token });

// Número curto para mostrar ao utilizador (#DCM-…), a partir do fim do id
export const orderNumber = (id) => `#DCM-${String(id).slice(-5).toUpperCase()}`;
