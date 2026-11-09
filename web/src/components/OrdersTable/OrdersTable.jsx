// Encomendas recebidas pelo produtor, com o estado a avançar (o comprador é avisado em tempo real).
// Usada no resumo do painel (só as por tratar) e na página de encomendas do produtor (com filtro).
// Os dados vêm da página (useReceivedOrders), que mostra o carregamento até chegarem.
import { useEffect, useState } from 'react';
import Pagination from '../Pagination/Pagination.jsx';
import { STATUSES, STATUS_LABELS } from '../OrderProgress/OrderProgress.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../hooks/useData.js';
import { listOrders, updateOrderStatus, orderNumber } from '../../api/orders.js';
import { euro, day } from '../../utils/format.js';
import './OrdersTable.scss';

const describeItems = (o) => o.items.map((i) => (i.unit === 'lote' ? i.name : `${i.quantity} ${i.unit} de ${i.name.toLowerCase()}`)).join(', ');

// Pedido das encomendas recebidas, feito pela página (para ela só aparecer quando os dados chegarem)
export function useReceivedOrders(status, perPage, version) {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status]); // outro filtro: volta à primeira página
  const request = useData(() => listOrders({ status, page, limit: perPage }, token), [status, page, token, version]);
  return { ...request, setPage };
}

export default function OrdersTable({ data, onPage, onChanged, empty = 'Ainda não recebeu encomendas.' }) {
  const { token } = useAuth();
  const [error, setError] = useState('');
  const [changing, setChanging] = useState(null);

  async function change(o, next) {
    setError('');
    setChanging(o._id);
    try {
      await updateOrderStatus(o._id, next, token);
      onChanged?.();
    } catch (err) {
      setError(`${orderNumber(o._id)}: ${err.message}`);
    } finally {
      setChanging(null);
    }
  }

  if (data?.total === 0) return <p className="muted mb-0">{empty}</p>;

  return (
    <>
      {data?.total > 0 && (
        <div className="table-scroll">
          <table className="data-table stack-mobile orders-table">
            <thead><tr><th>N.º</th><th>Cliente e artigos</th><th>Entrega</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>
              {data.items.map((o) => {
                const current = STATUSES.indexOf(o.status);
                return (
                  <tr key={o._id}>
                    <td className="cell-number text-nowrap"><b>{orderNumber(o._id)}</b><br /><small className="muted">{day(o.createdAt)}</small></td>
                    <td className="cell-buyer">
                      {o.buyer?.name || 'Conta removida'}
                      {o.source === 'auction' && <span className="tag tag-lime ms-2">Leilão</span>}
                      <br /><small className="muted">{describeItems(o)}</small>
                    </td>
                    <td className="cell-delivery">
                      <i className={`bi bi-${o.delivery.type === 'delivery' ? 'truck' : 'shop'} me-1 d-md-none`} aria-hidden="true" />
                      {o.delivery.type === 'delivery' ? 'Entrega' : 'Levantamento'}
                    </td>
                    <td className="cell-total num text-nowrap">{euro(o.total)}{o.payment && <><br /><small className="muted" title={`${o.payment.label}, ${o.payment.reference}`}><i className="bi bi-check2 me-1" aria-hidden="true" />pago</small></>}</td>
                    <td className="cell-status">
                      {o.status === 'delivered' ? (
                        <span className="status-control status-delivered"><i className="bi bi-check2" aria-hidden="true" />Entregue</span>
                      ) : (
                        // Só os estados seguintes: o estado de uma encomenda não pode recuar
                        <span className={`status-control status-${o.status}`}>
                          <select value={o.status} disabled={changing === o._id} aria-label={`Estado da encomenda ${orderNumber(o._id)}`}
                            onChange={(ev) => change(o, ev.target.value)}>
                            {STATUSES.slice(current).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                          </select>
                          <i className="bi bi-chevron-down" aria-hidden="true" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {error && <div className="alert alert-danger py-2 small mt-2 mb-0" role="alert">{error}</div>}
      {data && <Pagination page={data.page} pages={data.pages} label="Páginas de encomendas" onChange={onPage} />}
    </>
  );
}
