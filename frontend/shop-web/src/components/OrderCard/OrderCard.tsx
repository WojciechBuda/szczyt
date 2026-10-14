import { ReactNode } from 'react';
import { Order } from '../../types/Order';
import './OrderCard.css';

export const statusLabels: Record<string, string> = {
  Pending: 'Oczekujące',
  Paid: 'Opłacone',
  Shipped: 'Wysłane',
  Completed: 'Zrealizowane',
  Cancelled: 'Anulowane',
};

interface OrderCardProps {
  order: Order;
  /** Replaces the default status badge — used by the admin panel to show a status <select>. */
  statusControl?: ReactNode;
  /** Shows customer name/e-mail — relevant only in the admin panel. */
  showCustomer?: boolean;
}

export function OrderCard({ order, statusControl, showCustomer }: OrderCardProps) {
  return (
    <div className="order-card">
      <div className="order-card-header">
        <span className="order-card-id">Zamówienie #{order.id}</span>
        {statusControl ?? (
          <span className={`order-status status-${order.status.toLowerCase()}`}>
            {statusLabels[order.status] || order.status}
          </span>
        )}
      </div>

      <div className="order-card-meta">
        <span>{new Date(order.orderDate).toLocaleString('pl-PL')}</span>
        {showCustomer && order.customerName && (
          <span className="order-customer">{order.customerName} · {order.customerEmail}</span>
        )}
      </div>

      <div className="order-card-items">
        {order.items.map((item) => (
          <div key={item.productId} className="order-item-row">
            <img
              src={item.imageUrl || 'https://placehold.co/64x64?text=%20'}
              alt={item.productName}
              className="order-item-thumb"
            />
            <div className="order-item-info">
              <span className="order-item-name">{item.productName}</span>
              <span className="order-item-meta">{item.quantity} szt. × {item.unitPrice.toFixed(2)} zł</span>
            </div>
            <span className="order-item-total">{item.lineTotal.toFixed(2)} zł</span>
          </div>
        ))}
      </div>

      <div className="order-card-footer">
        <span>Adres: {order.shippingStreet}, {order.shippingPostalCode} {order.shippingCity}</span>
        <span className="order-card-total">Razem: {order.totalAmount.toFixed(2)} zł</span>
      </div>
    </div>
  );
}
