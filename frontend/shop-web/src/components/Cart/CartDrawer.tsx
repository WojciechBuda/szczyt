import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import './CartDrawer.css';

/** Compact cart summary — used inside the Cart page. */
export function CartSummary() {
  const { items, totalPrice } = useCartStore();

  return (
    <div className="cart-summary">
      <h3>Podsumowanie</h3>
      <div className="cart-summary-row">
        <span>Produkty ({items.length})</span>
        <span>{totalPrice().toFixed(2)} zł</span>
      </div>
      <div className="cart-summary-row cart-summary-total">
        <span>Razem</span>
        <span>{totalPrice().toFixed(2)} zł</span>
      </div>
      <Link
        to="/checkout"
        className={`btn btn-primary checkout-btn${items.length === 0 ? ' is-disabled' : ''}`}
        aria-disabled={items.length === 0}
      >
        Przejdź do kasy
      </Link>
    </div>
  );
}
