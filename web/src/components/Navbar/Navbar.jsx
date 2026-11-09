import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { HOME, LINKS, BACKOFFICE_URL } from './links.js';
import { initials } from '../../utils/format.js';
import { useData } from '../../hooks/useData.js';
import { useRefresh } from '../../hooks/useRefresh.js';
import { listAuctions } from '../../api/auctions.js';
import './Navbar.scss';

const ROLE_LABELS = { buyer: 'Comprador', producer: 'Produtor', admin: 'Administração' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const role = user?.role || 'guest';
  const version = useRefresh(['auctions-changed']); // o número só muda quando um leilão começa ou termina
  const { data: auctions } = useData(() => listAuctions({ status: 'live', limit: 1 }), [version]);
  const liveCount = auctions?.total || 0;

  function signOut() {
    logout();
    navigate('/');
  }

  return (
    <header className="container-xl site-header">
      <div className="header-glass" aria-hidden="true" />
      <nav className="nav-pill" aria-label="Navegação principal">
        <Link className="brand" to={HOME[role]}>
          <svg className="logo" aria-hidden="true"><use href="/illustrations.svg#sprout" /></svg>
          Do Campo à Mesa
        </Link>

        <ul className="nav-links">
          {LINKS[role].map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.to === '/'} className={({ isActive }) => (isActive ? 'is-active' : '')}>{l.label}</NavLink>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          {liveCount > 0 && (
            <Link className="live-pill" to="/auctions">
              <span className="pulse" aria-hidden="true" />
              {liveCount === 1 ? '1 leilão ao vivo' : `${liveCount} leilões ao vivo`}
            </Link>
          )}

          {role === 'buyer' && (
            <Link className="icon-button d-none d-md-grid" to="/cart" aria-label={`Cesto, ${items.length} artigos`}>
              <i className="bi bi-basket" aria-hidden="true" />
              {items.length > 0 && <span className="count" aria-hidden="true">{items.length}</span>}
            </Link>
          )}

          {user ? (
            <div className="dropdown account-menu">
              <button className={`avatar ${role === 'admin' ? 'admin' : ''}`} type="button"
                data-bs-toggle="dropdown" aria-expanded="false" aria-label={`Conta de ${user.name}`}>
                {initials(user.name)}
              </button>
              <div className="dropdown-menu dropdown-menu-end">
                <div className="menu-header"><strong>{user.name}</strong>{user.email}<br />{ROLE_LABELS[role]}</div>
                {role === 'admin' && (
                  <a className="dropdown-item" href={BACKOFFICE_URL}>
                    <i className="bi bi-shield-check me-2" aria-hidden="true" />Abrir o backoffice
                  </a>
                )}
                {role === 'producer' && (
                  <Link className="dropdown-item" to={`/producers/${user.id}`}>
                    <i className="bi bi-shop me-2" aria-hidden="true" />Página pública
                  </Link>
                )}
                <button className="dropdown-item" type="button" onClick={signOut}>
                  <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />Terminar sessão
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link className="btn btn-outline btn-sm" to="/login">Entrar</Link>
              <Link className="btn btn-primary btn-sm d-none d-md-inline-flex" to="/register">Criar conta</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
