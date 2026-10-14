import { useT } from '../../i18n';
import { Link } from 'react-router-dom';
import { Product } from '../../types/Product';
import { useCartStore } from '../../store/cartStore';
import { Button } from '../Button/Button';
import { fallbackImage, onImageError } from '../../lib/images';
import './ProductCard.css';

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const { t, pick } = useT();
  const name = pick(product.name, product.nameEn);

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-image-link">
        <img
          src={product.imageUrl || fallbackImage(product.categoryName)}
          alt={name}
          className="product-card-image"
          width={400}
          height={300}
          loading="lazy"
          decoding="async"
          onError={onImageError(fallbackImage(product.categoryName))}
        />
      </Link>
      <div className="product-card-body">
        <span className="product-card-category">{pick(product.categoryName, product.categoryNameEn)}</span>
        <Link to={`/products/${product.id}`} className="product-card-title">{name}</Link>
        <div className="product-card-footer">
          <span className="product-card-price">{product.price.toFixed(2)} {t('common.currency')}</span>
          <Button
            disabled={product.stock === 0}
            onClick={() => addItem(product, 1)}
          >
            {product.stock === 0 ? t('product.soldOut') : t('product.add')}
          </Button>
        </div>
      </div>
    </div>
  );
}
