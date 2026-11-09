// Comprador: encomendas com o estado em tempo real e avaliação depois da entrega
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import OrderProgress, { StatusTag, STATUS_LABELS } from '../../components/OrderProgress/OrderProgress.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import Loading from '../../components/Loading/Loading.jsx';
import ReviewForm from './ReviewForm.jsx';
import ConfirmPurchase from '../../components/ConfirmPurchase/ConfirmPurchase.jsx';
import CategoryTile from '../../components/CategoryTile/CategoryTile.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEvents } from '../../context/SocketContext.jsx';
import { useData } from '../../hooks/useData.js';
import { listOrders, orderNumber } from '../../api/orders.js';
import { listAwaitingConfirmation } from '../../api/auctions.js';
import { euro, day, time } from '../../utils/format.js';
import './Orders.scss';

const PER_PAGE = 5;
// "3 kg de Kiwi", "1 × Mel de urze (500 g)" ou só o nome do lote ganho em leilão
function describeItem(i) {
  if (i.unit === 'lote') return i.name;
  if (/^\d/.test(i.unit)) return `${i.quantity} × ${i.name} (${i.unit})`;
  return `${i.quantity} ${i.unit} de ${i.name}`;
}

export default function Orders() {
  const { token } = useAuth();
  const { state } = useLocation();
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const { data, error } = useData(() => listOrders({ page, limit: PER_PAGE }, token), [page, token, version]);
  const { data: awaiting } = useData(() => listAwaitingConfirmation(token), [token, version]);

  // O produtor mudou o estado de uma encomenda: mostra o aviso e atualiza a lista
  useEvents(['order-updated'], (e) => {
    setNotice({ ...e, at: new Date() });
    setVersion((v) => v + 1);
  });
  useEvents(['auction-won', 'auction-lost'], () => setVersion((v) => v + 1));

  if (!data || !awaiting) return error ? <div className="page"><div className="alert alert-danger" role="alert">{error}</div></div> : <Loading text="A carregar as encomendas" />;

  return (
    <div className="page">
      <div className="page-header orders-header"><h1>Encomendas</h1></div>

      <div className="narrow-page">
        {state?.created && !notice && (
          <div className="live-notice mb-4" role="status">
            <i className="bi bi-check-circle-fill" aria-hidden="true" />
            <div>
              {state.created === 1 ? 'Pagamento aceite e encomenda enviada ao produtor.' : `Pagamento aceite e ${state.created} encomendas enviadas, uma a cada produtor.`}
              <small>
                {state.payment && `${state.payment.label}, referência ${state.payment.reference}. `}
                Vai ver aqui quando cada uma mudar de estado.
              </small>
            </div>
          </div>
        )}
        {notice && (
          <div className="live-notice mb-4" role="status">
            <i className="bi bi-bell-fill" aria-hidden="true" />
            <div>
              <b>{notice.producer}</b> marcou a encomenda {orderNumber(notice.id)} como <b>{STATUS_LABELS[notice.status].toLowerCase()}</b>.
              <small>às {time(notice.at)}</small>
            </div>
          </div>
        )}

        {awaiting?.length > 0 && (
          <section className="mb-4" aria-labelledby="t-confirm">
            <h2 className="h3 mb-3" id="t-confirm">Leilões ganhos por confirmar</h2>
            <div className="d-grid gap-3">
              {awaiting.map((a) => (
                <article className="panel-dark awaiting" key={a._id}>
                  <div className="d-flex gap-3 align-items-center mb-3">
                    <CategoryTile as="span" category={a.product.category} imageUrl={a.product.imageUrl} alt={a.product.name} />
                    <div>
                      <h3><Link to={`/auctions/${a._id}`}>{a.lot}</Link></h3>
                      <small>{a.producer.name}, {a.producer.city}</small>
                    </div>
                  </div>
                  <ConfirmPurchase auction={a} onDone={() => setVersion((v) => v + 1)} />
                </article>
              ))}
            </div>
          </section>
        )}

        {data.total === 0 ? (
          <div className="panel empty-state">
            <h2 className="h3">Ainda não fez encomendas.</h2>
            <p className="muted">Escolha produtos no catálogo e encomende a partir do cesto.</p>
            <Link className="btn btn-primary" to="/">Ver produtos</Link>
          </div>
        ) : (
          <div className="d-grid gap-3">
            {data.items.map((o) => {
              const last = o.history.at(-1)?.at || o.createdAt;
              return (
                <article className="panel order" key={o._id}>
                  <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                    <div>
                      <h2 className="h3">{orderNumber(o._id)} {o.source === 'auction' && <span className="tag tag-lime ms-1">Leilão ganho</span>}</h2>
                      <small className="muted">
                        <Link to={`/producers/${o.producer._id}`}>{o.producer.name}</Link>, {o.status === 'delivered' ? `entregue ${day(last)}` : `feita ${day(o.createdAt)}, ${time(o.createdAt)}`}
                      </small>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <StatusTag status={o.status} />
                      {o.status === 'delivered' && !o.reviewed && (
                        <button className="btn btn-lime btn-sm" type="button" onClick={() => setReviewing(o)}>
                          <i className="bi bi-star" aria-hidden="true" />Avaliar
                        </button>
                      )}
                      {o.reviewed && <span className="small muted"><i className="bi bi-star-fill star-icon" aria-hidden="true" /> Avaliada</span>}
                    </div>
                  </div>

                  {o.status !== 'delivered' && <OrderProgress status={o.status} />}

                  <ul className="order-items">
                    {o.items.map((i, n) => <li key={n}><span>{describeItem(i)}</span><span className="num">{euro(i.unitPrice * i.quantity)}</span></li>)}
                    <li className="total"><span>Total</span><span className="num">{euro(o.total)}</span></li>
                  </ul>

                  {o.payment && (
                    <p className="payment-receipt">
                      <i className="bi bi-receipt" aria-hidden="true" />
                      <span>Pago com {o.payment.label} {day(o.payment.paidAt)} às {time(o.payment.paidAt)}. Referência <span className="num">{o.payment.reference}</span>.</span>
                    </p>
                  )}

                  {o.status !== 'delivered' && (
                    <div className="delivery-note">
                      <i className={`bi bi-${o.delivery.type === 'delivery' ? 'truck' : 'geo-alt'}`} aria-hidden="true" />
                      <span>
                        {o.delivery.type === 'delivery'
                          ? `Entrega em ${o.delivery.address}.`
                          : `Levantar na quinta: ${[o.producer.producer?.address, o.producer.producer?.city].filter(Boolean).join(', ')}.`}
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <Pagination page={data.page} pages={data.pages} label="Páginas de encomendas"
          onChange={(n) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />

        <ReviewForm order={reviewing} onClose={() => setReviewing(null)}
          onReviewed={() => { setReviewing(null); setVersion((v) => v + 1); }} />
      </div>
    </div>
  );
}
