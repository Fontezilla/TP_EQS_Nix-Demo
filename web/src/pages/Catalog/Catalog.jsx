// Visitante: página inicial com pesquisa, catálogo filtrável e leilões
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import AuctionTicket from '../../components/AuctionTicket/AuctionTicket.jsx';
import AuctionRow from '../../components/AuctionRow/AuctionRow.jsx';
import CategoryTile from '../../components/CategoryTile/CategoryTile.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import Loading from '../../components/Loading/Loading.jsx';
import SortMenu from '../../components/SortMenu/SortMenu.jsx';
import { useData } from '../../hooks/useData.js';
import { useRefresh, AUCTION_EVENTS } from '../../hooks/useRefresh.js';
import { useAddToCart } from '../../hooks/useAddToCart.js';
import { listProducts } from '../../api/products.js';
import { listAuctions } from '../../api/auctions.js';
import { euro } from '../../utils/format.js';
import { CATEGORIES, CATEGORY_LABELS, SEASONS, SEASON_LABELS } from '../../utils/labels.js';
import './Catalog.scss';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mais recentes', icon: 'clock' },
  { value: 'price-asc', label: 'Preço mais baixo', icon: 'sort-numeric-down' },
  { value: 'price-desc', label: 'Preço mais alto', icon: 'sort-numeric-up-alt' }
];

const NO_PRICE_LIMIT = 30;
const EMPTY = { q: '', category: '', organic: false, season: '', cities: [], maxPrice: NO_PRICE_LIMIT, sort: 'newest' };

const countBy = (list, key) => list.reduce((c, p) => ({ ...c, [key(p)]: (c[key(p)] || 0) + 1 }), {});

export default function Catalog() {
  const [filter, setFilter] = useState(EMPTY);   // filtros aplicados à lista
  const [draft, setDraft] = useState(EMPTY);     // o que está escolhido no painel, até carregar em Aplicar
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [allCities, setAllCities] = useState(false);
  const addToCart = useAddToCart();

  const request = { ...filter, maxPrice: filter.maxPrice < NO_PRICE_LIMIT ? filter.maxPrice : undefined, page };
  const { data: result, error } = useData(() => listProducts(request), [JSON.stringify(request)]);
  const { data: everything } = useData(() => listProducts({ limit: 1000 }), []);
  const products = result?.items;
  const all = everything?.items;
  const auctionsVersion = useRefresh(AUCTION_EVENTS);
  const { data: live } = useData(() => listAuctions({ status: 'live', limit: 1 }), [auctionsVersion]);
  const { data: upcoming } = useData(() => listAuctions({ status: 'scheduled', limit: 3 }), [auctionsVersion]);

  const counts = useMemo(() => ({
    category: countBy(all || [], (p) => p.category),
    city: countBy(all || [], (p) => p.producer.city)
  }), [all]);
  const cities = Object.keys(counts.city).sort((a, b) => counts.city[b] - counts.city[a]);

  const apply = (next) => { setFilter(next); setDraft(next); setPage(1); };
  const change = (field, value) => apply({ ...filter, [field]: value });
  const clearAll = () => { apply(EMPTY); setText(''); };
  const changeDraft = (field, value) => setDraft((d) => ({ ...d, [field]: value }));
  const toggleCity = (c) => changeDraft('cities', draft.cities.includes(c)
    ? draft.cities.filter((x) => x !== c) : [...draft.cities, c]);
  const scrollToProducts = () => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });

  const active = [
    filter.q && { text: `"${filter.q}"`, clear: () => { change('q', ''); setText(''); } },
    filter.category && { text: CATEGORY_LABELS[filter.category], clear: () => change('category', '') },
    filter.organic && { text: 'Biológico', clear: () => change('organic', false) },
    filter.season && { text: SEASON_LABELS[filter.season], clear: () => change('season', '') },
    ...filter.cities.map((c) => ({ text: c, clear: () => change('cities', filter.cities.filter((x) => x !== c)) })),
    filter.maxPrice < NO_PRICE_LIMIT && { text: `Até ${euro(filter.maxPrice)}`, clear: () => change('maxPrice', NO_PRICE_LIMIT) }
  ].filter(Boolean);

  // A página só aparece quando os produtos e os leilões chegaram
  if (!result || !everything || !live || !upcoming) {
    return error
      ? <div className="page"><div className="alert alert-danger" role="alert">{error}</div></div>
      : <Loading text="A carregar os produtos" />;
  }

  return (
    <>
      <section className="hero">
        <div className="hero__intro">
          <h1>Direto de quem produz, para a sua mesa.</h1>
          <p className="subtitle">Fruta, hortícolas, mel, vinho e queijo de produtores do Alto Minho. Levante na quinta ou receba em casa.</p>
          <form className="search-bar" role="search" onSubmit={(e) => { e.preventDefault(); change('q', text.trim()); scrollToProducts(); }}>
            <i className="bi bi-search" aria-hidden="true" />
            <label htmlFor="q" className="visually-hidden">Procurar produtos, ingredientes ou produtores</label>
            <input id="q" type="search" placeholder="Kiwi, mel de urze, Horta da Ribeira…"
              value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn btn-primary" type="submit">Procurar</button>
          </form>
          <div className="chips" role="group" aria-label="Categorias">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className={`chip ${filter.category === c ? 'is-active' : ''}`} aria-pressed={filter.category === c}
                onClick={() => { change('category', filter.category === c ? '' : c); scrollToProducts(); }}>
                <CategoryTile as="span" category={c} />{CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
        {live?.items[0] && <AuctionTicket auction={live.items[0]} />}
      </section>

      <section className="section" id="products" aria-labelledby="t-products">
        <div className="page-header"><h2 id="t-products">Produtos</h2></div>
        <div className="catalog">
          <aside className="offcanvas-lg offcanvas-bottom filters" tabIndex="-1" id="filters" aria-labelledby="t-filters">
            <div className="offcanvas-header">
              <h2 className="offcanvas-title h3" id="t-filters">Filtros</h2>
              <button type="button" className="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#filters" aria-label="Fechar" />
            </div>
            <div className="offcanvas-body d-block">
              <fieldset>
                <legend>Categoria</legend>
                {['', ...CATEGORIES].map((c) => (
                  <div className="form-check" key={c || 'all'}>
                    <input className="form-check-input" type="radio" name="category" id={`c-${c || 'all'}`}
                      checked={draft.category === c} onChange={() => changeDraft('category', c)} />
                    <label className="form-check-label" htmlFor={`c-${c || 'all'}`}>{c ? CATEGORY_LABELS[c] : 'Tudo'}</label>
                    <span className="count">{c ? counts.category[c] || 0 : all?.length}</span>
                  </div>
                ))}
              </fieldset>
              <fieldset>
                <legend>Modo de produção</legend>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="organic"
                    checked={draft.organic} onChange={(e) => changeDraft('organic', e.target.checked)} />
                  <label className="form-check-label" htmlFor="organic">Só biológico</label>
                </div>
              </fieldset>
              <fieldset>
                <legend>Época</legend>
                <select className="form-select" aria-label="Época" value={draft.season} onChange={(e) => changeDraft('season', e.target.value)}>
                  <option value="">Todas</option>
                  {SEASONS.map((s) => <option key={s} value={s}>{SEASON_LABELS[s]}</option>)}
                </select>
              </fieldset>
              <fieldset>
                <legend>Localidade</legend>
                {(allCities ? cities : cities.slice(0, 4)).map((c) => (
                  <div className="form-check" key={c}>
                    <input className="form-check-input" type="checkbox" id={`l-${c}`}
                      checked={draft.cities.includes(c)} onChange={() => toggleCity(c)} />
                    <label className="form-check-label" htmlFor={`l-${c}`}>{c}</label>
                    <span className="count">{counts.city[c]}</span>
                  </div>
                ))}
                {cities.length > 4 && (
                  <button type="button" className="btn btn-link p-0 text-link" onClick={() => setAllCities((v) => !v)}>
                    {allCities ? 'Ver menos' : `Ver mais ${cities.length - 4}`}
                  </button>
                )}
              </fieldset>
              <fieldset>
                <legend>Preço máximo</legend>
                <input type="range" className="form-range" min="1" max={NO_PRICE_LIMIT} id="price" aria-describedby="price-v"
                  value={draft.maxPrice} onChange={(e) => changeDraft('maxPrice', Number(e.target.value))} />
                <output id="price-v" htmlFor="price" className="muted">
                  {draft.maxPrice < NO_PRICE_LIMIT ? `Até ${euro(draft.maxPrice)}` : 'Sem limite'}
                </output>
              </fieldset>
            </div>
            <div className="offcanvas-footer">
              <button type="button" className="btn btn-outline" onClick={clearAll}>Limpar</button>
              <button type="button" className="btn btn-primary flex-fill" data-bs-dismiss="offcanvas" data-bs-target="#filters"
                onClick={() => apply({ ...draft, q: filter.q, sort: filter.sort })}>
                Aplicar filtros
              </button>
            </div>
          </aside>

          <div>
            <div className="results-bar">
              <button className="btn btn-outline d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#filters" aria-controls="filters">
                <i className="bi bi-sliders" aria-hidden="true" />Filtros
                {active.length > 0 && <span className="tag tag-lime">{active.length}</span>}
              </button>
              <p className="total" aria-live="polite"><b>{result?.total ?? 0}</b> produtos</p>
              <SortMenu value={filter.sort} options={SORT_OPTIONS} onChange={(v) => change('sort', v)} />
            </div>

            {active.length > 0 && (
              <div className="active-filters" aria-label="Filtros aplicados">
                {active.map((a) => (
                  <button key={a.text} className="tag" type="button" onClick={a.clear} aria-label={`Retirar filtro ${a.text}`}>
                    {a.text} <i className="bi bi-x" aria-hidden="true" />
                  </button>
                ))}
                <button className="btn btn-link p-0 text-link small" type="button" onClick={clearAll}>Limpar tudo</button>
              </div>
            )}

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            {products?.length === 0 ? (
              <div className="panel empty-state">
                <h3>Nenhum produto com estes filtros.</h3>
                <p className="muted">Retire um filtro ou procure por outro nome.</p>
                <button className="btn btn-outline btn-sm" type="button" onClick={clearAll}>Limpar filtros</button>
              </div>
            ) : (
              <ul className="products-grid">
                {(products || []).map((p) => (
                  <li key={p._id}><ProductCard product={p} onAdd={addToCart} /></li>
                ))}
              </ul>
            )}
            {result && (
              <Pagination page={result.page} pages={result.pages} label="Páginas de produtos"
                onChange={(n) => { setPage(n); scrollToProducts(); }} />
            )}
          </div>
        </div>
      </section>

      {upcoming?.total > 0 && (
        <section className="section" aria-labelledby="t-upcoming">
          <div className="page-header">
            <div><h2 id="t-upcoming">Próximos leilões</h2><p>Lotes da época e excedentes, licitados em direto.</p></div>
            <Link className="text-link" to="/auctions">Ver todos os leilões</Link>
          </div>
          <ul className="stack-list">
            {upcoming.items.map((a) => <AuctionRow key={a._id} auction={a} showDay />)}
          </ul>
        </section>
      )}
    </>
  );
}
