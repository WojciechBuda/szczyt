import { useT } from '../../i18n';
import type { TranslationKey } from '../../i18n/pl';
import { fallbackImage, onImageError } from '../../lib/images';
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
  const { t, locale } = useT();
  return (
    <div className="order-card">
      <div className="order-card-header">
        <span className="order-card-id">{t('order.title', { id: order.id })}</span>
        {statusControl ?? (
          <span className={`order-status status-${order.status.toLowerCase()}`}>
            {statusLabels[order.status] ? t(`order.status.${order.status}` as TranslationKey) : order.status}
          </span>
        )}
      </div>

      <div className="order-card-meta">
        <span>{new Date(order.orderDate).toLocaleString(locale)}</span>
        {showCustomer && order.customerName && (
          <span className="order-customer">{order.customerName} · {order.customerEmail}</span>
        )}
      </div>

      <div className="order-card-items">
        {order.items.map((item) => (
          <div key={item.productId} className="order-item-row">
            <img
              src={item.imageUrl || fallbackImage(item.productName)}
              alt={item.productName}
              className="order-item-thumb"
              loading="lazy"
              onError={onImageError(fallbackImage(item.productName))}
            />
            <div className="order-item-info">
              <span className="order-item-name">{item.productName}</span>
              <span className="order-item-meta">{item.quantity} {t('common.pcs')} × {item.unitPrice.toFixed(2)} {t('common.currency')}</span>
            </div>
            <span className="order-item-total">{item.lineTotal.toFixed(2)} {t('common.currency')}</span>
          </div>
        ))}
      </div>

      <div className="order-card-footer">
        <span>{t('order.address', { street: order.shippingStreet, postalCode: order.shippingPostalCode, city: order.shippingCity })}</span>
        <span className="order-card-total">{t('order.total', { amount: order.totalAmount.toFixed(2) })}</span>
      </div>
    </div>
  );
}
