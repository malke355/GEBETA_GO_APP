import { getJsonItem, setJsonItem } from '@/storage/asyncStorage';
import { delay } from './delay';
import { ApiError } from '@/api/errors';
import type { Order, PlaceOrderInput } from '@/types';

const ORDERS_KEY = 'gebetago.orders';

async function readOrders(): Promise<Order[]> {
  return (await getJsonItem<Order[]>(ORDERS_KEY)) ?? [];
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
  };

  const orders = await readOrders();
  await setJsonItem(ORDERS_KEY, [order, ...orders]);
  return order;
}

export async function mockGetOrder(id: string): Promise<Order | null> {
  await delay(150);
  const orders = await readOrders();
  return orders.find((order) => order.id === id) ?? null;
}
