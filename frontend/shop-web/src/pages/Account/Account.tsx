import { useT } from '../../i18n';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { orderApi } from '../../api/orderApi';
import { Order } from '../../types/Order';
import { OrderCard } from '../../components/OrderCard/OrderCard';
import './Account.css';

export function Account() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const { t } = useT();

  useEffect(() => {
    orderApi.myOrders().then(setOrders);
  }, []);

  if (!user) return <div className="account-page"><p>{t('account.loginRequired')}</p></div>;

  return (
    <div className="account-page">
      <h1>{t('account.title')}</h1>
      <div className="account-card">
        <p><strong>{user.firstName} {user.lastName}</strong></p>
        <p>{user.email}</p>
      </div>

      <h2>{t('account.history')}</h2>
      {orders.length === 0 && <p className="empty-msg">{t('account.noOrders')}</p>}

      <div className="orders-list">
        {orders.map((o) => <OrderCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}
