// Comprador: cesto em dois passos. 1) produtos e entrega por produtor (uma encomenda por produtor);
// 2) resumo e pagamento. O passo fica no endereço (?step=payment) para o "voltar" do browser funcionar.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import CategoryTile from '../../components/CategoryTile/CategoryTile.jsx';
import PaymentForm, { EMPTY_PAYMENT, paymentBody } from '../../components/PaymentForm/PaymentForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { createOrders } from '../../api/orders.js';
import { euro, initials } from '../../utils/format.js';
import './Cart.scss';

const STEPS = [['items', 'Cesto e entrega'], ['payment', 'Resumo e pagamento']];

export default function Cart() {
  const { token } = useAuth();
  const { items, groups, total, setQuantity, remove, clear } = useCart();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [deliveries, setDeliveries] = useState({}); // { [producerId]: { type, address } }
  const [reviewed, setReviewed] = useState(false); // só se chega ao pagamento depois de passar pelo 1.º passo
  const [payment, setPayment] = useState(EMPTY_PAYMENT);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const step = params.get('step') === 'payment' && reviewed ? 'payment' : 'items';
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const deliveryOf = (id) => deliveries[id] || { type: 'pickup', address: '' };
  const changeDelivery = (id, field, value) => setDeliveries((d) => ({ ...d, [id]: { ...deliveryOf(id), [field]: value } }));
  const orderCount = groups.length === 1 ? '1 encomenda' : `${groups.length} encomendas`;

  function goToPayment(e) {
    e.preventDefault();
    setReviewed(true);
    setParams({ step: 'payment' });
  }

  async function placeOrder(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const created = await createOrders(
        items.map((i) => ({ product: i.product._id, quantity: i.quantity })),
        Object.fromEntries(groups.map((g) => [g.producer._id, deliveryOf(g.producer._id)])),
        paymentBody(payment),
        token
      );
      clear();
      navigate('/orders', { state: { created: created.length, payment: created[0]?.payment } });
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="page-header"><h1>Cesto</h1></div>
        <div className="panel empty-state">
          <i className="bi bi-basket fs-1 muted" aria-hidden="true" />
          <h2 className="h3 mt-2">O seu cesto está vazio.</h2>
          <p className="muted">Adicione produtos no catálogo com o botão "+".</p>
          <Link className="btn btn-primary" to="/">Ver produtos</Link>
        </div>
      </div>
    );
  }

  const stepper = (
    <ol className="checkout-steps" aria-label="Passos da compra">
      {STEPS.map(([key, label], i) => {
        const current = key === step;
        const done = step === 'payment' && key === 'items';
        return (
          <li key={key} className={current ? 'is-current' : done ? 'is-done' : ''} aria-current={current ? 'step' : undefined}>
            {done ? (
              <button type="button" onClick={() => setParams({})}>
                <span className="checkout-steps__n"><i className="bi bi-check-lg" aria-hidden="true" /></span>{label}
              </button>
            ) : (
              <span><span className="checkout-steps__n">{i + 1}</span>{label}</span>
            )}
          </li>
        );
      })}
    </ol>
  );

  if (step === 'payment') {
    return (
      <div className="page">
        <div className="page-header"><div><h1>Pagamento</h1><p>Confirme o que vai encomendar e escolha como pagar.</p></div></div>
        {stepper}

        <form className="cart" onSubmit={placeOrder}>
          <section className="panel" aria-labelledby="pay-title">
            <h2 className="h3 mb-3" id="pay-title">Método de pagamento</h2>
            <PaymentForm value={payment} onChange={setPayment} idPrefix="cart-pay" hideLegend />
          </section>

          <aside className="panel summary" aria-labelledby="review-title">
            <div className="d-flex align-items-baseline justify-content-between gap-2 mb-2">
              <h2 className="h3 mb-0" id="review-title">Resumo</h2>
              <button className="btn btn-link btn-sm p-0" type="button" onClick={() => setParams({})}>Alterar</button>
            </div>
            {groups.map(({ producer, items: producerItems, subtotal }) => {
              const delivery = deliveryOf(producer._id);
              return (
                <div className="review-group" key={producer._id}>
                  <b>{producer.name}</b>
                  <ul>
                    {producerItems.map(({ product, quantity }) => (
                      <li key={product._id}>
                        <span>{product.name} <span className="muted num">× {quantity}</span></span>
                        <span className="num">{euro(product.price * quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="review-group__delivery">
                    {delivery.type === 'delivery'
                      ? <><i className="bi bi-truck me-1" aria-hidden="true" />Entrega em {delivery.address}</>
                      : <><i className="bi bi-shop me-1" aria-hidden="true" />Levantar na quinta, {producer.city}</>}
                  </p>
                  {groups.length > 1 && <div className="total-row muted small"><span>Subtotal</span><span className="num">{euro(subtotal)}</span></div>}
                </div>
              );
            })}
            <div className="total-row align-items-baseline mt-3"><span>Total</span><span className="big num">{euro(total)}</span></div>
            <p className="small muted mb-0">{orderCount}, paga{groups.length === 1 ? '' : 's'} de uma só vez.</p>
            {error && <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert"><i className="bi bi-exclamation-circle me-1" aria-hidden="true" />{error}</div>}
            <button className="btn btn-primary btn-lg w-100 mt-3" type="submit" disabled={sending}>
              <i className="bi bi-lock" aria-hidden="true" />{sending ? 'A processar o pagamento…' : `Pagar ${euro(total)}`}
            </button>
          </aside>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header"><div><h1>Cesto</h1><p>Cada produtor recebe uma encomenda separada, com a sua forma de entrega.</p></div></div>
      {stepper}

      <form className="cart" onSubmit={goToPayment}>
        <div className="d-grid gap-3">
          {groups.map(({ producer, items: producerItems }) => {
            const delivery = deliveryOf(producer._id);
            return (
              <section className="panel producer-group" key={producer._id} aria-labelledby={`g-${producer._id}`}>
                <h2 className="h3" id={`g-${producer._id}`}>
                  <span className="who"><span className="initials" aria-hidden="true">{initials(producer.name)}</span></span>
                  <Link to={`/producers/${producer._id}`}>{producer.name}</Link>
                  <span className="muted fw-normal small ms-auto">{producer.city}</span>
                </h2>

                {producerItems.map(({ product, quantity }) => (
                  <div className="cart-item" key={product._id}>
                    <CategoryTile as="span" category={product.category} imageUrl={product.imageUrl} alt={product.name} />
                    <div>
                      <h3>{product.name}</h3>
                      <small className="muted">{euro(product.price)} / {product.unit}</small>
                      <div className="mt-2 d-flex gap-2 align-items-center flex-wrap">
                        <div className="quantity" role="group" aria-label={`Quantidade de ${product.name}`}>
                          <button type="button" aria-label="Menos" disabled={quantity <= 1} onClick={() => setQuantity(product._id, quantity - 1)}>
                            <i className="bi bi-dash" aria-hidden="true" />
                          </button>
                          <span aria-live="polite">{quantity}</span>
                          <button type="button" aria-label="Mais" disabled={quantity >= product.stock} onClick={() => setQuantity(product._id, quantity + 1)}>
                            <i className="bi bi-plus" aria-hidden="true" />
                          </button>
                        </div>
                        <button className="btn btn-link btn-sm muted" type="button" onClick={() => remove(product._id)}>Remover</button>
                      </div>
                    </div>
                    <b className="num">{euro(product.price * quantity)}</b>
                  </div>
                ))}

                <fieldset className="mt-3">
                  <legend className="form-label">Como quer receber?</legend>
                  <div className="delivery-choice">
                    <label>
                      <input type="radio" name={`delivery-${producer._id}`} checked={delivery.type === 'pickup'}
                        onChange={() => changeDelivery(producer._id, 'type', 'pickup')} />
                      <b><i className="bi bi-shop me-1" aria-hidden="true" />Levantar na quinta</b>
                      <small>{producer.city}</small>
                    </label>
                    <label>
                      <input type="radio" name={`delivery-${producer._id}`} checked={delivery.type === 'delivery'}
                        onChange={() => changeDelivery(producer._id, 'type', 'delivery')} />
                      <b><i className="bi bi-truck me-1" aria-hidden="true" />Entrega</b>
                      <small>Na sua morada</small>
                    </label>
                  </div>
                  {delivery.type === 'delivery' && (
                    <>
                      <label htmlFor={`address-${producer._id}`} className="form-label mt-3">Morada de entrega</label>
                      <input id={`address-${producer._id}`} className="form-control" required autoComplete="street-address"
                        value={delivery.address} onChange={(e) => changeDelivery(producer._id, 'address', e.target.value)} />
                    </>
                  )}
                </fieldset>
              </section>
            );
          })}
        </div>

        <aside className="panel summary">
          <h2 className="h3 mb-3">Resumo</h2>
          {groups.map((g) => (
            <div className="total-row muted" key={g.producer._id}><span>{g.producer.name}</span><span className="num">{euro(g.subtotal)}</span></div>
          ))}
          <hr />
          <div className="total-row align-items-baseline"><span>Total</span><span className="big num">{euro(total)}</span></div>
          <p className="small muted mb-0">{groups.length === 1 ? 'Vai ser criada' : 'Vão ser criadas'} {orderCount}, uma por produtor.</p>
          <button className="btn btn-primary btn-lg w-100 mt-3" type="submit">Continuar para o pagamento</button>
          <Link className="btn btn-link w-100 mt-1" to="/">Continuar a comprar</Link>
        </aside>
      </form>
    </div>
  );
}
