// Ilustração da categoria (sprite em public/illustrations.svg); usada quando o produto não tem foto.
// O id de cada símbolo é o código da categoria (fruit, honey…).
export default function Illustration({ category = 'other', symbol, className = '' }) {
  return (
    <svg className={`illus ${className}`} aria-hidden="true">
      <use href={`/illustrations.svg#${symbol || category}`} />
    </svg>
  );
}
