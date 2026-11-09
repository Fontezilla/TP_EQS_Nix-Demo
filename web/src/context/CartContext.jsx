// Estado global do cesto. Guardado no browser para não se perder ao recarregar a página.
// Cada linha guarda uma cópia do produto para mostrar o cesto; o preço final é sempre o da API.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'cart';

const summary = (p) => ({
  _id: p._id, name: p.name, price: p.price, unit: p.unit, stock: p.stock,
  category: p.category, imageUrl: p.imageUrl, producer: p.producer
});

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  }); // [{ product, quantity }]

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* sem armazenamento: fica só em memória */ }
  }, [items]);

  // Nunca passa do stock que o produto tinha quando foi adicionado (a API volta a confirmar)
  const clamp = (product, q) => Math.max(1, Math.min(q, product.stock ?? q));

  function add(product, quantity = 1) {
    setItems((current) => {
      const existing = current.find((i) => i.product._id === product._id);
      if (existing) {
        return current.map((i) => (i.product._id === product._id
          ? { ...i, quantity: clamp(i.product, i.quantity + quantity) } : i));
      }
      return [...current, { product: summary(product), quantity: clamp(product, quantity) }];
    });
  }

  function setQuantity(productId, quantity) {
    setItems((current) => current.map((i) => (i.product._id === productId ? { ...i, quantity: clamp(i.product, quantity) } : i)));
  }

  function remove(productId) {
    setItems((current) => current.filter((i) => i.product._id !== productId));
  }

  const clear = () => setItems([]);

  // Uma encomenda por produtor: o cesto mostra-se agrupado da mesma forma
  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((i) => {
      const id = i.product.producer._id;
      if (!map.has(id)) map.set(id, { producer: i.product.producer, items: [], subtotal: 0 });
      const g = map.get(id);
      g.items.push(i);
      g.subtotal += i.product.price * i.quantity;
    });
    return [...map.values()];
  }, [items]);

  const total = useMemo(() => items.reduce((s, i) => s + i.product.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, groups, total, add, setQuantity, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
