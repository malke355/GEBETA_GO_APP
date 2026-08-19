import { env } from '@/config/env';
import {
  mockAddMenuItem,
  mockCreateRestaurant,
  mockGetMyRestaurant,
  mockGetRestaurant,
  mockListRestaurants,
} from '@/api/mock/listRestaurants';
import { api } from './client';
import { endpoints } from './endpoints';
import { ApiError } from './errors';
import type {
  AddMenuItemInput,
  CreateRestaurantInput,
  MenuItem,
  Restaurant,
  RestaurantDetailResponse,
  RestaurantListResponse,
} from '@/types/restaurant';

type RawMenuItem = MenuItem & { _id?: string };
type RawRestaurant = Restaurant & { _id?: string; ownerId?: string; menu?: RawMenuItem[] };

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
    ownerId: raw.ownerId,
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

export async function getMyRestaurant(): Promise<Restaurant | null> {
  if (env.useMockApi) {
    return mockGetMyRestaurant();
  }

  const response = await api.get<RestaurantDetailResponse>(endpoints.restaurants.mine);
  return response.data ? normalizeRestaurant(response.data) : null;
}

export async function createRestaurant(input: CreateRestaurantInput): Promise<Restaurant> {
  if (env.useMockApi) {
    return mockCreateRestaurant(input);
  }

  const response = await api.post<RestaurantDetailResponse>(endpoints.restaurants.create, input);
  return normalizeRestaurant(response.data);
}

export async function addMenuItem(input: AddMenuItemInput): Promise<Restaurant> {
  if (env.useMockApi) {
    return mockAddMenuItem(input);
  }

  const response = await api.post<RestaurantDetailResponse>(endpoints.restaurants.addMenu, input);
  return normalizeRestaurant(response.data);
}
