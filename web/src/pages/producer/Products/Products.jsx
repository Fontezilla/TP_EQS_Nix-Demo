// Produtor: os meus produtos (lista, criar, editar, remover)
import { useState } from 'react';
import DashboardMenu from '../../../components/DashboardMenu/DashboardMenu.jsx';
import Pagination from '../../../components/Pagination/Pagination.jsx';
import CategoryTile from '../../../components/CategoryTile/CategoryTile.jsx';
import Modal from '../../../components/Modal/Modal.jsx';
import ProductForm from './ProductForm.jsx';
import Loading from '../../../components/Loading/Loading.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useData } from '../../../hooks/useData.js';
import { listProducts, deleteProduct } from '../../../api/products.js';
import { euro } from '../../../utils/format.js';
import { CATEGORY_LABELS, SEASON_LABELS } from '../../../utils/labels.js';
import './Products.scss';

const PER_PAGE = 10;
const MESSAGES = { created: 'Produto criado.', updated: 'Alterações guardadas.', deleted: 'Produto removido.' };

export default function ProducerProducts() {
  const { user, token } = useAuth();
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState(null); // null fechado, {} novo, produto a editar
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { data, error: listError } = useData(
    () => listProducts({ producer: user.id, sort: 'name', page, limit: PER_PAGE }, token),
    [page, token, version]);

  function done(kind) {
    setEditing(null);
    setDeleting(null);
    setNotice(MESSAGES[kind]);
    setVersion((v) => v + 1);
  }

  async function confirmDelete() {
    setError('');
    setBusy(true);
    try {
      await deleteProduct(deleting._id, token);
      done('deleted');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const isLow = (p) => p.stock <= (p.minStock ?? 10);

  if (!data) {
    return listError
      ? <div className="page"><div className="alert alert-danger" role="alert">{listError}</div></div>
      : <Loading text="A carregar os seus produtos" />;
  }

  return (
    <div className="page">
      <div className="dashboard">
        <DashboardMenu />

        <div className="d-grid gap-4">
          <div className="page-header mb-0">
            <div>
              <h1 className="dashboard-title">Os meus produtos</h1>
              {data && <p>{data.total} {data.total === 1 ? 'produto' : 'produtos'} à venda.</p>}
            </div>
            <button className="btn btn-primary" type="button" onClick={() => { setNotice(''); setEditing({}); }}>
              <i className="bi bi-plus-lg" aria-hidden="true" />Novo produto
            </button>
          </div>

          {notice && <p className="success-notice mb-0" role="status"><i className="bi bi-check-circle-fill" aria-hidden="true" />{notice}</p>}

          <section className="panel" aria-label="Lista de produtos">
            {data?.total === 0 && (
              <div className="empty-state">
                <h2 className="h3">Ainda não tem produtos.</h2>
                <p className="muted">Crie o primeiro com o botão "Novo produto".</p>
              </div>
            )}
            {data?.total > 0 && (
              <div className="table-scroll">
                <table className="data-table stack-mobile products-table">
                  <thead><tr><th>Produto</th><th>Preço</th><th>Stock</th><th>Época</th><th><span className="visually-hidden">Ações</span></th></tr></thead>
                  <tbody>
                    {data.items.map((p) => (
                      <tr key={p._id}>
                        <td className="cell-product">
                          <div className="mini-product">
                            <CategoryTile as="span" category={p.category} imageUrl={p.imageUrl} alt={p.name} />
                            <div><b>{p.name}</b><br /><small className="muted">{CATEGORY_LABELS[p.category]}</small>{p.organic && <span className="tag tag-lime ms-2">Biológico</span>}
                              {p.hidden && <span className="tag tag-notice ms-2" title="Não aparece no catálogo nem pode ser encomendado">Ocultado pelo administrador</span>}</div>
                          </div>
                        </td>
                        <td className="cell-price num text-nowrap" data-label="Preço">{euro(p.price)} / {p.unit}</td>
                        <td className="cell-stock text-nowrap" data-label="Stock">
                          {p.stock === 0
                            ? <span className="tag tag-notice">Esgotado</span>
                            : isLow(p) ? <span className="tag tag-notice">{p.stock} {p.unit}</span> : <span className="num">{p.stock} {p.unit}</span>}
                        </td>
                        <td className="cell-season" data-label="Época">{p.seasons.length === 4 ? 'Todo o ano' : p.seasons.map((s) => SEASON_LABELS[s]).join(', ') || '—'}</td>
                        <td className="cell-actions text-end text-nowrap">
                          <button className="btn btn-outline btn-sm" type="button" aria-label={`Editar ${p.name}`} onClick={() => { setNotice(''); setEditing(p); }}>
                            <i className="bi bi-pencil d-md-none" aria-hidden="true" /><span className="d-none d-md-inline">Editar</span>
                          </button>{' '}
                          <button className="btn btn-danger-soft btn-sm" type="button" aria-label={`Remover ${p.name}`} onClick={() => { setError(''); setDeleting(p); }}>
                            <i className="bi bi-trash" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data && <Pagination page={data.page} pages={data.pages} label="Páginas de produtos" onChange={setPage} />}
          </section>
        </div>
      </div>

      <ProductForm open={editing !== null} product={editing?._id ? editing : null} onClose={() => setEditing(null)} onSaved={done} />

      <Modal title={`Remover ${deleting?.name || ''}?`} open={!!deleting} onClose={() => setDeleting(null)} onSubmit={confirmDelete}
        footer={<>
          <button type="button" className="btn btn-outline" onClick={() => setDeleting(null)}>Cancelar</button>
          <button type="submit" className="btn btn-danger-soft" disabled={busy}>{busy ? 'A remover…' : 'Remover produto'}</button>
        </>}>
        <p className="mb-0">O produto deixa de aparecer no catálogo. As encomendas já feitas não são afetadas.</p>
        {error && <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert">{error}</div>}
      </Modal>
    </div>
  );
}
