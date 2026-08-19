import { env } from '@/config/env';
import { mockCreateOrder, mockGetOrder } from '@/api/mock/orders';
import { api } from './client';
import { endpoints } from './endpoints';
import { ApiError } from './errors';
import type { CartLine, CreateOrderResponse, Order, PlaceOrderInput } from '@/types';

type RawRestaurantRef = string | { _id?: string; name?: string };

type RawOrder = Omit<Order, 'id' | 'restaurantId' | 'restaurantName' | 'createdAt'> & {
  id?: string;
  _id?: string;
  restaurantId?: RawRestaurantRef;
  restaurantName?: string;
  createdAt?: string | Date;
};

function normalizeOrder(raw: RawOrder): Order {
  const restaurantRef = raw.restaurantId;
  const restaurantId =
    typeof restaurantRef === 'string'
      ? restaurantRef
      : String(restaurantRef?._id ?? restaurantRef ?? '');

  const restaurantName =
    raw.restaurantName ??
    (typeof restaurantRef === 'object' && restaurantRef ? restaurantRef.name : undefined) ??
    'Restaurant';

  return {
    id: String(raw.id ?? raw._id),
    restaurantId,
    restaurantName,
    items: raw.items,
    subtotal: raw.subtotal,
    deliveryFee: raw.deliveryFee,
    totalAmount: raw.totalAmount,
    paymentMethod: raw.paymentMethod,
    paymentStatus: raw.paymentStatus,
    status: raw.status,
    deliveryAddress: raw.deliveryAddress,
    createdAt:
      typeof raw.createdAt === 'string'
        ? raw.createdAt
        : new Date(raw.createdAt ?? Date.now()).toISOString(),
  };
}

export async function createOrder(input: PlaceOrderInput): Promise<Order> {
  if (env.useMockApi) {
    return mockCreateOrder(input);
  }

  const response = await api.post<CreateOrderResponse>(endpoints.orders.create, {
    restaurantId: input.restaurantId,
    items: input.items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
    })),
    deliveryAddress: input.deliveryAddress,
    paymentMethod: input.paymentMethod,
    lat: input.lat,
    lng: input.lng,
    bankName: input.bankName,
  });

  return normalizeOrder({
    ...response.data,
    restaurantName: input.restaurantName,
    items: (response.data.items ?? input.items) as CartLine[],
  });
}

export async function getOrder(id: string): Promise<Order> {
  if (env.useMockApi) {
    const order = await mockGetOrder(id);
    if (!order) {
      throw new ApiError({
        message: 'Order not found',
        status: 404,
        payload: null,
      });
    }
    return order;
  }

  const response = await api.get<CreateOrderResponse>(endpoints.orders.detail(id));
  return normalizeOrder(response.data);
}
