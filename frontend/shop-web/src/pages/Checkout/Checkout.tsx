import { useT } from '../../i18n';
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
  const { t, pick } = useT();
  const [address, setAddress] = useState({ street: '', city: '', postalCode: '', country: t('checkout.defaultCountry') });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="checkout-page">
        <p>{t('checkout.loginRequired')}</p>
        <Button onClick={() => navigate('/login')}>{t('checkout.goLogin')}</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="checkout-page"><p>{t('cart.empty')}</p></div>;
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
      setError(err.message || t('checkout.failed'));
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <form className="checkout-form" onSubmit={handleSubmit}>
        <h1>{t('checkout.title')}</h1>
        {error && <div className="auth-error">{error}</div>}

        <label>{t('checkout.street')}</label>
        <input required value={address.street} onChange={update('street')} />
        <label>{t('checkout.city')}</label>
        <input required value={address.city} onChange={update('city')} />
        <label>{t('checkout.postalCode')}</label>
        <input required value={address.postalCode} onChange={update('postalCode')} />
        <label>{t('checkout.country')}</label>
        <input required value={address.country} onChange={update('country')} />

        <Button type="submit" disabled={loading}>
          {loading ? t('checkout.redirecting') : t('checkout.pay', { amount: totalPrice().toFixed(2) })}
        </Button>
      </form>

      <div className="checkout-summary">
        <h3>{t('checkout.yourOrder')}</h3>
        {items.map((i) => (
          <div className="checkout-summary-row" key={i.productId}>
            <span>{pick(i.name, i.nameEn)} × {i.quantity}</span>
            <span>{(i.price * i.quantity).toFixed(2)} {t('common.currency')}</span>
          </div>
        ))}
        <div className="checkout-summary-row checkout-summary-total">
          <span>{t('cart.total')}</span>
          <span>{totalPrice().toFixed(2)} {t('common.currency')}</span>
        </div>
        <p className="mock-note">{t('checkout.note')}</p>
      </div>
    </div>
  );
}
