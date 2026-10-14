import { useT } from '../../i18n';
import { fallbackImage, onImageError } from '../../lib/images';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { CartSummary } from '../../components/Cart/CartDrawer';
import './Cart.css';

export function Cart() {
  const { items, updateQuantity, removeItem } = useCartStore();
  const { t, pick } = useT();

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <p>{t('cart.empty')}</p>
        <Link to="/products" className="btn btn-primary">{t('cart.browse')}</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-items">
        <h1>{t('cart.title')}</h1>
        {items.map((item) => (
          <div className="cart-item" key={item.productId}>
            <img src={item.imageUrl || fallbackImage(item.name)} alt={item.name} width={60} height={60} loading="lazy" onError={onImageError(fallbackImage(item.name))} />
            <div className="cart-item-info">
              <span className="cart-item-name">{pick(item.name, item.nameEn)}</span>
              <span className="cart-item-price">{item.price.toFixed(2)} {t('common.currency')}</span>
            </div>
            <input
              type="number"
              min={1}
              max={item.stock}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
            />
            <span className="cart-item-total">{(item.price * item.quantity).toFixed(2)} {t('common.currency')}</span>
            <button className="remove-btn" onClick={() => removeItem(item.productId)} aria-label={t('cart.remove', { name: item.name })}>✕</button>
          </div>
        ))}
      </div>

      <CartSummary />
    </div>
  );
}
