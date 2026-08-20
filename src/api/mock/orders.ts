import { getJsonItem, setJsonItem } from '@/storage/asyncStorage';
import { delay } from './delay';
import { ApiError } from '@/api/errors';
import { MOCK_RESTAURANTS } from './restaurants';
import { findRestaurantByOwnerId, getPersistedRestaurant } from './restaurantStore';
import { getCurrentMockUser } from './users';
import type { Order, OrderStatus, PlaceOrderInput } from '@/types';

const ORDERS_KEY = 'gebetago.orders';
const KITCHEN_SEED_KEY = 'gebetago.kitchenSeeded';
const DRIVER_SEED_KEY = 'gebetago.driverSeeded';

async function readOrders(): Promise<Order[]> {
  return (await getJsonItem<Order[]>(ORDERS_KEY)) ?? [];
}

async function writeOrders(orders: Order[]): Promise<void> {
  await setJsonItem(ORDERS_KEY, orders);
}

export async function listAllMockOrders(): Promise<Order[]> {
  return readOrders();
}

function customerOwnsOrder(order: Order, userId: string): boolean {
  return (order.customerId ?? 'customer-1') === userId;
}

async function requireUser() {
  const user = await getCurrentMockUser();
  if (!user) {
    throw new ApiError({
      message: 'Not authorized',
      status: 401,
      payload: null,
    });
  }
  return user;
}

async function requireOwnedRestaurant() {
  const user = await requireUser();
  const restaurant = await findRestaurantByOwnerId(user.id);
  if (!restaurant) {
    throw new ApiError({
      message: 'No restaurant profile found for this account',
      status: 404,
      payload: null,
    });
  }
  return { user, restaurant };
}

async function ensureKitchenSeed(): Promise<void> {
  if (await getJsonItem<boolean>(KITCHEN_SEED_KEY)) {
    return;
  }

  const lucy = MOCK_RESTAURANTS.find((restaurant) => restaurant.id === 'restaurant-lucy');
  const firstItem = lucy?.menu[0];
  const secondItem = lucy?.menu[1];
  if (!lucy || !firstItem || !secondItem) {
    await setJsonItem(KITCHEN_SEED_KEY, true);
    return;
  }

  const now = Date.now();
  const demoOrders: Order[] = [
    {
      id: `order-kitchen-${now}`,
      restaurantId: lucy.id,
      restaurantName: lucy.name,
      restaurantAddress: lucy.location.address,
      customerId: 'demo-kitchen',
      customerName: 'Solomon Alula',
      customerPhone: '+251911111111',
      items: [
        {
          menuItemId: firstItem.id,
          itemName: firstItem.itemName,
          price: firstItem.price,
          quantity: 1,
          imageUrl: firstItem.imageUrl,
        },
      ],
      subtotal: firstItem.price,
      deliveryFee: lucy.deliveryFee,
      totalAmount: firstItem.price + lucy.deliveryFee,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      status: 'placed',
      deliveryAddress: 'Addis Ababa, Bole Atlas',
      createdAt: new Date(now - 60_000).toISOString(),
    },
    {
      id: `order-kitchen-${now + 1}`,
      restaurantId: lucy.id,
      restaurantName: lucy.name,
      restaurantAddress: lucy.location.address,
      customerId: 'demo-kitchen',
      customerName: 'Solomon Alula',
      customerPhone: '+251911111111',
      items: [
        {
          menuItemId: secondItem.id,
          itemName: secondItem.itemName,
          price: secondItem.price,
          quantity: 2,
          imageUrl: secondItem.imageUrl,
        },
      ],
      subtotal: secondItem.price * 2,
      deliveryFee: lucy.deliveryFee,
      totalAmount: secondItem.price * 2 + lucy.deliveryFee,
      paymentMethod: 'telebirr',
      paymentStatus: 'proof_submitted',
      status: 'confirmed',
      deliveryAddress: 'Addis Ababa, Bole Atlas',
      createdAt: new Date(now - 120_000).toISOString(),
    },
  ];

  const orders = await readOrders();
  await writeOrders([...demoOrders, ...orders]);
  await setJsonItem(KITCHEN_SEED_KEY, true);
}

async function ensureDriverSeed(): Promise<void> {
  if (await getJsonItem<boolean>(DRIVER_SEED_KEY)) {
    return;
  }

  const lucy = MOCK_RESTAURANTS.find((restaurant) => restaurant.id === 'restaurant-lucy');
  const item = lucy?.menu[2] ?? lucy?.menu[0];
  if (!lucy || !item) {
    await setJsonItem(DRIVER_SEED_KEY, true);
    return;
  }

  const now = Date.now();
  const job: Order = {
    id: `order-driver-${now}`,
    restaurantId: lucy.id,
    restaurantName: lucy.name,
    restaurantAddress: lucy.location.address,
    customerId: 'demo-driver',
    customerName: 'Hanna Bekele',
    customerPhone: '+251911000222',
    items: [
      {
        menuItemId: item.id,
        itemName: item.itemName,
        price: item.price,
        quantity: 1,
        imageUrl: item.imageUrl,
      },
    ],
    subtotal: item.price,
    deliveryFee: lucy.deliveryFee,
    totalAmount: item.price + lucy.deliveryFee,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    status: 'prepared',
    deliveryAddress: 'Kazanchis, Addis Ababa',
    createdAt: new Date(now - 90_000).toISOString(),
  };

  const orders = await readOrders();
  await writeOrders([job, ...orders]);
  await setJsonItem(DRIVER_SEED_KEY, true);
}

function isAvailableJob(order: Order): boolean {
  return order.status === 'prepared' && !order.driverId;
}

function isActiveDelivery(order: Order, driverId: string): boolean {
  return order.driverId === driverId && (order.status === 'dispatched' || order.status === 'picked_up');
}

export async function mockCreateOrder(input: PlaceOrderInput): Promise<Order> {
  await delay(500);
  const user = await requireUser();

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
    customerId: user.id,
    customerName: user.name,
    customerPhone: user.phone,
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
    restaurantAddress: (await getPersistedRestaurant(input.restaurantId))?.location.address,
    createdAt: new Date().toISOString(),
  };

  const orders = await readOrders();
  await writeOrders([order, ...orders]);
  return order;
}

export async function mockListMyOrders(): Promise<Order[]> {
  await delay(200);
  const user = await requireUser();
  const orders = await readOrders();
  return orders.filter((order) => customerOwnsOrder(order, user.id));
}

export async function mockListRestaurantOrders(): Promise<Order[]> {
  await delay(200);
  await ensureKitchenSeed();
  const { restaurant } = await requireOwnedRestaurant();
  const orders = await readOrders();
  return orders.filter((order) => order.restaurantId === restaurant.id);
}

export async function mockGetOrder(id: string): Promise<Order | null> {
  await delay(150);
  const orders = await readOrders();
  return orders.find((order) => order.id === id) ?? null;
}

export async function mockUpdateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const user = await requireUser();
  if (user.role === 'driver') {
    return mockDriverSetStatus(id, status);
  }
  return mockRestaurantSetStatus(id, status);
}

async function mockRestaurantSetStatus(id: string, status: OrderStatus): Promise<Order> {
  await delay(300);
  const { restaurant } = await requireOwnedRestaurant();
  const orders = await readOrders();
  const order = orders.find((item) => item.id === id);

  if (!order || order.restaurantId !== restaurant.id) {
    throw new ApiError({
      message: 'Order not found',
      status: 404,
      payload: null,
    });
  }

  if (['delivered', 'cancelled'].includes(order.status)) {
    throw new ApiError({
      message: `This order is already ${order.status}`,
      status: 400,
      payload: null,
    });
  }

  if (status === 'confirmed' && order.status !== 'placed') {
    throw new ApiError({
      message: 'Only a new order can be confirmed',
      status: 400,
      payload: null,
    });
  }

  if (status === 'prepared' && order.status !== 'confirmed') {
    throw new ApiError({
      message: 'Confirm the order before marking it prepared',
      status: 400,
      payload: null,
    });
  }

  if (status !== 'confirmed' && status !== 'prepared') {
    throw new ApiError({
      message: 'Unsupported status transition',
      status: 400,
      payload: null,
    });
  }

  const updated: Order = { ...order, status };
  await writeOrders(orders.map((item) => (item.id === id ? updated : item)));
  return updated;
}

async function mockDriverSetStatus(id: string, status: OrderStatus): Promise<Order> {
  await delay(300);
  const user = await requireUser();
  const orders = await readOrders();
  const order = orders.find((item) => item.id === id);

  if (!order || order.driverId !== user.id) {
    throw new ApiError({
      message: 'Order not found',
      status: 404,
      payload: null,
    });
  }

  if (status === 'picked_up' && order.status !== 'dispatched') {
    throw new ApiError({
      message: 'Pick up the order after it has been dispatched',
      status: 400,
      payload: null,
    });
  }

  if (status === 'delivered' && order.status !== 'picked_up') {
    throw new ApiError({
      message: 'Mark the order picked up before completing delivery',
      status: 400,
      payload: null,
    });
  }

  if (status !== 'picked_up' && status !== 'delivered') {
    throw new ApiError({
      message: 'Unsupported status transition',
      status: 400,
      payload: null,
    });
  }

  const updated: Order = {
    ...order,
    status,
    deliveredAt: status === 'delivered' ? new Date().toISOString() : order.deliveredAt,
    paymentStatus:
      status === 'delivered' && order.paymentMethod === 'cash' ? 'paid' : order.paymentStatus,
  };
  await writeOrders(orders.map((item) => (item.id === id ? updated : item)));
  return updated;
}

export async function mockListAvailableJobs(): Promise<Order[]> {
  await delay(200);
  await ensureDriverSeed();
  const user = await requireUser();
  if (user.role !== 'driver' && user.role !== 'admin') {
    throw new ApiError({
      message: 'Not authorized',
      status: 403,
      payload: null,
    });
  }

  const orders = await readOrders();
  const jobs = orders.filter(isAvailableJob);
  return Promise.all(
    jobs.map(async (order) => {
      if (order.restaurantAddress) {
        return order;
      }
      const restaurant = await getPersistedRestaurant(order.restaurantId);
      return { ...order, restaurantAddress: restaurant?.location.address };
    }),
  );
}

export async function mockGetActiveDelivery(): Promise<Order | null> {
  await delay(150);
  const user = await requireUser();
  const orders = await readOrders();
  const active = orders.find((order) => isActiveDelivery(order, user.id)) ?? null;
  if (!active) {
    return null;
  }
  if (active.restaurantAddress) {
    return active;
  }
  const restaurant = await getPersistedRestaurant(active.restaurantId);
  return { ...active, restaurantAddress: restaurant?.location.address };
}

export async function mockListDriverHistory(): Promise<{
  orders: Order[];
  totalDeliveries: number;
  totalEarnings: number;
}> {
  await delay(200);
  const user = await requireUser();
  const orders = (await readOrders()).filter(
    (order) => order.driverId === user.id && order.status === 'delivered',
  );
  const totalEarnings = orders.reduce((sum, order) => sum + order.deliveryFee, 0);
  return {
    orders,
    totalDeliveries: orders.length,
    totalEarnings,
  };
}

export async function mockAcceptJob(id: string): Promise<Order> {
  await delay(350);
  const user = await requireUser();
  if (user.role !== 'driver' && user.role !== 'admin') {
    throw new ApiError({
      message: 'Not authorized',
      status: 403,
      payload: null,
    });
  }

  const orders = await readOrders();
  const existingActive = orders.find((order) => isActiveDelivery(order, user.id));
  if (existingActive) {
    throw new ApiError({
      message: 'Finish your current delivery before accepting another job',
      status: 400,
      payload: null,
    });
  }

  const order = orders.find((item) => item.id === id);
  if (!order || !isAvailableJob(order)) {
    throw new ApiError({
      message: 'This job is no longer available',
      status: 400,
      payload: null,
    });
  }

  const restaurant = await getPersistedRestaurant(order.restaurantId);
  const updated: Order = {
    ...order,
    status: 'dispatched',
    driverId: user.id,
    driverName: user.name,
    driverPhone: user.phone,
    restaurantAddress: order.restaurantAddress ?? restaurant?.location.address,
  };
  await writeOrders(orders.map((item) => (item.id === id ? updated : item)));
  return updated;
}

export async function mockVerifyPayment(id: string): Promise<Order> {
  await delay(300);
  const { restaurant } = await requireOwnedRestaurant();
  const orders = await readOrders();
  const order = orders.find((item) => item.id === id);

  if (!order || order.restaurantId !== restaurant.id) {
    throw new ApiError({
      message: 'Order not found',
      status: 404,
      payload: null,
    });
  }

  const updated: Order = { ...order, paymentStatus: 'verified' };
  await writeOrders(orders.map((item) => (item.id === id ? updated : item)));
  return updated;
}

export async function mockCancelOrder(id: string): Promise<Order> {
  await delay(300);
  const user = await requireUser();
  const orders = await readOrders();
  const order = orders.find((item) => item.id === id);

  if (!order) {
    throw new ApiError({
      message: 'Order not found',
      status: 404,
      payload: null,
    });
  }

  if (user.role === 'customer') {
    if (!customerOwnsOrder(order, user.id)) {
      throw new ApiError({
        message: 'Not authorized to cancel this order',
        status: 403,
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
  } else if (user.role === 'restaurant') {
    const restaurant = await findRestaurantByOwnerId(user.id);
    if (!restaurant || order.restaurantId !== restaurant.id) {
      throw new ApiError({
        message: 'Not authorized to cancel this order',
        status: 403,
        payload: null,
      });
    }
    if (!['placed', 'confirmed'].includes(order.status)) {
      throw new ApiError({
        message: 'This order can no longer be cancelled',
        status: 400,
        payload: null,
      });
    }
  } else if (user.role !== 'admin') {
    throw new ApiError({
      message: 'Not authorized to cancel this order',
      status: 403,
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
