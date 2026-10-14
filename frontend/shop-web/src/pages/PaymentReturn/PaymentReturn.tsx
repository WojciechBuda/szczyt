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
      {status === 'checking' && <p>Sprawdzamy status płatności...</p>}
      {status === 'paid' && (
        <>
          <h1>Dziękujemy! ✅</h1>
          <p>Płatność za zamówienie #{orderId} została potwierdzona.</p>
        </>
      )}
      {status === 'pending' && (
        <>
          <h1>Płatność w toku</h1>
          <p>Jeszcze nie widzimy potwierdzenia od Przelewy24 — czasem trwa to chwilę dłużej. Sprawdź status w swoim koncie za kilka minut.</p>
        </>
      )}
      <Link to="/account" className="btn btn-primary">Przejdź do moich zamówień</Link>
    </div>
  );
}
