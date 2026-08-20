import type { AuthUser, Order, OrderStatus, Restaurant, UserRole } from '@/types';

export type AdminStats = {
  summary: {
    totalUsers: number;
    totalRestaurants: number;
    totalOrders: number;
    totalRevenue: number;
    platformCommission: number;
    completedOrders: number;
  };
  statusCounts: Record<OrderStatus, number>;
  restaurantSales: Array<{
    name: string;
    cuisine: string;
    sales: number;
    orderCount: number;
  }>;
  usersByRole: Partial<Record<UserRole, number>>;
};

export type AdminUser = AuthUser;

export type AdminRestaurant = Restaurant & {
  orderCount: number;
};

export type AdminStatsResponse = {
  success: boolean;
  data: AdminStats;
};

export type AdminUsersResponse = {
  success: boolean;
  data: AdminUser[];
};

export type AdminRestaurantsResponse = {
  success: boolean;
  data: AdminRestaurant[];
};

export type AdminOrdersResponse = {
  success: boolean;
  data: Order[];
};
