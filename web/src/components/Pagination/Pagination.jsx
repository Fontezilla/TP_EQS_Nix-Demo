// Paginação reutilizável: anterior, números das páginas e seguinte
import './Pagination.scss';

export default function Pagination({ page, pages, onChange, label = 'Páginas' }) {
  if (pages <= 1) return null;

  return (
    <nav className="pager" aria-label={label}>
      <button type="button" className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <i className="bi bi-chevron-left" aria-hidden="true" />Anterior
      </button>
      <ol>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <button type="button" className={n === page ? 'is-active' : ''} aria-current={n === page ? 'page' : undefined}
              aria-label={`Página ${n}`} onClick={() => onChange(n)}>{n}</button>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-outline btn-sm" disabled={page === pages} onClick={() => onChange(page + 1)}>
        Seguinte<i className="bi bi-chevron-right" aria-hidden="true" />
      </button>
    </nav>
  );
}
