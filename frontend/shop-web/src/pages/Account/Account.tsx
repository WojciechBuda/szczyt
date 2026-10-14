import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { orderApi } from '../../api/orderApi';
import { Order } from '../../types/Order';
import { OrderCard } from '../../components/OrderCard/OrderCard';
import './Account.css';

export function Account() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    orderApi.myOrders().then(setOrders);
  }, []);

  if (!user) return <div className="account-page"><p>Zaloguj się, aby zobaczyć swoje konto.</p></div>;

  return (
    <div className="account-page">
      <h1>Moje konto</h1>
      <div className="account-card">
        <p><strong>{user.firstName} {user.lastName}</strong></p>
        <p>{user.email}</p>
      </div>

      <h2>Historia zamówień</h2>
      {orders.length === 0 && <p className="empty-msg">Nie masz jeszcze żadnych zamówień.</p>}

      <div className="orders-list">
        {orders.map((o) => <OrderCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}
