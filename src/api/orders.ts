import { env } from '@/config/env';
import {
  mockAcceptJob,
  mockCancelOrder,
  mockCreateOrder,
  mockGetActiveDelivery,
  mockGetOrder,
  mockListAvailableJobs,
  mockListDriverHistory,
  mockListMyOrders,
  mockListRestaurantOrders,
  mockUpdateOrderStatus,
  mockVerifyPayment,
} from '@/api/mock/orders';
import { api } from './client';
import { endpoints } from './endpoints';
import { ApiError } from './errors';
import type {
  ActiveDeliveryResponse,
  CartLine,
  CreateOrderResponse,
  DriverHistory,
  DriverHistoryResponse,
  Order,
  OrderListResponse,
  OrderStatus,
  PlaceOrderInput,
} from '@/types';

type RawRestaurantRef = string | { _id?: string; name?: string };
type RawDriverRef = string | { _id?: string; name?: string; phone?: string };
type RawCustomerRef = string | { _id?: string; name?: string; phone?: string };

type RawOrder = Omit<
  Order,
  | 'id'
  | 'restaurantId'
  | 'restaurantName'
  | 'createdAt'
  | 'driverId'
  | 'driverName'
  | 'driverPhone'
  | 'customerId'
  | 'customerName'
  | 'customerPhone'
> & {
  id?: string;
  _id?: string;
  restaurantId?: RawRestaurantRef;
  restaurantName?: string;
  createdAt?: string | Date;
  deliveredAt?: string | Date;
  driverId?: RawDriverRef;
  driverName?: string;
  driverPhone?: string;
  customerId?: RawCustomerRef;
  customerName?: string;
  customerPhone?: string;
};

export function normalizeOrder(raw: RawOrder): Order {
  const restaurantRef = raw.restaurantId;
  const restaurantId =
    typeof restaurantRef === 'string'
      ? restaurantRef
      : String(restaurantRef?._id ?? restaurantRef ?? '');

  const restaurantName =
    raw.restaurantName ??
    (typeof restaurantRef === 'object' && restaurantRef ? restaurantRef.name : undefined) ??
    'Restaurant';

  const driverRef = raw.driverId;
  const driverId =
    typeof driverRef === 'string'
      ? driverRef
      : driverRef && typeof driverRef === 'object' && '_id' in driverRef && driverRef._id
        ? String(driverRef._id)
        : undefined;
  const driverName =
    raw.driverName ?? (typeof driverRef === 'object' && driverRef ? driverRef.name : undefined);
  const driverPhone =
    raw.driverPhone ?? (typeof driverRef === 'object' && driverRef ? driverRef.phone : undefined);

  const customerRef = raw.customerId;
  const customerId =
    typeof customerRef === 'string'
      ? customerRef
      : customerRef?._id
        ? String(customerRef._id)
        : undefined;
  const customerName =
    raw.customerName ?? (typeof customerRef === 'object' && customerRef ? customerRef.name : undefined);
  const customerPhone =
    raw.customerPhone ?? (typeof customerRef === 'object' && customerRef ? customerRef.phone : undefined);

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
    customerId,
    customerName,
    customerPhone,
    driverId,
    driverName,
    driverPhone,
    restaurantAddress: raw.restaurantAddress,
    deliveredAt:
      raw.deliveredAt === undefined
        ? undefined
        : typeof raw.deliveredAt === 'string'
          ? raw.deliveredAt
          : new Date(raw.deliveredAt).toISOString(),
    etaMinutes: raw.etaMinutes,
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

export async function listMyOrders(): Promise<Order[]> {
  if (env.useMockApi) {
    return mockListMyOrders();
  }

  const response = await api.get<OrderListResponse>(endpoints.orders.mine);
  return (response.data ?? []).map(normalizeOrder);
}

export async function listRestaurantOrders(): Promise<Order[]> {
  if (env.useMockApi) {
    return mockListRestaurantOrders();
  }

  const response = await api.get<OrderListResponse>(endpoints.orders.restaurant);
  return (response.data ?? []).map(normalizeOrder);
}

export async function listAvailableJobs(): Promise<Order[]> {
  if (env.useMockApi) {
    return mockListAvailableJobs();
  }

  const response = await api.get<OrderListResponse>(endpoints.orders.driverAvailable);
  return (response.data ?? []).map(normalizeOrder);
}

export async function getActiveDelivery(): Promise<Order | null> {
  if (env.useMockApi) {
    return mockGetActiveDelivery();
  }

  const response = await api.get<ActiveDeliveryResponse>(endpoints.orders.driverActive);
  return response.data ? normalizeOrder(response.data) : null;
}

export async function listDriverHistory(): Promise<DriverHistory> {
  if (env.useMockApi) {
    return mockListDriverHistory();
  }

  const response = await api.get<DriverHistoryResponse>(endpoints.orders.driverHistory);
  return {
    orders: (response.data.orders ?? []).map(normalizeOrder),
    totalDeliveries: response.data.totalDeliveries,
    totalEarnings: response.data.totalEarnings,
  };
}

export async function acceptJob(id: string): Promise<Order> {
  if (env.useMockApi) {
    return mockAcceptJob(id);
  }

  const response = await api.put<CreateOrderResponse>(endpoints.orders.accept(id), {});
  return normalizeOrder(response.data);
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

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  if (env.useMockApi) {
    return mockUpdateOrderStatus(id, status);
  }

  const response = await api.put<CreateOrderResponse>(endpoints.orders.status(id), { status });
  return normalizeOrder(response.data);
}

export async function verifyOrderPayment(id: string): Promise<Order> {
  if (env.useMockApi) {
    return mockVerifyPayment(id);
  }

  const response = await api.put<CreateOrderResponse>(endpoints.orders.verifyPayment(id), {});
  return normalizeOrder(response.data);
}

export async function cancelOrder(id: string): Promise<Order> {
  if (env.useMockApi) {
    return mockCancelOrder(id);
  }

  const response = await api.put<CreateOrderResponse>(endpoints.orders.cancel(id), {});
  return normalizeOrder(response.data);
}
