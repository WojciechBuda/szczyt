import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { CartSummary } from '../../components/Cart/CartDrawer';
import './Cart.css';

export function Cart() {
  const { items, updateQuantity, removeItem } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <p>Twój koszyk jest pusty.</p>
        <Link to="/products"><button className="btn btn-primary">Przeglądaj produkty</button></Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-items">
        <h1>Koszyk</h1>
        {items.map((item) => (
          <div className="cart-item" key={item.productId}>
            <img src={item.imageUrl || 'https://placehold.co/80x80'} alt={item.name} />
            <div className="cart-item-info">
              <span className="cart-item-name">{item.name}</span>
              <span className="cart-item-price">{item.price.toFixed(2)} zł</span>
            </div>
            <input
              type="number"
              min={1}
              max={item.stock}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
            />
            <span className="cart-item-total">{(item.price * item.quantity).toFixed(2)} zł</span>
            <button className="remove-btn" onClick={() => removeItem(item.productId)}>✕</button>
          </div>
        ))}
      </div>

      <CartSummary />
    </div>
  );
}
