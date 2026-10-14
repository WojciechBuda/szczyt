import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { orderApi } from '../../api/orderApi';
import { paymentApi } from '../../api/paymentApi';
import { Button } from '../../components/Button/Button';
import './Checkout.css';

export function Checkout() {
  const { items, totalPrice, clear } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ street: '', city: '', postalCode: '', country: 'Polska' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="checkout-page">
        <p>Musisz się zalogować, aby dokończyć zamówienie.</p>
        <Button onClick={() => navigate('/login')}>Przejdź do logowania</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="checkout-page"><p>Twój koszyk jest pusty.</p></div>;
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((a) => ({ ...a, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const order = await orderApi.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: address,
      });
      // Przelewy24 sam pokazuje wybór metody (BLIK/karta/przelew) na swojej stronie —
      // nie musimy pytać o to wcześniej.
      const redirectUrl = await paymentApi.createP24Payment(order.id);
      clear();
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message || 'Nie udało się złożyć zamówienia.');
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <form className="checkout-form" onSubmit={handleSubmit}>
        <h1>Dane dostawy</h1>
        {error && <div className="auth-error">{error}</div>}

        <label>Ulica i numer</label>
        <input required value={address.street} onChange={update('street')} />
        <label>Miasto</label>
        <input required value={address.city} onChange={update('city')} />
        <label>Kod pocztowy</label>
        <input required value={address.postalCode} onChange={update('postalCode')} />
        <label>Kraj</label>
        <input required value={address.country} onChange={update('country')} />

        <Button type="submit" disabled={loading}>
          {loading ? 'Przekierowanie do płatności...' : `Zapłać ${totalPrice().toFixed(2)} zł przez Przelewy24`}
        </Button>
      </form>

      <div className="checkout-summary">
        <h3>Twoje zamówienie</h3>
        {items.map((i) => (
          <div className="checkout-summary-row" key={i.productId}>
            <span>{i.name} × {i.quantity}</span>
            <span>{(i.price * i.quantity).toFixed(2)} zł</span>
          </div>
        ))}
        <div className="checkout-summary-row checkout-summary-total">
          <span>Razem</span>
          <span>{totalPrice().toFixed(2)} zł</span>
        </div>
        <p className="mock-note">Po kliknięciu zostaniesz przeniesiony na stronę Przelewy24, gdzie wybierzesz metodę płatności (BLIK, karta, przelew).</p>
      </div>
    </div>
  );
}
