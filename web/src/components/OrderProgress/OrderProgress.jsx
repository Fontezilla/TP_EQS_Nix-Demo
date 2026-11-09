// Passos do estado da encomenda: pending -> confirmed -> ready -> delivered
import './OrderProgress.scss';

export const STATUSES = ['pending', 'confirmed', 'ready', 'delivered'];
export const STATUS_LABELS = { pending: 'Pendente', confirmed: 'Confirmada', ready: 'Pronta', delivered: 'Entregue' };
const ICONS = { pending: 'hourglass-split', confirmed: 'check2', ready: 'box-seam', delivered: 'house-check' };

export function StatusTag({ status }) {
  return <span className={`status status-${status}`}>{STATUS_LABELS[status]}</span>;
}

export default function OrderProgress({ status }) {
  const index = STATUSES.indexOf(status);
  return (
    <ol className="steps" aria-label={`Estado da encomenda: ${STATUS_LABELS[status]}`}>
      {STATUSES.map((s, i) => {
        const done = i < index || (i === index && s === 'delivered');
        const current = i === index && !done;
        return (
          <li key={s} className={done ? 'done' : current ? 'current' : ''} aria-current={current ? 'step' : undefined}>
            <span className="step-mark">
              {done && <i className="bi bi-check-lg" aria-hidden="true" />}
              {current && <i className={`bi bi-${ICONS[s]}`} aria-hidden="true" />}
            </span>
            {STATUS_LABELS[s]}
          </li>
        );
      })}
    </ol>
  );
}
