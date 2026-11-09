// Sala de leilão em tempo real: todos podem assistir; só compradores licitam
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import CategoryTile from '../../components/CategoryTile/CategoryTile.jsx';
import Loading from '../../components/Loading/Loading.jsx';
import ConfirmPurchase from '../../components/ConfirmPurchase/ConfirmPurchase.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAuction } from '../../hooks/useAuction.js';
import { useCountdown } from '../../hooks/useCountdown.js';
import { euro, time, day, initials } from '../../utils/format.js';
import './AuctionRoom.scss';

const SHORTCUTS = [5, 10, 25];
const round = (v) => Math.round(v * 100) / 100;

function timeAgo(date, now) {
  const s = Math.max(0, Math.round((now - Date.parse(date)) / 1000));
  if (s < 60) return `há ${s} s`;
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  return `${day(date)}, ${time(date)}`;
}

export default function AuctionRoom() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { auction, bids, viewers, offset, rejection, connectionError, notFound, placeBid, refresh } = useAuction(id);
  const scheduled = auction?.status === 'scheduled';
  const { remaining, text, finished } = useCountdown(scheduled ? auction?.startsAt : auction?.endsAt, offset);
  const [amount, setAmount] = useState('');

  const current = auction?.currentBid.amount ?? 0;
  const minimum = auction ? round(current + auction.increment) : 0;

  // Quando alguém licita, o valor proposto sobe para o novo mínimo (se o que estava escrito já não chega)
  useEffect(() => {
    if (auction) setAmount((v) => (Number(v) >= minimum ? v : minimum.toFixed(2)));
  }, [minimum]); // eslint-disable-line react-hooks/exhaustive-deps

  if (notFound) {
    return (
      <div className="page">
        <div className="panel empty-state">
          <h1 className="h2">Este leilão não existe.</h1>
          <p className="muted">O endereço pode estar incorreto ou o leilão foi removido.</p>
          <Link className="btn btn-primary" to="/auctions">Ver leilões</Link>
        </div>
      </div>
    );
  }
  if (!auction) return <Loading text="A entrar na sala do leilão" />;

  const ended = auction.status === 'ended' || (auction.status === 'live' && finished);
  const live = auction.status === 'live' && !finished;
  const isBuyer = user?.role === 'buyer';
  const leading = !!user && auction.currentBid.buyer === user.id;
  const isWinner = !!user && auction.winner?.buyer === user.id;
  const finalAmount = auction.winner?.amount ?? current;
  const outbid = !leading && !!user && bids.some((b) => b.buyer === user.id);
  const totalDuration = Date.parse(auction.endsAt) - Date.parse(auction.startsAt);
  const now = Date.now() + offset;
  const amountNumber = Number(amount);

  function submit(e) {
    e.preventDefault();
    if (amountNumber >= minimum) placeBid(round(amountNumber));
  }

  let tag = <span className="tag tag-live"><span className="pulse" aria-hidden="true" />Ao vivo</span>;
  if (scheduled) tag = <span className="tag tag-notice">Agendado</span>;
  if (ended) tag = <span className="tag tag-outline">Terminado</span>;

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Migalhas"><Link to="/auctions">Leilões</Link> / {auction.lot}</nav>

      <div className="room">
        <header className="room__title">
          <div className="d-flex gap-2 align-items-center mb-2">{tag}</div>
          <h1>{auction.lot}</h1>
          <Link className="who mt-2" to={`/producers/${auction.producer._id}`}>
            <span className="initials" aria-hidden="true">{initials(auction.producer.name)}</span>
            {auction.producer.name}, {auction.producer.city}
          </Link>
        </header>

        <div className="room__details">
          <CategoryTile category={auction.product.category} imageUrl={auction.product.imageUrl} alt={auction.product.name} className="large" />
          <div className="facts">
            <div><small>Preço base</small><b>{euro(auction.startPrice)}</b></div>
            <div><small>Incremento mínimo</small><b>{euro(auction.increment)}</b></div>
            <div><small>Licitações</small><b>{auction.bidCount}</b></div>
            <div>
              <small>{scheduled ? 'Começa' : ended ? 'Terminou' : 'Termina às'}</small>
              <b>{scheduled ? `${day(auction.startsAt)}, ${time(auction.startsAt)}` : time(auction.endsAt)}</b>
            </div>
          </div>
          {auction.quantity > 0 && <p className="mb-2"><b>Quantidade:</b> {auction.quantity.toLocaleString('pt-PT')} {auction.product.unit}</p>}
          {auction.description && <p className="room__description">{auction.description}</p>}
          <p className="muted small">O vencedor recebe uma encomenda confirmada com o lote, para combinar o levantamento com o produtor.</p>
        </div>

        <aside className="bid-panel">
          <div className="panel-dark d-grid gap-3">
            {!ended && (
              <>
                <div className="countdown">
                  <span><small>{scheduled ? 'Começa em' : 'Termina em'}</small><span className="clock" role="timer">{text}</span></span>
                  <span className="muted"><i className="bi bi-people me-1" aria-hidden="true" />{viewers} a assistir</span>
                </div>
                {live && (
                  <div className="time-bar" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, (remaining / totalDuration) * 100)}%` }} />
                  </div>
                )}
              </>
            )}

            <div aria-live="polite">
              <small>
                {ended
                  ? { sold: 'Vendido por', unsold: 'Resultado' }[auction.outcome] || (auction.bidCount ? 'Licitação vencedora' : 'Resultado')
                  : auction.bidCount ? 'Licitação atual' : 'Preço base'}
              </small>
              <span className="live-price" key={ended ? finalAmount : current}>
                {ended && (!auction.bidCount || auction.outcome === 'unsold') ? 'Sem comprador' : euro(ended ? finalAmount : current)}
              </span>
              {leading && !ended && <div className="mt-2"><span className="leading"><i className="bi bi-trophy-fill" aria-hidden="true" />A sua licitação é a mais alta</span></div>}
              {outbid && live && <div className="mt-2"><span className="outbid">Foi ultrapassado. Volte a licitar.</span></div>}
            </div>

            {ended && (
              <div className="d-grid gap-3">
                {!auction.outcome && <p className="mb-0">A apurar o resultado…</p>}
                {auction.outcome === 'awaiting' && (isWinner
                  ? <ConfirmPurchase key={auction.winner.deadline} auction={auction} showAmount={false} onDone={refresh} />
                  : <p className="mb-0">À espera que <b>{auction.winner.name}</b> confirme a compra, até às {time(auction.winner.deadline)}. Se não confirmar, o lote passa à licitação seguinte.</p>)}
                {auction.outcome === 'sold' && <p className="mb-0">Vendido a <b>{isWinner ? 'si' : auction.winner.name}</b>.</p>}
                {auction.outcome === 'unsold' && (
                  <p className="mb-0">{auction.bidCount ? 'O lote ficou sem comprador: quem licitou recusou ou não confirmou a compra a tempo.' : 'Ninguém licitou neste leilão.'}</p>
                )}
                {auction.outcome === 'sold' && isWinner && <Link className="btn btn-lime" to="/orders">Ver a encomenda do lote</Link>}
                {auction.outcome === 'awaiting' && isWinner
                  ? <Link className="light-link" to="/auctions">Ver outros leilões</Link>
                  : <Link className="btn btn-outline" to="/auctions">Ver outros leilões</Link>}
              </div>
            )}

            {live && isBuyer && (
              <form className="d-grid gap-2" onSubmit={submit}>
                <div className="shortcuts">
                  {SHORTCUTS.map((x) => (
                    <button key={x} type="button" className="btn" disabled={current + x < minimum}
                      onClick={() => setAmount(round(current + x).toFixed(2))}>+{x} €</button>
                  ))}
                </div>
                <label htmlFor="amount" className="small muted">O seu valor (mínimo {euro(minimum)})</label>
                <input id="amount" type="number" inputMode="decimal" step="0.01" min={minimum} className="form-control" required
                  value={amount} onChange={(e) => setAmount(e.target.value)} aria-describedby={rejection ? 'rejection' : undefined} />
                <button type="submit" className="btn btn-lime btn-lg" disabled={!(amountNumber >= minimum)}>
                  <i className="bi bi-hammer" aria-hidden="true" />Licitar {amountNumber >= minimum ? euro(amountNumber) : ''}
                </button>
                {rejection && <p className="rejection mb-0" id="rejection" role="alert"><i className="bi bi-x-circle me-1" aria-hidden="true" />{rejection.message}</p>}
              </form>
            )}

            {!ended && !user && (
              <div className="d-grid gap-2">
                <p className="mb-0">Pode assistir sem conta. Para licitar, entre como comprador.</p>
                <Link className="btn btn-lime btn-lg" to="/login" state={{ from: pathname }}>Entrar para licitar</Link>
              </div>
            )}
            {!ended && user && !isBuyer && (
              <p className="mb-0 muted"><i className="bi bi-info-circle me-1" aria-hidden="true" />Só as contas de comprador podem licitar.</p>
            )}
            {scheduled && isBuyer && <p className="mb-0 muted">Pode licitar quando o leilão começar. A página atualiza sozinha.</p>}
            {connectionError && <p className="rejection mb-0" role="status">{connectionError}</p>}
          </div>

          <div className="panel">
            <div className="d-flex justify-content-between align-items-baseline mb-1">
              <h2 className="h3 mb-0">Licitações</h2>
              {live && <small className="muted">em tempo real</small>}
            </div>
            {bids.length === 0 && <p className="muted mb-0 mt-2">{scheduled ? 'O leilão ainda não começou.' : 'Ainda ninguém licitou.'}</p>}
            <ul className="list-unstyled bid-history mb-0">
              {bids.map((b) => {
                const mine = b.buyer === user?.id;
                return (
                  <li key={b._id} className={mine ? 'mine' : ''}>
                    <span className="initials" aria-hidden="true">{initials(b.name)}</span>
                    <span>{b.name}{mine ? ' (você)' : ''}<br /><span className="when">{timeAgo(b.at, now)}</span></span>
                    <b>{euro(b.amount)}</b>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
