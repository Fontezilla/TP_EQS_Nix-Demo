// Barra de separadores fixa em baixo, só no telemóvel.
// Produtor: o 1.º toque em "Painel" abre o resumo; já dentro do painel, tocar outra vez abre por cima
// as 5 secções do painel, que fecham ao escolher uma (ou ao tocar fora). A barra das secções fica sempre
// na página (escondida) para poder animar ao abrir e ao fechar.
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { usePendingOrders } from '../../hooks/usePendingOrders.js';
import { TABS, panelLinks } from '../Navbar/links.js';
import './TabBar.scss';

function PanelTray({ userId, open }) {
  const toHandle = usePendingOrders();
  return (
    <nav id="panel-tray" className={`panel-tray ${open ? 'is-open' : ''}`} aria-label="Secções do painel">
      {panelLinks(userId).map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} aria-label={l.short && l.label}
          className={({ isActive }) => (isActive ? 'is-active' : '')}>
          <i className={`bi bi-${l.icon}`} aria-hidden="true" />
          <span>{l.short || l.label}</span>
          {l.orders && toHandle > 0 && <span className="count" aria-label={`${toHandle} por tratar`}>{toHandle}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export default function TabBar() {
  const { user } = useAuth();
  const { items } = useCart();
  const { pathname } = useLocation();
  const [trayOpen, setTrayOpen] = useState(false);
  const bar = useRef(null);

  const inPanel = user?.role === 'producer'
    && (pathname === '/producer' || pathname.startsWith('/producer/') || pathname === `/producers/${user.id}`);

  useEffect(() => { setTrayOpen(false); }, [pathname]);

  useEffect(() => {
    if (!trayOpen) return undefined;
    const outside = (e) => { if (!bar.current?.contains(e.target)) setTrayOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setTrayOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', esc); };
  }, [trayOpen]);

  const content = (t, isActive) => (
    <>
      <i className={`bi bi-${t.icon}${isActive && !t.noFill ? '-fill' : ''}`} aria-hidden="true" />
      {t.label}
      {t.cart && items.length > 0 && <span className="count" aria-hidden="true">{items.length}</span>}
    </>
  );

  return (
    <>
      <div className="tab-bar-glass" aria-hidden="true" />
      <div className={`tab-bar-wrap ${trayOpen ? 'is-open' : ''}`} ref={bar}>
        {inPanel && <PanelTray userId={user.id} open={trayOpen} />}
        <nav className="tab-bar" aria-label="Navegação rápida">
          {TABS[user?.role || 'guest'].map((t) => (t.panel && inPanel ? (
            <button key={t.to} type="button" className={`is-active ${trayOpen ? 'is-open' : ''}`}
              aria-expanded={trayOpen} aria-controls="panel-tray" onClick={() => setTrayOpen((o) => !o)}>
              {content(t, true)}
              <i className="bi bi-chevron-up tab-bar__more" aria-hidden="true" />
            </button>
          ) : (
            <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => (isActive ? 'is-active' : '')}>
              {({ isActive }) => content(t, isActive)}
            </NavLink>
          )))}
        </nav>
      </div>
    </>
  );
}
