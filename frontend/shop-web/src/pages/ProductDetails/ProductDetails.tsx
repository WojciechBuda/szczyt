import { useT } from '../../i18n';
import { fallbackImage, onImageError } from '../../lib/images';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { Product } from '../../types/Product';
import { useCartStore } from '../../store/cartStore';
import { Button } from '../../components/Button/Button';
import './ProductDetails.css';

export function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const { t, pick } = useT();

  useEffect(() => {
    if (id) productApi.getById(Number(id)).then(setProduct);
  }, [id]);

  if (!product) return <div className="pd-loading">{t('common.loading')}</div>;

  return (
    <div className="product-details">
      <img
        src={product.imageUrl || fallbackImage(product.categoryName)}
        alt={pick(product.name, product.nameEn)}
        className="pd-image"
        width={800}
        height={600}
        onError={onImageError(fallbackImage(product.categoryName))}
      />
      <div className="pd-info">
        <span className="pd-category">{pick(product.categoryName, product.categoryNameEn)}</span>
        <h1>{pick(product.name, product.nameEn)}</h1>
        <p className="pd-description">{pick(product.description, product.descriptionEn)}</p>
        <div className="pd-price">{product.price.toFixed(2)} {t('common.currency')}</div>
        <div className="pd-stock">
          {product.stock > 0 ? t('product.inStock', { n: product.stock }) : t('product.unavailable')}
        </div>

        {product.stock > 0 && (
          <div className="pd-actions">
            <input
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
            />
            <Button onClick={() => { addItem(product, quantity); setAdded(true); setTimeout(() => setAdded(false), 1500); }}>
              {added ? t('product.added') : t('product.addToCart')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
