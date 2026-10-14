import { useT } from '../../i18n';
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import './PaymentReturn.css';

/**
 * Przelewy24 przekierowuje tu klienta po płatności. Webhook (p24-webhook)
 * przychodzi asynchronicznie i może dotrzeć z niewielkim opóźnieniem, więc
 * odpytujemy status zamówienia kilka razy zanim pokażemy wynik.
 */
export function PaymentReturn() {
  const [params] = useSearchParams();
  const orderId = Number(params.get('orderId'));
  const { t } = useT();
  const [status, setStatus] = useState<'checking' | 'paid' | 'pending'>('checking');

  useEffect(() => {
    if (!orderId) return;
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      try {
        const order = await orderApi.getById(orderId);
        if (order.status === 'Paid') { setStatus('paid'); return; }
      } catch { /* spróbuj ponownie */ }
      if (attempts < 6) setTimeout(check, 2000);
      else setStatus('pending');
    };
    check();
  }, [orderId]);

  return (
    <div className="payment-return-page">
      {status === 'checking' && <p>{t('payment.checking')}</p>}
      {status === 'paid' && (
        <>
          <h1>{t('payment.thanks')}</h1>
          <p>{t('payment.confirmed', { id: orderId })}</p>
        </>
      )}
      {status === 'pending' && (
        <>
          <h1>{t('payment.pendingTitle')}</h1>
          <p>{t('payment.pendingBody')}</p>
        </>
      )}
      <Link to="/account" className="btn btn-primary">{t('payment.myOrders')}</Link>
    </div>
  );
}
