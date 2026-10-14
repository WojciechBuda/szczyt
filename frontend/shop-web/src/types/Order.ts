export interface OrderItem {
  productId: number;
  productName: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  shippingStreet: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  customerName?: string | null;
  customerEmail?: string | null;
}

export interface CartItem {
  productId: number;
  name: string;
  nameEn?: string | null;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  stock: number;
}
