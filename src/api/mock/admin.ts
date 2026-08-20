import { delay } from './delay';
import { ApiError } from '@/api/errors';
import { listAllMockOrders } from './orders';
import { listPersistedRestaurants, saveRestaurant } from './restaurantStore';
import { getCurrentMockUser, listMockUsers, setMockUserSuspended, toPublicUser } from './users';
import type { AdminRestaurant, AdminStats, AdminUser, Order, OrderStatus } from '@/types';

async function requireAdmin() {
  const user = await getCurrentMockUser();
  if (!user || user.role !== 'admin') {
    throw new ApiError({
      message: 'Not authorized',
      status: 403,
      payload: null,
    });
  }
  return user;
}

const EMPTY_STATUS: Record<OrderStatus, number> = {
  placed: 0,
  confirmed: 0,
  prepared: 0,
  dispatched: 0,
  picked_up: 0,
  delivered: 0,
  cancelled: 0,
};

export async function mockAdminStats(): Promise<AdminStats> {
  await delay();
  await requireAdmin();

  const [users, restaurants, orders] = await Promise.all([
    listMockUsers(),
    listPersistedRestaurants(),
    listAllMockOrders(),
  ]);

  const statusCounts = { ...EMPTY_STATUS };
  const usersByRole: AdminStats['usersByRole'] = {};
  const salesByRestaurant = new Map<string, { name: string; cuisine: string; sales: number; orderCount: number }>();

  for (const user of users) {
    usersByRole[user.role] = (usersByRole[user.role] ?? 0) + 1;
  }

  for (const order of orders) {
    statusCounts[order.status] += 1;
    if (order.status !== 'delivered') {
      continue;
    }
    const current = salesByRestaurant.get(order.restaurantId) ?? {
      name: order.restaurantName,
      cuisine: restaurants.find((restaurant) => restaurant.id === order.restaurantId)?.cuisineType ?? '',
      sales: 0,
      orderCount: 0,
    };
    current.sales += order.totalAmount;
    current.orderCount += 1;
    salesByRestaurant.set(order.restaurantId, current);
  }

  const delivered = orders.filter((order) => order.status === 'delivered');
  const totalRevenue = delivered.reduce((sum, order) => sum + order.totalAmount, 0);

  return {
    summary: {
      totalUsers: users.length,
      totalRestaurants: restaurants.length,
      totalOrders: orders.length,
      totalRevenue,
      platformCommission: totalRevenue * 0.15,
      completedOrders: delivered.length,
    },
    statusCounts,
    restaurantSales: [...salesByRestaurant.values()].sort((left, right) => right.sales - left.sales).slice(0, 5),
    usersByRole,
  };
}

export async function mockAdminUsers(): Promise<AdminUser[]> {
  await delay();
  await requireAdmin();
  const users = await listMockUsers();
  return users.map((user) => toPublicUser(user));
}

export async function mockSetUserSuspended(id: string, isSuspended: boolean): Promise<AdminUser> {
  await delay();
  const admin = await requireAdmin();
  if (admin.id === id && isSuspended) {
    throw new ApiError({
      message: 'You cannot suspend your own account',
      status: 400,
      payload: null,
    });
  }
  try {
    return await setMockUserSuspended(id, isSuspended);
  } catch {
    throw new ApiError({
      message: 'User not found',
      status: 404,
      payload: null,
    });
  }
}

export async function mockAdminRestaurants(): Promise<AdminRestaurant[]> {
  await delay();
  await requireAdmin();
  const [restaurants, orders] = await Promise.all([listPersistedRestaurants(), listAllMockOrders()]);
  const counts = new Map<string, number>();
  for (const order of orders) {
    counts.set(order.restaurantId, (counts.get(order.restaurantId) ?? 0) + 1);
  }
  return restaurants.map((restaurant) => ({
    ...restaurant,
    orderCount: counts.get(restaurant.id) ?? 0,
  }));
}

export async function mockSetRestaurantSuspended(id: string, isSuspended: boolean): Promise<AdminRestaurant> {
  await delay();
  await requireAdmin();
  const restaurants = await listPersistedRestaurants();
  const restaurant = restaurants.find((item) => item.id === id);
  if (!restaurant) {
    throw new ApiError({
      message: 'Restaurant not found',
      status: 404,
      payload: null,
    });
  }
  const saved = await saveRestaurant({ ...restaurant, isSuspended });
  const orders = await listAllMockOrders();
  return {
    ...saved,
    orderCount: orders.filter((order) => order.restaurantId === id).length,
  };
}

export async function mockAdminOrders(): Promise<Order[]> {
  await delay();
  await requireAdmin();
  return listAllMockOrders();
}

export async function mockDeleteUser(id: string): Promise<void> {
  await delay();
  const admin = await requireAdmin();
  if (admin.id === id) {
    throw new ApiError({ message: 'You cannot delete your own account', status: 400, payload: null });
  }
}

export async function mockDeleteRestaurant(id: string): Promise<void> {
  await delay();
  await requireAdmin();
  const restaurants = await listPersistedRestaurants();
  const restaurant = restaurants.find((item) => item.id === id);
  if (!restaurant) {
    throw new ApiError({ message: 'Restaurant not found', status: 404, payload: null });
  }
  await saveRestaurant({ ...restaurant, isSuspended: true });
}

export async function mockAssignDriver(orderId: string, driverId: string): Promise<Order> {
  await delay();
  await requireAdmin();
  const users = await listMockUsers();
  const driver = users.find((user) => user.id === driverId && user.role === 'driver');
  if (!driver) {
    throw new ApiError({ message: 'Driver not found', status: 404, payload: null });
  }
  const orders = await listAllMockOrders();
  const order = orders.find((item) => item.id === orderId);
  if (!order) {
    throw new ApiError({ message: 'Order not found', status: 404, payload: null });
  }
  return {
    ...order,
    driverId: driver.id,
    driverName: driver.name,
    driverPhone: driver.phone,
    status: order.status === 'prepared' ? 'dispatched' : order.status,
  };
}
