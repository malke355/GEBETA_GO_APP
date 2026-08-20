import { delay } from './delay';
import {
  defaultRestaurantImage,
  findRestaurantByOwnerId,
  getPersistedRestaurant,
  listPersistedRestaurants,
  saveRestaurant,
} from './restaurantStore';
import { getCurrentMockUser } from './users';
import { ApiError } from '@/api/errors';
import type { AddMenuItemInput, CreateRestaurantInput, MenuItem, Restaurant, UpdateMenuItemInput, UpdateRestaurantInput } from '@/types';

const DEFAULT_MENU_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

export async function mockListRestaurants(): Promise<Restaurant[]> {
  await delay();
  const restaurants = await listPersistedRestaurants();
  return restaurants
    .filter((restaurant) => restaurant.isSuspended !== true)
    .sort((left, right) => right.rating - left.rating);
}

export async function mockGetRestaurant(id: string): Promise<Restaurant | null> {
  await delay();
  return getPersistedRestaurant(id);
}

export async function mockGetMyRestaurant(): Promise<Restaurant | null> {
  await delay(150);
  const user = await getCurrentMockUser();
  if (!user) {
    throw new ApiError({
      message: 'Not authorized',
      status: 401,
      payload: null,
    });
  }

  return findRestaurantByOwnerId(user.id);
}

export async function mockCreateRestaurant(input: CreateRestaurantInput): Promise<Restaurant> {
  await delay(400);
  const user = await getCurrentMockUser();
  if (!user || (user.role !== 'restaurant' && user.role !== 'admin')) {
    throw new ApiError({
      message: 'Not authorized',
      status: 403,
      payload: null,
    });
  }

  const existing = await findRestaurantByOwnerId(user.id);
  if (existing) {
    throw new ApiError({
      message: 'You have already registered a restaurant under this account',
      status: 400,
      payload: null,
    });
  }

  if (!input.name.trim()) {
    throw new ApiError({
      message: 'Restaurant name is required',
      status: 400,
      payload: null,
    });
  }

  const restaurant: Restaurant = {
    id: `restaurant-${Date.now()}`,
    ownerId: user.id,
    name: input.name.trim(),
    cuisineType: input.cuisineType.trim() || 'Ethiopian Traditional',
    city: 'Addis Ababa',
    imageUrl: input.image?.uri || defaultRestaurantImage(),
    rating: 0,
    ratingCount: 0,
    deliveryTime: 30,
    deliveryFee: 50,
    location: {
      address: input.address.trim() || 'Addis Ababa',
      lat: 9.003,
      lng: 38.788,
    },
    menu: [],
  };

  return saveRestaurant(restaurant);
}

export async function mockAddMenuItem(input: AddMenuItemInput): Promise<Restaurant> {
  await delay(350);
  const user = await getCurrentMockUser();
  if (!user) {
    throw new ApiError({
      message: 'Not authorized',
      status: 401,
      payload: null,
    });
  }

  const restaurant = await findRestaurantByOwnerId(user.id);
  if (!restaurant) {
    throw new ApiError({
      message: 'No restaurant profile found for this account',
      status: 404,
      payload: null,
    });
  }

  if (!input.itemName.trim()) {
    throw new ApiError({
      message: 'Item name is required',
      status: 400,
      payload: null,
    });
  }

  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new ApiError({
      message: 'Price must be a positive number',
      status: 400,
      payload: null,
    });
  }

  const menuItem: MenuItem = {
    id: `item-${Date.now()}`,
    itemName: input.itemName.trim(),
    price: input.price,
    description: input.description.trim(),
    category: input.category || 'Traditional',
    imageUrl: input.image?.uri || DEFAULT_MENU_IMAGE,
  };

  return saveRestaurant({
    ...restaurant,
    menu: [...restaurant.menu, menuItem],
  });
}

export async function mockUpdateMenuItem(input: UpdateMenuItemInput): Promise<Restaurant> {
  await delay(350);
  const restaurant = await requireOwnedRestaurantForMenu();
  const menu = restaurant.menu.map((item) =>
    item.id === input.itemId
      ? {
          ...item,
          itemName: input.itemName.trim(),
          price: input.price,
          description: input.description.trim(),
          category: input.category || item.category,
          imageUrl: input.image?.uri ?? item.imageUrl,
        }
      : item,
  );
  return saveRestaurant({ ...restaurant, menu });
}

export async function mockDeleteMenuItem(itemId: string): Promise<Restaurant> {
  await delay(250);
  const restaurant = await requireOwnedRestaurantForMenu();
  return saveRestaurant({
    ...restaurant,
    menu: restaurant.menu.filter((item) => item.id !== itemId),
  });
}

export async function mockUpdateRestaurant(input: UpdateRestaurantInput): Promise<Restaurant> {
  await delay(350);
  const restaurant = await requireOwnedRestaurantForMenu();
  return saveRestaurant({
    ...restaurant,
    name: input.name?.trim() || restaurant.name,
    cuisineType: input.cuisineType?.trim() || restaurant.cuisineType,
    deliveryFee: input.deliveryFee ?? restaurant.deliveryFee,
    deliveryTime: input.deliveryTime ?? restaurant.deliveryTime,
    imageUrl: input.image?.uri ?? restaurant.imageUrl,
    location: {
      ...restaurant.location,
      address: input.address?.trim() || restaurant.location.address,
    },
  });
}

async function requireOwnedRestaurantForMenu(): Promise<Restaurant> {
  const user = await getCurrentMockUser();
  if (!user) {
    throw new ApiError({ message: 'Not authorized', status: 401, payload: null });
  }
  const restaurant = await findRestaurantByOwnerId(user.id);
  if (!restaurant) {
    throw new ApiError({
      message: 'No restaurant profile found for this account',
      status: 404,
      payload: null,
    });
  }
  return restaurant;
}
