import { Link, useLocation } from 'react-router-dom';
import './NotFound.scss';

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <section className="not-found page" aria-labelledby="t-404">
      <p className="not-found__number" aria-hidden="true">
        4<svg className="not-found__sprout"><use href="/illustrations.svg#sprout" /></svg>4
      </p>
      <h1 id="t-404">Esta página não existe.</h1>
      <p className="not-found__text">
        Não encontrámos <code>{pathname}</code>. O endereço pode estar mal escrito ou a página já foi removida.
      </p>
      <div className="not-found__actions">
        <Link className="btn btn-primary btn-lg" to="/">Ver produtos</Link>
        <Link className="btn btn-outline btn-lg" to="/auctions">Ver leilões</Link>
      </div>
    </section>
  );
}
