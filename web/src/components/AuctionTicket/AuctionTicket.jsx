// Destaque do leilão em direto na página inicial
import { Link } from 'react-router-dom';
import Illustration from '../Illustration/Illustration.jsx';
import { useCountdown } from '../../hooks/useCountdown.js';
import { euro } from '../../utils/format.js';
import './AuctionTicket.scss';

export default function AuctionTicket({ auction }) {
  const { text } = useCountdown(auction.endsAt);
  const nextBid = auction.currentBid.amount + auction.increment;

  return (
    <article className="ticket" aria-labelledby="t-ticket">
      <div className="ticket__top">
        <span className="tag tag-live"><span className="pulse" aria-hidden="true" />Ao vivo</span>
        <span><i className="bi bi-hammer me-1" aria-hidden="true" />{auction.bidCount} licitações</span>
      </div>
      <Illustration category={auction.product.category} className="ticket__art" />
      <div className="ticket__text">
        <h2 id="t-ticket">{auction.lot}</h2>
        <small className="mt-1">{auction.producer.name}, {auction.producer.city}</small>
      </div>
      <div className="ticket__values">
        <div><small>Licitação atual</small><span className="live-price">{euro(auction.currentBid.amount)}</span></div>
        <div><small>Termina em</small><span className="clock" role="timer">{text}</span></div>
      </div>
      <div className="ticket__actions">
        <Link className="btn btn-lime" to={`/auctions/${auction._id}`}>Entrar no leilão</Link>
        <span>Próxima licitação: <b>{euro(nextBid)}</b></span>
      </div>
    </article>
  );
}
