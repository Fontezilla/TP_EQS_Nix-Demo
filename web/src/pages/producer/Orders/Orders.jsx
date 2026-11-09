// Produtor: todas as encomendas recebidas, com filtro por situação
import { useState } from 'react';
import DashboardMenu from '../../../components/DashboardMenu/DashboardMenu.jsx';
import OrdersTable, { useReceivedOrders } from '../../../components/OrdersTable/OrdersTable.jsx';
import Loading from '../../../components/Loading/Loading.jsx';
import { useEvents } from '../../../context/SocketContext.jsx';

const FILTERS = [
  { id: 'to-handle', label: 'Por tratar', status: 'pending,confirmed,ready', empty: 'Não tem encomendas por tratar.' },
  { id: 'delivered', label: 'Entregues', status: 'delivered', empty: 'Ainda não entregou nenhuma encomenda.' },
  { id: 'all', label: 'Todas', status: '', empty: 'Ainda não recebeu encomendas.' }
];

export default function ProducerOrders() {
  const [filter, setFilter] = useState(FILTERS[0]);
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  useEvents(['new-order'], refresh);
  const orders = useReceivedOrders(filter.status, 10, version);

  if (!orders.data) {
    return orders.error
      ? <div className="page"><div className="alert alert-danger" role="alert">{orders.error}</div></div>
      : <Loading text="A carregar as encomendas" />;
  }

  return (
    <div className="page">
      <div className="dashboard">
        <DashboardMenu version={version} />

        <div className="d-grid gap-4">
          <div className="page-header mb-0">
            <div><h1 className="dashboard-title">Encomendas</h1><p>Avance o estado de cada encomenda; o comprador é avisado em tempo real.</p></div>
          </div>

          <section className="panel" aria-label="Encomendas recebidas">
            <div className="segmented mb-3" role="tablist" aria-label="Filtrar encomendas">
              {FILTERS.map((f) => (
                <button key={f.id} type="button" role="tab" aria-selected={filter.id === f.id}
                  className={filter.id === f.id ? 'is-active' : ''} onClick={() => setFilter(f)}>{f.label}</button>
              ))}
            </div>
            <OrdersTable data={orders.data} onPage={orders.setPage} onChanged={refresh} empty={filter.empty} />
          </section>
        </div>
      </div>
    </div>
  );
}
