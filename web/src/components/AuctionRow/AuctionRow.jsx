// Linha compacta de um leilão: agendado (hora), ao vivo (licitação atual) ou terminado (resultado)
import { Link } from 'react-router-dom';
import CategoryTile from '../CategoryTile/CategoryTile.jsx';
import { euro, time, day, duration } from '../../utils/format.js';
import './AuctionRow.scss';

export default function AuctionRow({ auction, showDay = false, showIncrement = false, className = '' }) {
  const { status, product, producer, currentBid } = auction;
  const tile = <CategoryTile as="span" category={product.category} imageUrl={product.imageUrl} />;

  let left = <div className="mini-product">{tile}</div>;
  let detail = `${producer.name}, ${producer.city}`;
  let right;

  if (status === 'scheduled') {
    left = (
      <div className="mini-product">
        <div className="time-box"><b>{time(auction.startsAt)}</b><span>{showDay ? day(auction.startsAt) : duration(auction.startsAt, auction.endsAt)}</span></div>
        {tile}
      </div>
    );
    right = <>base<b>{euro(auction.startPrice)}</b>{showIncrement && <span className="d-none d-sm-inline">+{euro(auction.increment)} por licitação</span>}</>;
  } else if (status === 'live') {
    detail = `${producer.name}, termina às ${time(auction.endsAt)}`;
    right = <>atual<b>{euro(currentBid.amount)}</b></>;
  } else {
    detail = `${producer.name}, ${day(auction.endsAt)}`;
    if (auction.outcome === 'sold') right = <>vendido por<b>{euro(auction.winner.amount)}</b>a {auction.winner.name}</>;
    else if (auction.outcome === 'awaiting') right = <>a aguardar confirmação<b>{euro(auction.winner.amount)}</b></>;
    else right = <b>{auction.bidCount ? 'Sem comprador' : 'Sem licitações'}</b>;
  }

  return (
    <li className={`list-row ${className}`} data-cat={product.category}>
      {left}
      <div>
        <h3><Link className="stretched-link" to={`/auctions/${auction._id}`}>{auction.lot}</Link></h3>
        <p>{detail}</p>
      </div>
      <p className="right">{right}</p>
    </li>
  );
}
