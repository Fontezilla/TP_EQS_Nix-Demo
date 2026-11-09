// Produtor: criar leilão, com a antevisão do cartão como os compradores o vão ver
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardMenu from '../../../components/DashboardMenu/DashboardMenu.jsx';
import AuctionCard from '../../../components/AuctionCard/AuctionCard.jsx';
import Loading from '../../../components/Loading/Loading.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useData } from '../../../hooks/useData.js';
import { listProducts, getProducer } from '../../../api/products.js';
import { createAuction } from '../../../api/auctions.js';
import { euro, day, time, duration } from '../../../utils/format.js';
import './CreateAuction.scss';

const DURATIONS = [{ min: 15, label: '15 min' }, { min: 30, label: '30 min' }, { min: 60, label: '1 hora' }, { min: 120, label: '2 horas' }];

// Próxima hora certa, no formato do <input type="datetime-local"> (hora local)
function nextHour() {
  const d = new Date(Date.now() + 36e5);
  d.setMinutes(0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
}

export default function CreateAuction() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ product: '', lot: '', quantity: '', startPrice: '', increment: '5', durationMin: 30, when: 'now', startsAt: nextHour(), description: '' });
  const [lotEdited, setLotEdited] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const { data: products } = useData(() => listProducts({ producer: user.id, sort: 'name', limit: 100 }, token), [token]);
  const { data: me } = useData(() => getProducer(user.id, token), [token]);

  if (!products || !me) return <Loading text="A preparar o formulário" />;

  const product = products.items.find((p) => p._id === form.product);
  const verified = me.producer.verified;
  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Sugere o nome do lote a partir da quantidade e do produto (enquanto o produtor não o escrever)
  const lowerFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1); // "Kiwi Hayward" -> "kiwi Hayward"
  const suggestLot = (p, q) => (!p ? '' : q ? `${q} ${p.unit} de ${lowerFirst(p.name)}` : p.name);

  function pickProduct(e) {
    const p = products.items.find((x) => x._id === e.target.value);
    const quantity = p && Number(form.quantity) > p.stock ? '' : form.quantity;
    setForm({ ...form, product: e.target.value, quantity, lot: lotEdited ? form.lot : suggestLot(p, quantity) });
  }

  function changeQuantity(e) {
    setForm({ ...form, quantity: e.target.value, lot: lotEdited ? form.lot : suggestLot(product, e.target.value) });
  }

  const start = form.when === 'now' ? new Date() : new Date(form.startsAt);
  const end = new Date(start.getTime() + form.durationMin * 6e4);
  const firstBid = (Number(form.startPrice) || 0) + (Number(form.increment) || 0);

  async function publish(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const a = await createAuction({
        product: form.product, lot: form.lot, quantity: Number(form.quantity), description: form.description,
        startPrice: Number(form.startPrice), increment: Number(form.increment), durationMin: form.durationMin,
        ...(form.when === 'schedule' && { startsAt: start.toISOString() })
      }, token);
      navigate(`/auctions/${a._id}`);
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  }

  return (
    <div className="page">
      <div className="dashboard">
        <DashboardMenu />

        <div className="d-grid gap-4">
          <div className="page-header mb-0">
            <div><h1 className="dashboard-title">Criar leilão</h1><p>Para lotes da época ou excedentes. Os compradores licitam em direto até ao fim do tempo.</p></div>
          </div>

          {!verified && (
            <p className="verification-notice mb-0">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <span>Pode criar leilões depois de o administrador validar a sua conta.</span>
            </p>
          )}
          {products.total === 0 && (
            <p className="verification-notice mb-0">
              <i className="bi bi-info-circle" aria-hidden="true" />
              <span>Cada leilão é de um dos seus produtos. <Link to="/producer/products">Crie primeiro um produto</Link>.</span>
            </p>
          )}

          <div className="create-auction">
            <form className="panel" onSubmit={publish}>
              <fieldset className="row g-3" disabled={!verified || products.total === 0}>
                <div className="col-12">
                  <label className="form-label" htmlFor="a-product">Produto</label>
                  <select id="a-product" className="form-select" required value={form.product} onChange={pickProduct}>
                    <option value="" disabled>Escolha o produto</option>
                    {products.items.map((p) => (
                      <option key={p._id} value={p._id} disabled={p.hidden || p.stock <= 0}>
                        {p.name}{p.hidden ? ' (ocultado)' : p.stock <= 0 ? ' (sem stock)' : ` (${p.stock} ${p.unit} disponíveis)`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-sm-4">
                  <label className="form-label" htmlFor="a-qty">Quantidade</label>
                  <div className="input-group">
                    <input id="a-qty" type="number" inputMode="decimal" step="any" min="0.01" max={product?.stock} className="form-control" required
                      disabled={!product} value={form.quantity} onChange={changeQuantity} aria-describedby="a-qty-help" />
                    <span className="input-group-text">{product?.unit || 'unid.'}</span>
                  </div>
                </div>
                <div className="col-sm-8">
                  <label className="form-label" htmlFor="a-lot">Nome do lote</label>
                  <input id="a-lot" className="form-control" required maxLength={100} placeholder="Ex.: 200 kg de kiwi Hayward, calibre A"
                    value={form.lot} onChange={(e) => { setLotEdited(true); change('lot')(e); }} />
                </div>
                <p id="a-qty-help" className="form-text col-12 mt-1">
                  {product
                    ? `Disponível: ${product.stock} ${product.unit}. A quantidade sai do stock da loja enquanto o leilão decorre e volta se o lote não for vendido.`
                    : 'Escolha o produto para ver a quantidade disponível.'}
                </p>
                <div className="col-6">
                  <label className="form-label" htmlFor="a-start">Preço base (€)</label>
                  <input id="a-start" type="number" inputMode="decimal" step="0.01" min="0" className="form-control" required value={form.startPrice} onChange={change('startPrice')} />
                </div>
                <div className="col-6">
                  <label className="form-label" htmlFor="a-inc">Incremento mínimo (€)</label>
                  <input id="a-inc" type="number" inputMode="decimal" step="0.01" min="0.01" className="form-control" required value={form.increment} onChange={change('increment')} />
                </div>

                <fieldset className="col-12">
                  <legend className="form-label">Duração</legend>
                  <div className="segmented">
                    {DURATIONS.map((d) => (
                      <span key={d.min}>
                        <input type="radio" name="duration" id={`d${d.min}`} checked={form.durationMin === d.min} onChange={() => setForm({ ...form, durationMin: d.min })} />
                        <label htmlFor={`d${d.min}`}>{d.label}</label>
                      </span>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="col-12">
                  <legend className="form-label">Início</legend>
                  <div className="segmented mb-2">
                    {[['now', 'Começar já'], ['schedule', 'Agendar']].map(([v, label]) => (
                      <span key={v}>
                        <input type="radio" name="when" id={`w-${v}`} checked={form.when === v} onChange={() => setForm({ ...form, when: v })} />
                        <label htmlFor={`w-${v}`}>{label}</label>
                      </span>
                    ))}
                  </div>
                  {form.when === 'schedule' && (
                    <input id="a-starts" type="datetime-local" className="form-control" required aria-label="Data e hora de início"
                      min={new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16)}
                      value={form.startsAt} onChange={change('startsAt')} />
                  )}
                </fieldset>

                <div className="col-12">
                  <label className="form-label" htmlFor="a-desc">Descrição <span className="muted fw-normal">(opcional)</span></label>
                  <textarea id="a-desc" className="form-control" rows="3" maxLength={1000} placeholder="Calibre, embalagem, prazo para levantar…"
                    value={form.description} onChange={change('description')} />
                </div>
              </fieldset>

              {error && <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert">{error}</div>}
              <div className="d-flex gap-2 justify-content-end mt-4">
                <Link className="btn btn-outline" to="/producer">Cancelar</Link>
                <button className="btn btn-primary" type="submit" disabled={sending || !verified || products.total === 0}>
                  <i className="bi bi-hammer" aria-hidden="true" />{sending ? 'A publicar…' : 'Publicar leilão'}
                </button>
              </div>
            </form>

            <aside className="preview" aria-label="Antevisão">
              <p className="small muted mb-2">Como os compradores vão ver o leilão</p>
              <AuctionCard preview auction={{
                lot: form.lot || 'Nome do lote',
                product: { category: product?.category || 'other', imageUrl: product?.imageUrl, name: product?.name },
                producer: { name: me.name, city: me.producer.city },
                startPrice: Number(form.startPrice) || 0,
                durationText: duration(start, end),
                endsAt: end.toISOString()
              }} header={form.when === 'now'
                ? <span className="tag tag-lime">Começa ao publicar</span>
                : <><span className="tag tag-notice">Agendado</span><span>{day(start)}, {time(start)}</span></>} />
              <p className="small muted mt-3">
                <i className="bi bi-info-circle me-1" aria-hidden="true" />
                A primeira licitação tem de ser de pelo menos {euro(firstBid)} (preço base mais o incremento).
                O vencedor tem uma hora para confirmar a compra.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
