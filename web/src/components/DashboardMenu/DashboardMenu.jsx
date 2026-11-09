// Menu lateral do painel do produtor (em cima, a deslizar, no telemóvel).
// O número em "Encomendas" são as encomendas por tratar, atualizado quando chega uma nova.
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePendingOrders } from '../../hooks/usePendingOrders.js';
import { panelLinks } from '../Navbar/links.js';
import './DashboardMenu.scss';

export default function DashboardMenu({ version = 0 }) {
  const { user } = useAuth();
  const toHandle = usePendingOrders(version);

  return (
    <nav className="dashboard-menu" aria-label="Painel do produtor">
      {panelLinks(user?.id).map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
          <i className={`bi bi-${l.icon}`} aria-hidden="true" />{l.label}
          {l.orders && toHandle > 0 && <span className="count" aria-label={`${toHandle} por tratar`}>{toHandle}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
