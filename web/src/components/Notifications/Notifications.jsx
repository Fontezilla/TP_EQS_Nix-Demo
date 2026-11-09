// Passo 7: avisos em tempo real (sala pessoal do utilizador no Socket.io), em qualquer página.
// Comprador: estado da encomenda mudou, leilão ganho (com prazo para confirmar) ou perdido. Produtor: encomenda nova.
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEvents } from '../../context/SocketContext.jsx';
import { orderNumber } from '../../api/orders.js';
import { STATUS_LABELS } from '../OrderProgress/OrderProgress.jsx';
import { euro, time } from '../../utils/format.js';
import './Notifications.scss';

const DURATION = 8000;

export default function Notifications() {
  const [notices, setNotices] = useState([]);
  const { pathname } = useLocation();

  const show = (notice) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotices((list) => [...list.slice(-2), { ...notice, id }]);
    setTimeout(() => setNotices((list) => list.filter((n) => n.id !== id)), DURATION);
  };
  const close = (id) => setNotices((list) => list.filter((n) => n.id !== id));

  useEvents(['order-updated'], (e) => {
    if (pathname === '/orders') return; // a própria página já mostra o aviso
    show({ icon: 'bell-fill', text: <><b>{e.producer}</b> marcou a encomenda {orderNumber(e.id)} como <b>{STATUS_LABELS[e.status].toLowerCase()}</b>.</>, to: '/orders', action: 'Ver encomendas' });
  });
  useEvents(['auction-won'], (e) => {
    show({ icon: 'trophy-fill', text: <><b>Ganhou o leilão {e.lot}</b> por {euro(e.amount)}. Confirme a compra até às {time(e.deadline)}.</>, to: '/orders', action: 'Confirmar compra' });
  });
  useEvents(['auction-lost'], (e) => {
    show({ icon: 'hourglass-bottom', text: <>O prazo para confirmar <b>{e.lot}</b> terminou. O lote passou a outro comprador.</>, to: '/auctions', action: 'Ver leilões' });
  });
  useEvents(['new-order'], (e) => {
    show({ icon: 'basket-fill', text: <><b>Encomenda nova</b> de {e.buyer}, {euro(e.total)}.</>, to: '/producer', action: 'Ver no painel' });
  });

  if (notices.length === 0) return null;

  return (
    <div className="notifications" role="status" aria-live="polite">
      {notices.map((n) => (
        <div className="notification" key={n.id}>
          <i className={`bi bi-${n.icon}`} aria-hidden="true" />
          <div>
            <p className="mb-1">{n.text}</p>
            <Link to={n.to} onClick={() => close(n.id)}>{n.action}</Link>
          </div>
          <button type="button" className="btn-close btn-close-white" aria-label="Fechar aviso" onClick={() => close(n.id)} />
        </div>
      ))}
    </div>
  );
}
