import { t } from '../i18n';
import { supabase } from '../lib/supabaseClient';
import { Order } from '../types/Order';

export interface CreateOrderPayload {
  items: { productId: number; quantity: number }[];
  shippingAddress: { street: string; city: string; postalCode: string; country: string };
}

interface OrderItemRow {
  product_id: number;
  product_name: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface OrderRow {
  id: number;
  order_date: string;
  status: string;
  total_amount: number;
  shipping_street: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  order_items: OrderItemRow[];
  profiles: { first_name: string; last_name: string; email: string } | null;
}

const ORDER_SELECT =
  'id, order_date, status, total_amount, shipping_street, shipping_city, shipping_postal_code, shipping_country, order_items(product_id, product_name, image_url, unit_price, quantity, line_total), profiles(first_name, last_name, email)';

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderDate: row.order_date,
    status: row.status,
    totalAmount: Number(row.total_amount),
    items: row.order_items.map((i) => ({
      productId: i.product_id,
      productName: i.product_name,
      imageUrl: i.image_url,
      unitPrice: Number(i.unit_price),
      quantity: i.quantity,
      lineTotal: Number(i.line_total),
    })),
    shippingStreet: row.shipping_street,
    shippingCity: row.shipping_city,
    shippingPostalCode: row.shipping_postal_code,
    shippingCountry: row.shipping_country,
    customerName: row.profiles ? `${row.profiles.first_name} ${row.profiles.last_name}`.trim() : null,
    customerEmail: row.profiles?.email || null,
  };
}

export const orderApi = {
  // Runs as a single atomic transaction on the database (validates stock, decrements it,
  // snapshots product name/image/price into order_items) — see supabase/schema.sql.
  // The function returns the full orders row (as a single JSON object), so we pull its id
  // and re-fetch through getById() to get the joined order_items/profiles data too.
  create: async (data: CreateOrderPayload): Promise<Order> => {
    const { data: newOrder, error } = await supabase.rpc('create_order', {
      items: data.items,
      shipping: data.shippingAddress,
    });
    if (error) throw error;
    const orderId = (newOrder as { id: number }).id;
    return orderApi.getById(orderId);
  },

  myOrders: async (): Promise<Order[]> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error(t('err.loginRequired'));

    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('user_id', auth.user.id)
      .order('order_date', { ascending: false });
    if (error) throw error;
    return (data as unknown as OrderRow[]).map(toOrder);
  },

  getById: async (id: number): Promise<Order> => {
    const { data, error } = await supabase.from('orders').select(ORDER_SELECT).eq('id', id).single();
    if (error) throw error;
    return toOrder(data as unknown as OrderRow);
  },

  // Admin — allowed by the "admin sees/updates all orders" RLS policies.
  all: async (): Promise<Order[]> => {
    const { data, error } = await supabase.from('orders').select(ORDER_SELECT).order('order_date', { ascending: false });
    if (error) throw error;
    return (data as unknown as OrderRow[]).map(toOrder);
  },

  updateStatus: async (id: number, status: string): Promise<void> => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) throw error;
  },

  stats: async () => {
    const { data, error } = await supabase.rpc('get_admin_stats').single();
    if (error) throw error;
    const row = data as { total_products: number; total_orders: number; total_users: number; revenue: number };
    return {
      totalProducts: row.total_products,
      totalOrders: row.total_orders,
      totalUsers: row.total_users,
      revenue: Number(row.revenue),
    };
  },
};
