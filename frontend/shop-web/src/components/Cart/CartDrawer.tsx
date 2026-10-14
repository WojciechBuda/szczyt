import { useT } from '../../i18n';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import './CartDrawer.css';

/** Compact cart summary — used inside the Cart page. */
export function CartSummary() {
  const { items, totalPrice } = useCartStore();
  const { t } = useT();

  return (
    <div className="cart-summary">
      <h3>{t('cart.summary')}</h3>
      <div className="cart-summary-row">
        <span>{t('cart.products', { n: items.length })}</span>
        <span>{totalPrice().toFixed(2)} {t('common.currency')}</span>
      </div>
      <div className="cart-summary-row cart-summary-total">
        <span>{t('cart.total')}</span>
        <span>{totalPrice().toFixed(2)} {t('common.currency')}</span>
      </div>
      <Link
        to="/checkout"
        className={`btn btn-primary checkout-btn${items.length === 0 ? ' is-disabled' : ''}`}
        aria-disabled={items.length === 0}
      >
        {t('cart.checkout')}
      </Link>
    </div>
  );
}
