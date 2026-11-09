// Componente reutilizável: cartão de produto (catálogo e página do produtor)
import { Link } from 'react-router-dom';
import CategoryTile from '../CategoryTile/CategoryTile.jsx';
import { euro, initials } from '../../utils/format.js';
import './ProductCard.scss';

export default function ProductCard({ product, onAdd, showProducer = true }) {
  const soldOut = product.stock === 0;

  return (
    <article className={`product ${soldOut ? 'sold-out' : ''}`}>
      <CategoryTile category={product.category} imageUrl={product.imageUrl} alt={product.name}>
        {/* Um produto ocultado pelo administrador só aparece ao próprio produtor */}
        {product.hidden
          ? <span className="tag tag-notice">Ocultado pelo administrador</span>
          : soldOut
            ? <span className="tag tag-notice">Esgotado</span>
            : product.organic && <span className="tag">Biológico</span>}
      </CategoryTile>

      <div className="product__info">
        <h3>{product.name}</h3>
        {showProducer ? (
          <Link className="who" to={`/producers/${product.producer._id}`}>
            <span className="initials" aria-hidden="true">{initials(product.producer.name)}</span>
            {product.producer.name}, {product.producer.city}
          </Link>
        ) : (
          <span className="muted small">{soldOut ? 'Sem stock' : `${product.stock} ${product.unit} em stock`}</span>
        )}

        <div className="product__footer">
          <span className="price">{euro(product.price)} <small>/{product.unit}</small></span>
          {onAdd && (
            <button className="btn btn-primary btn-round" type="button" disabled={soldOut} onClick={() => onAdd(product)}
              aria-label={soldOut ? `${product.name} esgotado` : `Adicionar ${product.name} ao cesto`}>
              <i className="bi bi-plus-lg" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
