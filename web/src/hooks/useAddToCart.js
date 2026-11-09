// O que acontece no botão "+" de um produto: o comprador adiciona ao cesto, o visitante vai entrar primeiro.
// Produtor e administrador não compram: devolve undefined e o cartão não mostra o botão.
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export function useAddToCart() {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (user?.role === 'buyer') return (product) => cart.add(product);
  if (!user) return () => navigate('/login', { state: { from: pathname } });
  return undefined;
}
