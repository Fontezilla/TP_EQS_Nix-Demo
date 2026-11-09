// Visitante: página pública do produtor, com mapa, produtos e avaliações
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import MapView from '../../components/MapView/MapView.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import Loading from '../../components/Loading/Loading.jsx';
import EditProfile from './EditProfile.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../hooks/useData.js';
import { useAddToCart } from '../../hooks/useAddToCart.js';
import { getProducer, listProducts } from '../../api/products.js';
import { reportReview, listReviews } from '../../api/reviews.js';
import { day, initials } from '../../utils/format.js';
import './ProducerProfile.scss';

const PRODUCTS_PER_PAGE = 6;
const REVIEWS_PER_PAGE = 3;

function Stars({ value }) {
  return (
    <span className="stars" role="img" aria-label={`${value} em 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => <i key={n} className={`bi bi-star${n <= value ? '-fill' : ''}`} aria-hidden="true" />)}
    </span>
  );
}

export default function ProducerProfile() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const addToCart = useAddToCart();
  const [version, setVersion] = useState(0); // muda para voltar a pedir os dados
  const [editing, setEditing] = useState(false);
  const [productsPage, setProductsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reportError, setReportError] = useState('');
  const { data: p, error, loading } = useData(() => getProducer(id, token), [id, token, version]);
  const { data: products } = useData(
    () => listProducts({ producer: id, sort: 'name', page: productsPage, limit: PRODUCTS_PER_PAGE }, token),
    [id, token, productsPage]);
  const { data: reviews } = useData(
    () => listReviews({ producer: id, page: reviewsPage, limit: REVIEWS_PER_PAGE }, token),
    [id, token, reviewsPage, version]);
  const scrollTo = (section) => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });

  if (error) {
    return (
      <div className="page">
        <div className="panel empty-state">
          <h1 className="h2">Produtor não encontrado.</h1>
          <p className="muted">A página pode ter sido removida ou o endereço está incorreto.</p>
          <Link className="btn btn-primary" to="/">Ver produtos</Link>
        </div>
      </div>
    );
  }
  if (!p || !products || !reviews) return loading || !products || !reviews ? <Loading text="A carregar a página do produtor" /> : null;

  const own = user?.id === p._id;
  const canReport = ['buyer', 'producer'].includes(user?.role);

  async function report(r) {
    setReportError('');
    try {
      await reportReview(r._id, token);
      setVersion((v) => v + 1);
    } catch (e) {
      setReportError(e.message);
    }
  }

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Migalhas"><Link to="/">Produtos</Link> / {p.name}</nav>

      <div className="profile">
        <div>
          <div className="profile__top">
            <span className="profile__initials" aria-hidden="true">{initials(p.name)}</span>
            <div>
              <h1>{p.name}</h1>
              <p className="muted mb-0 mt-1"><i className="bi bi-geo-alt me-1" aria-hidden="true" />{p.producer.city}</p>
            </div>
            {own && (
              <button className="btn btn-outline btn-sm ms-auto" type="button" onClick={() => setEditing(true)}>
                <i className="bi bi-pencil" aria-hidden="true" />Editar página
              </button>
            )}
          </div>

          <div className="d-flex gap-2 flex-wrap mt-3">
            {p.producer.verified
              ? <span className="tag tag-lime"><i className="bi bi-patch-check-fill" aria-hidden="true" />Produtor verificado</span>
              : <span className="tag tag-notice"><i className="bi bi-hourglass-split" aria-hidden="true" />À espera de validação</span>}
            {p.producer.reviewCount > 0 && (
              <span className="tag tag-outline">
                <i className="bi bi-star-fill star-icon" aria-hidden="true" />
                {p.producer.averageRating.toLocaleString('pt-PT')} em {p.producer.reviewCount} {p.producer.reviewCount === 1 ? 'avaliação' : 'avaliações'}
              </span>
            )}
          </div>
          {own && !p.producer.verified && (
            <p className="verification-notice mt-3 mb-0">
              <i className="bi bi-info-circle" aria-hidden="true" />
              <span>Só o próprio produtor vê esta página até o administrador validar a conta.</span>
            </p>
          )}
          {p.producer.description && <p className="profile__description">{p.producer.description}</p>}

          <section className="section" id="products" aria-labelledby="t-prod">
            <div className="page-header"><h2 id="t-prod">Produtos <span className="muted">({products?.total ?? 0})</span></h2></div>
            {products?.total === 0 && <p className="muted">Ainda não há produtos à venda.</p>}
            <ul className="products-grid">
              {(products?.items || []).map((x) => (
                <li key={x._id}><ProductCard product={x} showProducer={false} onAdd={addToCart} /></li>
              ))}
            </ul>
            {products && (
              <Pagination page={products.page} pages={products.pages} label="Páginas de produtos"
                onChange={(n) => { setProductsPage(n); scrollTo('products'); }} />
            )}
          </section>

          <section className="section" id="reviews" aria-labelledby="t-reviews">
            <div className="page-header"><h2 id="t-reviews">Avaliações</h2></div>
            <div className="panel">
              {reviews?.total === 0 && <p className="muted mb-0">Ainda sem avaliações. As avaliações aparecem depois das primeiras encomendas entregues.</p>}
              {reportError && <div className="alert alert-danger py-2 small" role="alert">{reportError}</div>}
              {(reviews?.items || []).map((r) => (
                <article className="review" key={r._id}>
                  <header><strong>{r.authorName}</strong><Stars value={r.rating} /></header>
                  {r.comment && <p className="mb-1 mt-1">{r.comment}</p>}
                  <div className="review__footer">
                    <small className="muted">{[...r.products.map((x) => x.name), day(r.at)].filter(Boolean).join(', ')}</small>
                    {canReport && r.author !== user.id && (
                      <button className="btn btn-link btn-sm p-0 muted report" type="button"
                        disabled={r.reportedByMe} onClick={() => report(r)}>
                        <i className={`bi bi-flag${r.reportedByMe ? '-fill' : ''} me-1`} aria-hidden="true" />
                        {r.reportedByMe ? 'Denunciada' : 'Denunciar'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {reviews && (
              <Pagination page={reviews.page} pages={reviews.pages} label="Páginas de avaliações"
                onChange={(n) => { setReviewsPage(n); scrollTo('reviews'); }} />
            )}
          </section>
        </div>

        <aside className="profile__side">
          <MapView position={p.producer.location} label={`Mapa com a localização de ${p.name}`}
            caption={[p.producer.address, p.producer.city].filter(Boolean).join(', ')} />
          {!user && (
            <div className="panel">
              <h3 className="mb-2">Como comprar</h3>
              <p className="muted mb-3">Crie uma conta de comprador para encomendar e acompanhar o estado das encomendas.</p>
              <Link className="btn btn-primary w-100" to="/register">Criar conta para encomendar</Link>
              <Link className="btn btn-link w-100 text-link mt-1" to="/login" state={{ from: `/producers/${id}` }}>Já tenho conta</Link>
            </div>
          )}
        </aside>
      </div>

      {own && (
        <EditProfile open={editing} producer={p} onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); setVersion((v) => v + 1); }} />
      )}
    </div>
  );
}
