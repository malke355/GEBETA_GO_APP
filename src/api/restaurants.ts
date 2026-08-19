import { env } from '@/config/env';
import { mockGetRestaurant, mockListRestaurants } from '@/api/mock/listRestaurants';
import { api } from './client';
import { endpoints } from './endpoints';
import { ApiError } from './errors';
import type { MenuItem, Restaurant, RestaurantDetailResponse, RestaurantListResponse } from '@/types/restaurant';

type RawMenuItem = MenuItem & { _id?: string };
type RawRestaurant = Restaurant & { _id?: string; menu?: RawMenuItem[] };

function normalizeMenuItem(item: RawMenuItem, index: number): MenuItem {
  return {
    id: String(item.id ?? item._id ?? `item-${index}`),
    itemName: item.itemName,
    price: item.price,
    description: item.description ?? '',
    imageUrl: item.imageUrl ?? '',
    category: item.category ?? 'Traditional',
  };
}

export function normalizeRestaurant(raw: RawRestaurant): Restaurant {
  return {
    id: String(raw.id ?? raw._id),
    name: raw.name,
    cuisineType: raw.cuisineType,
    city: raw.city,
    imageUrl: raw.imageUrl,
    rating: raw.rating,
    ratingCount: raw.ratingCount ?? 0,
    deliveryTime: raw.deliveryTime,
    deliveryFee: raw.deliveryFee,
    isSuspended: raw.isSuspended,
    location: raw.location,
    menu: (raw.menu ?? []).map(normalizeMenuItem),
  };
}

export async function listRestaurants(): Promise<Restaurant[]> {
  if (env.useMockApi) {
    return mockListRestaurants();
  }

  const response = await api.get<RestaurantListResponse>(endpoints.restaurants.list);
  return response.data
    .map(normalizeRestaurant)
    .filter((restaurant) => restaurant.isSuspended !== true)
    .sort((left, right) => right.rating - left.rating);
}

export async function getRestaurant(id: string): Promise<Restaurant> {
  if (env.useMockApi) {
    const restaurant = await mockGetRestaurant(id);
    if (!restaurant) {
      throw new ApiError({
        message: 'Restaurant not found',
        status: 404,
        payload: null,
      });
    }
    return restaurant;
  }

  const response = await api.get<RestaurantDetailResponse>(endpoints.restaurants.detail(id));
  return normalizeRestaurant(response.data);
}
