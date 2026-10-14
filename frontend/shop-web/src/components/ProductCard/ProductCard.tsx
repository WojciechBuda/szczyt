import { Link } from 'react-router-dom';
import { Product } from '../../types/Product';
import { useCartStore } from '../../store/cartStore';
import { Button } from '../Button/Button';
import './ProductCard.css';

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-image-link">
        <img
          src={product.imageUrl || 'https://placehold.co/400x300?text=Brak+zdjecia'}
          alt={product.name}
          className="product-card-image"
        />
      </Link>
      <div className="product-card-body">
        <span className="product-card-category">{product.categoryName}</span>
        <Link to={`/products/${product.id}`} className="product-card-title">{product.name}</Link>
        <div className="product-card-footer">
          <span className="product-card-price">{product.price.toFixed(2)} zł</span>
          <Button
            disabled={product.stock === 0}
            onClick={() => addItem(product, 1)}
          >
            {product.stock === 0 ? 'Brak' : 'Do koszyka'}
          </Button>
        </div>
      </div>
    </div>
  );
}
