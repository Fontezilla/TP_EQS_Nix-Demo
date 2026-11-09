// Pagamento fictício: cartão ou MB WAY. Os dados são validados pela API e nunca guardados
// (do cartão só ficam a marca e os últimos 4 dígitos). Usado no cesto e na confirmação de um leilão ganho.
import './PaymentForm.scss';

export const EMPTY_PAYMENT = { method: 'card', number: '', name: '', expiry: '', cvc: '', phone: '' };

// Só o que o método escolhido precisa vai para a API
export const paymentBody = (p) => (p.method === 'card'
  ? { method: 'card', number: p.number, name: p.name, expiry: p.expiry, cvc: p.cvc }
  : { method: 'mbway', phone: p.phone });

const groups = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim(); // 4242 4242 4242 4242
const expiry = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

export default function PaymentForm({ value, onChange, idPrefix = 'pay', dark = false, hideLegend = false }) {
  const set = (field, format = (v) => v) => (e) => onChange({ ...value, [field]: format(e.target.value) });
  const id = (f) => `${idPrefix}-${f}`;

  return (
    <fieldset className={`payment-form ${dark ? 'payment-form--dark' : ''}`}>
      <legend className={hideLegend ? 'visually-hidden' : 'form-label'}>Pagamento</legend>
      <div className="segmented payment-form__methods" role="radiogroup" aria-label="Método de pagamento">
        {[['card', 'bi-credit-card', 'Cartão'], ['mbway', 'bi-phone', 'MB WAY']].map(([m, icon, label]) => (
          <span key={m}>
            <input type="radio" id={id(m)} name={id('method')} checked={value.method === m} onChange={() => onChange({ ...value, method: m })} />
            <label htmlFor={id(m)}><i className={`bi ${icon} me-1`} aria-hidden="true" />{label}</label>
          </span>
        ))}
      </div>

      {value.method === 'card' ? (
        <div className="row g-2 mt-1">
          <div className="col-12">
            <label className="form-label small" htmlFor={id('number')}>Número do cartão</label>
            <input id={id('number')} className="form-control num" inputMode="numeric" autoComplete="off" required
              placeholder="4242 4242 4242 4242" value={value.number} onChange={set('number', groups)} />
          </div>
          <div className="col-12">
            <label className="form-label small" htmlFor={id('name')}>Nome no cartão</label>
            <input id={id('name')} className="form-control" autoComplete="off" required value={value.name} onChange={set('name')} />
          </div>
          <div className="col-6">
            <label className="form-label small" htmlFor={id('expiry')}>Validade</label>
            <input id={id('expiry')} className="form-control num" inputMode="numeric" autoComplete="off" required placeholder="MM/AA"
              value={value.expiry} onChange={set('expiry', expiry)} />
          </div>
          <div className="col-6">
            <label className="form-label small" htmlFor={id('cvc')}>CVC</label>
            <input id={id('cvc')} className="form-control num" inputMode="numeric" autoComplete="off" required maxLength={4} placeholder="123"
              value={value.cvc} onChange={set('cvc', (v) => v.replace(/\D/g, ''))} />
          </div>
        </div>
      ) : (
        <div className="mt-1">
          <label className="form-label small" htmlFor={id('phone')}>Telemóvel associado ao MB WAY</label>
          <input id={id('phone')} className="form-control num" inputMode="tel" autoComplete="off" required placeholder="912 345 678"
            value={value.phone} onChange={set('phone', (v) => v.replace(/[^\d ]/g, '').slice(0, 11))} />
          <p className="form-text mb-0">O pedido aparece na app MB WAY; aqui é aprovado na hora.</p>
        </div>
      )}

      <p className="payment-form__note">
        <i className="bi bi-info-circle me-1" aria-hidden="true" />
        Pagamento fictício: não use dados reais. Cartão de teste aceite <span className="num">4242 4242 4242 4242</span>;
        recusado <span className="num">4000 0000 0000 0002</span>.
      </p>
    </fieldset>
  );
}
