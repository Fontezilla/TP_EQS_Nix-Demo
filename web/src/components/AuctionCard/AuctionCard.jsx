// Componente reutilizável: cartão de um leilão a decorrer (ou a antevisão de um leilão novo)
import { Link } from 'react-router-dom';
import CategoryTile from '../CategoryTile/CategoryTile.jsx';
import { useCountdown } from '../../hooks/useCountdown.js';
import { euro } from '../../utils/format.js';
import './AuctionCard.scss';

export default function AuctionCard({ auction, preview = false, header }) {
  const { text, finished } = useCountdown(auction.endsAt);
  const { product, producer, currentBid, bidCount } = auction;

  return (
    <article className="live-auction" data-cat={product.category}>
      <div className="status">
        {header || (
          <>
            <span className="live"><span className="pulse" aria-hidden="true" />{finished ? 'A fechar' : 'Ao vivo'}</span>
            <span><i className="bi bi-hammer" aria-hidden="true" /> {bidCount} {bidCount === 1 ? 'licitação' : 'licitações'}</span>
          </>
        )}
      </div>
      <div>
        <h3>{auction.lot}</h3>
        <p className="muted small mb-0">{producer.name}, {producer.city}</p>
      </div>
      <CategoryTile category={product.category} imageUrl={product.imageUrl} alt={product.name} />
      <div className="values">
        <div>
          <small>{preview ? 'Preço base' : 'Licitação atual'}</small>
          <b>{euro(preview ? auction.startPrice : currentBid.amount)}</b>
        </div>
        <div>
          <small>{preview ? 'Duração' : 'Termina em'}</small>
          <span className="time" role={preview ? undefined : 'timer'}>{preview ? auction.durationText : text}</span>
        </div>
      </div>
      {!preview && <Link className="btn btn-primary btn-sm" to={`/auctions/${auction._id}`}>Entrar no leilão</Link>}
    </article>
  );
}
