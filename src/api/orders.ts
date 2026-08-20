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
  mockUploadPaymentProof,
  mockRateOrder,
  mockVerifyPayment,
} from '@/api/mock/orders';
import { api } from './client';
import { endpoints } from './endpoints';
import { ApiError } from './errors';
import { appendPickedImage, resolveMediaUrl } from './media';
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
import type { PickedImage } from '@/types/media';

type RawRestaurantRef =
  | string
  | { _id?: string; name?: string; location?: { address?: string; lat?: number; lng?: number } };
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
  paymentDetails?: { proofImageUrl?: string };
  restaurantLat?: number;
  restaurantLng?: number;
  proofImageUrl?: string;
  rating?: number;
  review?: string;
  deliveryCoordinates?: { lat: number; lng: number };
  driverLat?: number;
  driverLng?: number;
  driverLocation?: { lat?: number; lng?: number };
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
    restaurantAddress:
      raw.restaurantAddress ??
      (typeof restaurantRef === 'object' && restaurantRef ? restaurantRef.location?.address : undefined),
    restaurantLat:
      raw.restaurantLat ??
      (typeof restaurantRef === 'object' && restaurantRef ? restaurantRef.location?.lat : undefined),
    restaurantLng:
      raw.restaurantLng ??
      (typeof restaurantRef === 'object' && restaurantRef ? restaurantRef.location?.lng : undefined),
    deliveredAt:
      raw.deliveredAt === undefined
        ? undefined
        : typeof raw.deliveredAt === 'string'
          ? raw.deliveredAt
          : new Date(raw.deliveredAt).toISOString(),
    etaMinutes: raw.etaMinutes,
    proofImageUrl: resolveMediaUrl(raw.proofImageUrl ?? raw.paymentDetails?.proofImageUrl),
    rating: raw.rating,
    review: raw.review,
    deliveryCoordinates: raw.deliveryCoordinates,
    driverLat: raw.driverLat ?? raw.driverLocation?.lat,
    driverLng: raw.driverLng ?? raw.driverLocation?.lng,
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

export async function uploadPaymentProof(id: string, image: PickedImage): Promise<Order> {
  if (env.useMockApi) {
    return mockUploadPaymentProof(id, image.uri);
  }

  const form = new FormData();
  appendPickedImage(form, 'proofImage', image);
  const response = await api.upload<CreateOrderResponse>(endpoints.orders.paymentProof(id), form);
  return normalizeOrder(response.data);
}

export async function rateOrder(id: string, rating: number, review?: string): Promise<Order> {
  if (env.useMockApi) {
    return mockRateOrder(id, rating, review);
  }

  const response = await api.post<CreateOrderResponse>(endpoints.orders.rate(id), { rating, review });
  return normalizeOrder(response.data);
}
