import { getJsonItem, setJsonItem } from '@/storage/asyncStorage';
import { delay } from './delay';
import { ApiError } from '@/api/errors';
import type { Order, OrderStatus, PlaceOrderInput } from '@/types';

const ORDERS_KEY = 'gebetago.orders';
const MOCK_DRIVER = { name: 'Amanuel Tesfaye', phone: '+251922222222' };

const PROGRESSION: Array<{ status: OrderStatus; afterMs: number }> = [
  { status: 'placed', afterMs: 0 },
  { status: 'confirmed', afterMs: 8_000 },
  { status: 'prepared', afterMs: 20_000 },
  { status: 'dispatched', afterMs: 32_000 },
  { status: 'picked_up', afterMs: 44_000 },
  { status: 'delivered', afterMs: 58_000 },
];

const DELIVERED_AFTER_MS = 58_000;

async function readOrders(): Promise<Order[]> {
  return (await getJsonItem<Order[]>(ORDERS_KEY)) ?? [];
}

async function writeOrders(orders: Order[]): Promise<void> {
  await setJsonItem(ORDERS_KEY, orders);
}

function statusFromElapsed(elapsedMs: number): OrderStatus {
  let status: OrderStatus = 'placed';
  for (const step of PROGRESSION) {
    if (elapsedMs >= step.afterMs) {
      status = step.status;
    }
  }
  return status;
}

function etaMinutesFor(order: Order): number | undefined {
  if (order.status === 'delivered' || order.status === 'cancelled') {
    return undefined;
  }

  const elapsed = Date.now() - Date.parse(order.createdAt);
  if (!Number.isFinite(elapsed)) {
    return undefined;
  }

  return Math.max(1, Math.ceil((DELIVERED_AFTER_MS - elapsed) / 60_000));
}

function applyMockProgress(order: Order): Order {
  if (order.status === 'cancelled' || order.status === 'delivered') {
    return order;
  }

  const elapsed = Date.now() - Date.parse(order.createdAt);
  if (!Number.isFinite(elapsed)) {
    return order;
  }

  const nextStatus = statusFromElapsed(elapsed);
  const needsDriver =
    nextStatus === 'dispatched' || nextStatus === 'picked_up' || nextStatus === 'delivered';
  const nextDriverName = needsDriver ? MOCK_DRIVER.name : order.driverName;
  const nextDriverPhone = needsDriver ? MOCK_DRIVER.phone : order.driverPhone;
  const nextPaymentStatus =
    nextStatus === 'delivered' && order.paymentMethod === 'cash' ? 'paid' : order.paymentStatus;
  const nextDeliveredAt =
    nextStatus === 'delivered'
      ? (order.deliveredAt ?? new Date(Date.parse(order.createdAt) + DELIVERED_AFTER_MS).toISOString())
      : order.deliveredAt;

  if (
    nextStatus === order.status &&
    nextDriverName === order.driverName &&
    nextDriverPhone === order.driverPhone &&
    nextPaymentStatus === order.paymentStatus &&
    nextDeliveredAt === order.deliveredAt
  ) {
    return order;
  }

  return {
    ...order,
    status: nextStatus,
    driverName: nextDriverName,
    driverPhone: nextDriverPhone,
    paymentStatus: nextPaymentStatus,
    deliveredAt: nextDeliveredAt,
  };
}

async function persistProgress(orders: Order[]): Promise<Order[]> {
  const progressed = orders.map(applyMockProgress);
  const changed = progressed.some((order, index) => order !== orders[index]);
  if (changed) {
    await writeOrders(progressed);
  }
  return progressed.map((order) => ({ ...order, etaMinutes: etaMinutesFor(order) }));
}

export async function mockCreateOrder(input: PlaceOrderInput): Promise<Order> {
  await delay(500);

  if (!input.items.length) {
    throw new ApiError({
      message: 'Your cart is empty',
      status: 400,
      payload: null,
    });
  }

  if (!input.deliveryAddress.trim()) {
    throw new ApiError({
      message: 'Delivery address is required',
      status: 400,
      payload: null,
    });
  }

  const order: Order = {
    id: `order-${Date.now()}`,
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    items: input.items.map((item) => ({
      menuItemId: item.menuItemId,
      itemName: item.itemName,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
    })),
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    totalAmount: input.totalAmount,
    paymentMethod: input.paymentMethod,
    paymentStatus: 'pending',
    status: 'placed',
    deliveryAddress: input.deliveryAddress.trim(),
    createdAt: new Date().toISOString(),
    etaMinutes: Math.max(1, Math.ceil(DELIVERED_AFTER_MS / 60_000)),
  };

  const orders = await readOrders();
  await writeOrders([order, ...orders]);
  return order;
}

export async function mockListMyOrders(): Promise<Order[]> {
  await delay(200);
  return persistProgress(await readOrders());
}

export async function mockGetOrder(id: string): Promise<Order | null> {
  await delay(150);
  const orders = await persistProgress(await readOrders());
  return orders.find((order) => order.id === id) ?? null;
}

export async function mockCancelOrder(id: string): Promise<Order> {
  await delay(300);
  const orders = await persistProgress(await readOrders());
  const order = orders.find((item) => item.id === id);
  if (!order) {
    throw new ApiError({
      message: 'Order not found',
      status: 404,
      payload: null,
    });
  }

  if (order.status !== 'placed') {
    throw new ApiError({
      message: 'This order can no longer be cancelled because the restaurant has accepted it',
      status: 400,
      payload: null,
    });
  }

  const cancelled: Order = {
    ...order,
    status: 'cancelled',
    etaMinutes: undefined,
  };
  await writeOrders(orders.map((item) => (item.id === id ? cancelled : item)));
  return cancelled;
}
