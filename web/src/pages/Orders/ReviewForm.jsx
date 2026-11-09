// Avaliar uma encomenda entregue: estrelas de 1 a 5 e um comentário opcional
import { Fragment, useEffect, useState } from 'react';
import Modal from '../../components/Modal/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { createReview } from '../../api/reviews.js';
import { orderNumber } from '../../api/orders.js';

export default function ReviewForm({ order, onClose, onReviewed }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { setRating(0); setComment(''); setError(''); }, [order?._id]);

  async function publish() {
    if (!rating) return setError('Escolha de 1 a 5 estrelas.');
    setSending(true);
    try {
      await createReview({ order: order._id, rating, comment }, token);
      onReviewed();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal title={order ? `Avaliar a encomenda ${orderNumber(order._id)}` : ''} open={!!order}
      onClose={onClose} onSubmit={publish}
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'A publicar…' : 'Publicar avaliação'}</button>
      </>}>
      {order && (
        <>
          <p className="muted">{order.producer.name}: {order.items.map((i) => i.name).join(', ')}</p>
          <fieldset className="mb-3">
            <legend className="form-label">Classificação</legend>
            {/* Ordem invertida (row-reverse): o CSS acende a escolhida e as que ficam à esquerda (~) */}
            <div className="star-picker">
              {[5, 4, 3, 2, 1].map((n) => (
                <Fragment key={n}>
                  <input type="radio" name="rating" id={`s${n}`} value={n} checked={rating === n} onChange={() => setRating(n)} />
                  <label htmlFor={`s${n}`} title={`${n} em 5`}><i className="bi bi-star-fill" aria-hidden="true" /><span className="visually-hidden">{n} em 5</span></label>
                </Fragment>
              ))}
            </div>
          </fieldset>
          <label htmlFor="comment" className="form-label">Comentário <span className="muted fw-normal">(opcional)</span></label>
          <textarea id="comment" className="form-control" rows="3" maxLength={1000} placeholder="Como correu a encomenda?"
            value={comment} onChange={(e) => setComment(e.target.value)} />
          <p className="form-text">A avaliação conta para o produtor e para os produtos desta encomenda.</p>
          {error && <div className="alert alert-danger py-2 small mb-0" role="alert">{error}</div>}
        </>
      )}
    </Modal>
  );
}
