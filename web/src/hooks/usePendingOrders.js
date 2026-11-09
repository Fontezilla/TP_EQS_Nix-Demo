// Encomendas do produtor por tratar; volta a contar quando chega uma nova
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useEvents } from '../context/SocketContext.jsx';
import { useData } from './useData.js';
import { listOrders } from '../api/orders.js';

export function usePendingOrders(version = 0) {
  const { token } = useAuth();
  const [newOrders, setNewOrders] = useState(0);
  const { data } = useData(() => listOrders({ status: 'pending,confirmed,ready', limit: 1 }, token), [token, version, newOrders]);
  useEvents(['new-order'], () => setNewOrders((n) => n + 1));
  return data?.total || 0;
}
