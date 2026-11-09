// Lista de leilões: a decorrer, próximos (agrupados por dia) e os últimos terminados
import { useState } from 'react';
import AuctionCard from '../../components/AuctionCard/AuctionCard.jsx';
import AuctionRow from '../../components/AuctionRow/AuctionRow.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import Loading from '../../components/Loading/Loading.jsx';
import { useData } from '../../hooks/useData.js';
import { useRefresh, AUCTION_EVENTS } from '../../hooks/useRefresh.js';
import { listAuctions } from '../../api/auctions.js';
import { day } from '../../utils/format.js';
import './Auctions.scss';

const PER_PAGE = 5;
const CARDS = 3; // os restantes leilões a decorrer da página aparecem em lista

const dayKey = (date) => new Date(date).toDateString();
const capitalize = (text) => text.replace(/^./, (c) => c.toUpperCase());

// Agrupa os leilões (já ordenados pela hora de início) por dia
function byDay(auctions) {
  const days = [];
  auctions.forEach((a) => {
    const group = days.find((d) => d.key === dayKey(a.startsAt));
    if (group) group.auctions.push(a);
    else days.push({ key: dayKey(a.startsAt), date: a.startsAt, auctions: [a] });
  });
  return days;
}

export default function Auctions() {
  const version = useRefresh(AUCTION_EVENTS);
  const [livePage, setLivePage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);

  const live = useData(() => listAuctions({ status: 'live', page: livePage, limit: PER_PAGE }), [livePage, version]);
  const upcoming = useData(() => listAuctions({ status: 'scheduled', page: upcomingPage, limit: PER_PAGE }), [upcomingPage, version]);
  const ended = useData(() => listAuctions({ status: 'ended', limit: PER_PAGE }), [version]);

  const error = live.error || upcoming.error || ended.error;
  if (!live.data || !upcoming.data || !ended.data) {
    return error ? <div className="page"><div className="alert alert-danger" role="alert">{error}</div></div> : <Loading text="A carregar os leilões" />;
  }

  const scrollTo = (section) => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  const cards = live.data.items.slice(0, CARDS);
  const inList = live.data.items.slice(CARDS);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Leilões</h1>
          <p>Lotes da época e excedentes, licitados em direto. Pode assistir sem conta; para licitar precisa de entrar como comprador.</p>
        </div>
      </div>

      <section className="section mt-4" id="live" aria-labelledby="t-live">
        <div className="page-header"><h2 id="t-live">A decorrer agora <span className="muted">({live.data.total})</span></h2></div>
        {live.data.total === 0 ? (
          <p className="muted">Não há leilões a decorrer neste momento. Veja abaixo quando começam os próximos.</p>
        ) : (
          <>
            <div className="live-grid">
              {cards.map((a) => <AuctionCard key={a._id} auction={a} />)}
            </div>
            {/* O 3.º cartão só cabe com 3 colunas: em ecrãs mais estreitos aparece no início desta lista */}
            {(inList.length > 0 || cards.length === CARDS) && (
              <div className={inList.length ? '' : 'narrow-only'}>
                <h3 className="day-title">Também a decorrer</h3>
                <ul className="stack-list">
                  {cards.length === CARDS && <AuctionRow auction={cards[CARDS - 1]} className="narrow-only" />}
                  {inList.map((a) => <AuctionRow key={a._id} auction={a} />)}
                </ul>
              </div>
            )}
            <Pagination page={live.data.page} pages={live.data.pages} label="Páginas de leilões a decorrer"
              onChange={(n) => { setLivePage(n); scrollTo('live'); }} />
          </>
        )}
      </section>

      <section className="section" id="upcoming" aria-labelledby="t-upcoming">
        <div className="page-header"><h2 id="t-upcoming">Próximos leilões <span className="muted">({upcoming.data.total})</span></h2></div>
        {upcoming.data.total === 0 && <p className="muted">Ainda não há leilões agendados.</p>}
        {byDay(upcoming.data.items).map((d) => (
          <div key={d.key}>
            <h3 className="day-title">{capitalize(day(d.date, { long: true }))}</h3>
            <ul className="stack-list">
              {d.auctions.map((a) => <AuctionRow key={a._id} auction={a} showIncrement />)}
            </ul>
          </div>
        ))}
        <Pagination page={upcoming.data.page} pages={upcoming.data.pages} label="Páginas de próximos leilões"
          onChange={(n) => { setUpcomingPage(n); scrollTo('upcoming'); }} />
      </section>

      {ended.data.total > 0 && (
        <section className="section" aria-labelledby="t-ended">
          <div className="page-header"><h2 id="t-ended">Terminados recentemente</h2></div>
          <ul className="stack-list">
            {ended.data.items.map((a) => <AuctionRow key={a._id} auction={a} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
