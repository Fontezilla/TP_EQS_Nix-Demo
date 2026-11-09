// Produtor: painel com indicadores, encomendas (mudar estado), leilão ao vivo e stock baixo
import { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardMenu from '../../../components/DashboardMenu/DashboardMenu.jsx';
import Loading from '../../../components/Loading/Loading.jsx';
import CategoryTile from '../../../components/CategoryTile/CategoryTile.jsx';
import OrdersTable, { useReceivedOrders } from '../../../components/OrdersTable/OrdersTable.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useEvents } from '../../../context/SocketContext.jsx';
import { useData } from '../../../hooks/useData.js';
import { useCountdown } from '../../../hooks/useCountdown.js';
import { getDashboardSummary } from '../../../api/products.js';
import { euro } from '../../../utils/format.js';
import './Dashboard.scss';

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function greeting() {
  const h = new Date().getHours();
  if (h < 13) return 'Bom dia';
  return h < 20 ? 'Boa tarde' : 'Boa noite';
}

function LiveAuction({ auction }) {
  const { text } = useCountdown(auction.endsAt);
  return (
    <section className="panel-dark d-grid gap-2" aria-labelledby="t-live">
      <div className="d-flex justify-content-between align-items-center gap-2">
        <span className="tag tag-live"><span className="pulse" aria-hidden="true" />O seu leilão ao vivo</span>
        <span className="small-clock" role="timer">{text}</span>
      </div>
      <h2 id="t-live" className="h3 text-white">{auction.lot}</h2>
      <div className="d-flex gap-4">
        <div><small>Atual</small><b className="value num">{euro(auction.currentBid.amount)}</b></div>
        <div><small>Licitações</small><b className="value">{auction.bidCount}</b></div>
      </div>
      <Link className="btn btn-lime mt-1" to={`/auctions/${auction._id}`}>Acompanhar em direto</Link>
    </section>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const [version, setVersion] = useState(0);
  const { data: s, error } = useData(() => getDashboardSummary(token), [token, version]);
  const orders = useReceivedOrders('pending,confirmed,ready', 6, version);
  const refresh = () => setVersion((v) => v + 1);

  // Encomenda nova ou mudança nos leilões: os indicadores voltam a ser pedidos
  useEvents(['new-order', 'auctions-changed', 'auction-updated'], refresh);

  if (!s || !orders.data) {
    return error || orders.error
      ? <div className="page"><div className="alert alert-danger" role="alert">{error || orders.error}</div></div>
      : <Loading text="A carregar o painel" />;
  }

  const today = new Date();
  const month = MONTHS[today.getMonth()];
  const previousMonth = MONTHS[(today.getMonth() + 11) % 12];
  const { change } = s.sales;

  return (
    <div className="page">
      <div className="dashboard">
        <DashboardMenu version={version} />

        <div className="d-grid gap-4">
          <div className="page-header mb-0">
            <div>
              <h1 className="dashboard-title">{greeting()}, {s.name}</h1>
              <p>{today.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Link className="btn btn-outline" to="/producer/products"><i className="bi bi-plus-lg" aria-hidden="true" />Novo produto</Link>
              <Link className="btn btn-primary" to="/producer/auctions/new"><i className="bi bi-hammer" aria-hidden="true" />Criar leilão</Link>
            </div>
          </div>

          {!s.verified && (
            <p className="verification-notice mb-0">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <span>A sua conta ainda não foi validada pelo administrador. Pode preparar os produtos, mas ainda não aparecem aos compradores.</span>
            </p>
          )}

          <div className="stats">
            <div className="stat">
              <small>Vendas em {month}</small><b>{euro(s.sales.month)}</b>
              <span>
                {change === null
                  ? 'Sem vendas no mês anterior'
                  : <><span className={change >= 0 ? 'good' : 'attention'}>{change >= 0 ? '+' : ''}{change}%</span> face a {previousMonth}</>}
              </span>
            </div>
            <div className="stat">
              <small>Encomendas por tratar</small><b>{s.orders.toHandle}</b>
              <span>{s.orders.toCollect > 0 ? <><span className="attention">{s.orders.toCollect}</span> prontas para levantar</> : 'Nenhuma à espera de levantamento'}</span>
            </div>
            <div className="stat">
              <small>Produtos à venda</small><b>{s.products.total}</b>
              <span>{s.products.lowStock.length > 0 ? <><span className="attention">{s.products.lowStock.length}</span> com stock baixo</> : 'Stock em dia'}</span>
            </div>
            <div className="stat">
              <small>Avaliação média</small><b>{s.rating.average?.toLocaleString('pt-PT') ?? '—'}</b>
              <span>{s.rating.count} {s.rating.count === 1 ? 'avaliação' : 'avaliações'}</span>
            </div>
          </div>

          <div className="two-columns">
            <section className="panel" aria-labelledby="t-orders">
              <div className="d-flex justify-content-between align-items-baseline gap-2 mb-3">
                <h2 id="t-orders" className="h3">Encomendas por tratar</h2>
                <Link className="text-link small" to="/producer/orders">Ver todas</Link>
              </div>
              <OrdersTable data={orders.data} onPage={orders.setPage} onChanged={refresh}
                empty="Não tem encomendas por tratar. As entregues estão em Encomendas." />
              <p className="small muted mt-2 mb-0"><i className="bi bi-info-circle me-1" aria-hidden="true" />O estado só pode avançar. O comprador é avisado em tempo real.</p>
            </section>

            <div className="side">
              {s.liveAuction
                ? <LiveAuction auction={s.liveAuction} />
                : (
                  <section className="panel d-grid gap-2" aria-labelledby="t-no-auction">
                    <h2 className="h3" id="t-no-auction">Sem leilões ao vivo</h2>
                    <p className="muted mb-0">Tem lotes da época ou excedentes? Ponha-os a leilão e os compradores licitam em direto.</p>
                    <Link className="btn btn-outline" to="/producer/auctions/new">Criar leilão</Link>
                  </section>
                )}

              <section className="panel" aria-labelledby="t-stock">
                <div className="d-flex justify-content-between align-items-baseline mb-2">
                  <h2 id="t-stock" className="h3">Stock baixo</h2>
                  {s.products.lowStock.length > 0 && <Link className="text-link small" to="/producer/products">Repor stock</Link>}
                </div>
                {s.products.lowStock.length === 0 && <p className="muted mb-0">Todos os produtos têm stock acima do mínimo.</p>}
                <ul className="list-unstyled mb-0 d-grid gap-3">
                  {s.products.lowStock.map((p) => (
                    <li className="mini-product" key={p._id}>
                      <CategoryTile as="span" category={p.category} imageUrl={p.imageUrl} alt={p.name} />
                      <div className="stock flex-fill">
                        <div className="d-flex justify-content-between gap-2">
                          <span>{p.name}</span>
                          <b className="small attention">{p.stock === 0 ? 'Esgotado' : `${p.stock} ${p.unit}`}</b>
                        </div>
                        <div className="bar" role="img" aria-label={`${p.stock} de um mínimo de ${p.minStock}`}>
                          <span style={{ width: `${Math.min(100, (p.stock / Math.max(p.minStock, 1)) * 100)}%` }} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
