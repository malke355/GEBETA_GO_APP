import { env } from '@/config/env';
import {
  mockAddMenuItem,
  mockCreateRestaurant,
  mockDeleteMenuItem,
  mockGetMyRestaurant,
  mockGetRestaurant,
  mockListRestaurants,
  mockUpdateMenuItem,
  mockUpdateRestaurant,
} from '@/api/mock/listRestaurants';
import { api } from './client';
import { endpoints } from './endpoints';
import { ApiError } from './errors';
import { appendPickedImage, resolveMediaUrl } from './media';
import type {
  AddMenuItemInput,
  CreateRestaurantInput,
  MenuItem,
  Restaurant,
  RestaurantDetailResponse,
  RestaurantListResponse,
  RestaurantReview,
  UpdateMenuItemInput,
  UpdateRestaurantInput,
} from '@/types/restaurant';
import type { PickedImage } from '@/types/media';

type RawMenuItem = MenuItem & { _id?: string };
type RawRestaurant = Restaurant & { _id?: string; ownerId?: string; menu?: RawMenuItem[] };

function normalizeMenuItem(item: RawMenuItem, index: number): MenuItem {
  return {
    id: String(item.id ?? item._id ?? `item-${index}`),
    itemName: item.itemName,
    price: item.price,
    description: item.description ?? '',
    imageUrl: resolveMediaUrl(item.imageUrl),
    category: item.category ?? 'Traditional',
  };
}

export function normalizeRestaurant(raw: RawRestaurant & { reviews?: RestaurantReview[] }): Restaurant {
  return {
    id: String(raw.id ?? raw._id),
    name: raw.name,
    cuisineType: raw.cuisineType,
    city: raw.city,
    imageUrl: resolveMediaUrl(raw.imageUrl),
    rating: raw.rating,
    ratingCount: raw.ratingCount ?? 0,
    deliveryTime: raw.deliveryTime,
    deliveryFee: raw.deliveryFee,
    ownerId: raw.ownerId,
    isSuspended: raw.isSuspended,
    location: raw.location,
    menu: (raw.menu ?? []).map(normalizeMenuItem),
    reviews: raw.reviews,
  };
}

function restaurantForm(fields: Record<string, string | number | undefined>, image?: PickedImage | null): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== '') {
      form.append(key, String(value));
    }
  }
  appendPickedImage(form, 'image', image);
  return form;
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

  if (input.image) {
    const response = await api.upload<RestaurantDetailResponse>(
      endpoints.restaurants.create,
      restaurantForm(
        {
          name: input.name,
          cuisineType: input.cuisineType,
          address: input.address,
        },
        input.image,
      ),
    );
    return normalizeRestaurant(response.data);
  }

  const response = await api.post<RestaurantDetailResponse>(endpoints.restaurants.create, input);
  return normalizeRestaurant(response.data);
}

export async function updateRestaurant(input: UpdateRestaurantInput): Promise<Restaurant> {
  if (env.useMockApi) {
    return mockUpdateRestaurant(input);
  }

  if (input.image) {
    const response = await api.upload<RestaurantDetailResponse>(
      endpoints.restaurants.profile,
      restaurantForm(
        {
          name: input.name,
          cuisineType: input.cuisineType,
          address: input.address,
          deliveryFee: input.deliveryFee,
          deliveryTime: input.deliveryTime,
        },
        input.image,
      ),
      { method: 'PUT' },
    );
    return normalizeRestaurant(response.data);
  }

  const response = await api.put<RestaurantDetailResponse>(endpoints.restaurants.profile, input);
  return normalizeRestaurant(response.data);
}

export async function addMenuItem(input: AddMenuItemInput): Promise<Restaurant> {
  if (env.useMockApi) {
    return mockAddMenuItem(input);
  }

  if (input.image) {
    const response = await api.upload<RestaurantDetailResponse>(
      endpoints.restaurants.addMenu,
      restaurantForm(
        {
          itemName: input.itemName,
          price: input.price,
          description: input.description,
          category: input.category,
        },
        input.image,
      ),
    );
    return normalizeRestaurant(response.data);
  }

  const response = await api.post<RestaurantDetailResponse>(endpoints.restaurants.addMenu, input);
  return normalizeRestaurant(response.data);
}

export async function updateMenuItem(input: UpdateMenuItemInput): Promise<Restaurant> {
  if (env.useMockApi) {
    return mockUpdateMenuItem(input);
  }

  if (input.image) {
    const response = await api.upload<RestaurantDetailResponse>(
      endpoints.restaurants.updateMenu(input.itemId),
      restaurantForm(
        {
          itemName: input.itemName,
          price: input.price,
          description: input.description,
          category: input.category,
        },
        input.image,
      ),
      { method: 'PUT' },
    );
    return normalizeRestaurant(response.data);
  }

  const { itemId, ...body } = input;
  const response = await api.put<RestaurantDetailResponse>(endpoints.restaurants.updateMenu(itemId), body);
  return normalizeRestaurant(response.data);
}

export async function deleteMenuItem(itemId: string): Promise<Restaurant> {
  if (env.useMockApi) {
    return mockDeleteMenuItem(itemId);
  }

  const response = await api.delete<RestaurantDetailResponse>(endpoints.restaurants.deleteMenu(itemId));
  return normalizeRestaurant(response.data);
}
