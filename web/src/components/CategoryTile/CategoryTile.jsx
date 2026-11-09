// Quadro de cor da categoria com a foto do produto ou, sem foto, a ilustração da categoria
import Illustration from '../Illustration/Illustration.jsx';

export default function CategoryTile({ category = 'other', imageUrl, alt = '', as: Element = 'div', className = '', children }) {
  return (
    <Element className={`tile cat-${category} ${className}`}>
      {children}
      {imageUrl ? <img src={imageUrl} alt={alt} /> : <Illustration category={category} />}
    </Element>
  );
}
