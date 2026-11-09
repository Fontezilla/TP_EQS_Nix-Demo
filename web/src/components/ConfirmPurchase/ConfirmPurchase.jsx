// O vencedor de um leilão confirma a compra dentro do prazo (ou recusa, e o lote passa ao seguinte)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCountdown } from '../../hooks/useCountdown.js';
import { confirmAuction, declineAuction } from '../../api/auctions.js';
import PaymentForm, { EMPTY_PAYMENT, paymentBody } from '../PaymentForm/PaymentForm.jsx';
import { euro, time } from '../../utils/format.js';
import './ConfirmPurchase.scss';

export default function ConfirmPurchase({ auction, onDone, showAmount = true }) {
  const { token } = useAuth();
  const { text, finished } = useCountdown(auction.winner.deadline);
  const [declining, setDeclining] = useState(false);
  const [paying, setPaying] = useState(false); // mostra o formulário de pagamento
  const [payment, setPayment] = useState(EMPTY_PAYMENT);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // 'confirmed' | 'declined'
  const [receipt, setReceipt] = useState(null); // resumo do pagamento

  async function act(request, result) {
    setError('');
    setSending(true);
    try {
      const r = await request();
      setReceipt(r?.order?.payment || null);
      setDone(result); // mostra logo o resultado, sem esperar pelo aviso do servidor
      onDone?.(result, r);
    } catch (e) {
      setError(e.message);
      setSending(false);
      // Pagamento recusado ou dados inválidos: pode tentar outra vez. Senão, já foi tratado noutro lado.
      if (e.status !== 402 && e.status !== 400) onDone?.('outdated');
    }
  }

  if (done === 'confirmed') {
    return (
      <div className="d-grid gap-2">
        <p className="mb-0"><i className="bi bi-check-circle-fill me-1 deadline" aria-hidden="true" />Compra paga e confirmada. A encomenda do lote já está nas suas encomendas.</p>
        {receipt && <p className="mb-0 small">{receipt.label}, referência <span className="num">{receipt.reference}</span>.</p>}
        <Link className="btn btn-lime" to="/orders">Ver a encomenda</Link>
      </div>
    );
  }
  if (done === 'declined') {
    return <p className="mb-0">Recusou este lote. Passou ao comprador com a licitação seguinte.</p>;
  }
  if (finished) return <p className="mb-0">O prazo para confirmar terminou. O lote passou a outro comprador.</p>;

  return (
    <div className="confirm-purchase d-grid gap-2">
      <p className="mb-0">
        {showAmount ? <>Ganhou por <b>{euro(auction.winner.amount)}</b>. </> : 'Ganhou este leilão. '}
        Confirme a compra até às <b>{time(auction.winner.deadline)}</b>; se não confirmar, o lote passa ao comprador com a licitação seguinte.
      </p>
      <p className="mb-0 deadline"><i className="bi bi-hourglass-split me-1" aria-hidden="true" />Faltam <span role="timer">{text}</span></p>

      {declining ? (
        <div className="d-grid gap-2">
          <p className="mb-0 small">Tem a certeza? O lote passa ao comprador seguinte e não pode voltar atrás.</p>
          <div className="actions">
            <button type="button" className="btn btn-danger-soft" disabled={sending} onClick={() => act(() => declineAuction(auction._id, token), 'declined')}>Sim, recusar</button>
            <button type="button" className="btn btn-ghost" onClick={() => setDeclining(false)}>Não, voltar</button>
          </div>
        </div>
      ) : paying ? (
        <form className="d-grid gap-2" onSubmit={(e) => { e.preventDefault(); act(() => confirmAuction(auction._id, paymentBody(payment), token), 'confirmed'); }}>
          <PaymentForm value={payment} onChange={setPayment} idPrefix={`pay-${auction._id}`} dark />
          <button type="submit" className="btn btn-lime btn-lg" disabled={sending}>
            <i className="bi bi-lock" aria-hidden="true" />{sending ? 'A processar o pagamento…' : `Pagar ${euro(auction.winner.amount)} e confirmar`}
          </button>
          <button type="button" className="btn btn-ghost" disabled={sending} onClick={() => { setPaying(false); setError(''); }}>Voltar</button>
        </form>
      ) : (
        <div className="d-grid gap-2">
          <button type="button" className="btn btn-lime btn-lg" onClick={() => setPaying(true)}>
            <i className="bi bi-check-lg" aria-hidden="true" />Confirmar e pagar
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setDeclining(true)}>Recusar</button>
        </div>
      )}
      {error && <p className="rejection mb-0" role="alert">{error}</p>}
    </div>
  );
}
