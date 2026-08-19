import type { CartLine } from './cart';

export type PaymentMethod = 'cash' | 'telebirr' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'proof_submitted' | 'verified' | 'paid' | 'failed';
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'prepared'
  | 'dispatched'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export type PlaceOrderInput = {
  restaurantId: string;
  restaurantName: string;
  items: Array<{
    menuItemId: string;
    itemName: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  lat: number;
  lng: number;
  bankName?: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
};

export type Order = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: CartLine[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  deliveryAddress: string;
  createdAt: string;
  driverName?: string;
  driverPhone?: string;
  deliveredAt?: string;
  etaMinutes?: number;
};

export type CreateOrderResponse = {
  success: boolean;
  data: Order & { _id?: string };
};

export type OrderListResponse = {
  success: boolean;
  data: Array<Order & { _id?: string }>;
};
