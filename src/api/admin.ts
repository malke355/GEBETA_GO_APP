import { env } from '@/config/env';
import { api } from './client';
import { endpoints } from './endpoints';
import { normalizeOrder } from './orders';
import { normalizeRestaurant } from './restaurants';
import {
  mockAdminOrders,
  mockAdminRestaurants,
  mockAdminStats,
  mockAdminUsers,
  mockSetRestaurantSuspended,
  mockSetUserSuspended,
} from '@/api/mock/admin';
import type {
  AdminOrdersResponse,
  AdminRestaurant,
  AdminRestaurantsResponse,
  AdminStats,
  AdminStatsResponse,
  AdminUser,
  AdminUsersResponse,
  Order,
} from '@/types';

function normalizeAdminUser(raw: AdminUser & { _id?: string }): AdminUser {
  return {
    id: String(raw.id ?? raw._id),
    name: raw.name,
    email: raw.email,
    role: raw.role,
    address: raw.address,
    phone: raw.phone,
    isSuspended: raw.isSuspended,
  };
}

export async function fetchAdminStats(): Promise<AdminStats> {
  if (env.useMockApi) {
    return mockAdminStats();
  }

  const response = await api.get<AdminStatsResponse>(endpoints.admin.stats);
  return response.data;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  if (env.useMockApi) {
    return mockAdminUsers();
  }

  const response = await api.get<AdminUsersResponse>(endpoints.admin.users);
  return (response.data ?? []).map(normalizeAdminUser);
}

export async function setUserSuspended(id: string, isSuspended: boolean): Promise<AdminUser> {
  if (env.useMockApi) {
    return mockSetUserSuspended(id, isSuspended);
  }

  const response = await api.put<{ success: boolean; data: AdminUser & { _id?: string } }>(
    endpoints.admin.updateUser(id),
    { isSuspended },
  );
  return normalizeAdminUser(response.data);
}

export async function fetchAdminRestaurants(): Promise<AdminRestaurant[]> {
  if (env.useMockApi) {
    return mockAdminRestaurants();
  }

  const response = await api.get<AdminRestaurantsResponse>(endpoints.admin.restaurants);
  return (response.data ?? []).map((restaurant) => ({
    ...normalizeRestaurant(restaurant),
    orderCount: restaurant.orderCount ?? 0,
  }));
}

export async function setRestaurantSuspended(id: string, isSuspended: boolean): Promise<AdminRestaurant> {
  if (env.useMockApi) {
    return mockSetRestaurantSuspended(id, isSuspended);
  }

  const response = await api.put<{ success: boolean; data: AdminRestaurant }>(
    endpoints.admin.updateRestaurant(id),
    { isSuspended },
  );
  return {
    ...normalizeRestaurant(response.data),
    orderCount: response.data.orderCount ?? 0,
  };
}

export async function fetchAdminOrders(): Promise<Order[]> {
  if (env.useMockApi) {
    return mockAdminOrders();
  }

  const response = await api.get<AdminOrdersResponse>(endpoints.admin.orders);
  return (response.data ?? []).map(normalizeOrder);
}
