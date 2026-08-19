import { delay } from './delay';
import { MOCK_RESTAURANTS } from './restaurants';
import type { Restaurant } from '@/types/restaurant';

export async function mockListRestaurants(): Promise<Restaurant[]> {
  await delay();
  return MOCK_RESTAURANTS.filter((restaurant) => restaurant.isSuspended !== true).sort(
    (left, right) => right.rating - left.rating,
  );
}

export async function mockGetRestaurant(id: string): Promise<Restaurant | null> {
  await delay();
  return MOCK_RESTAURANTS.find((restaurant) => restaurant.id === id) ?? null;
}
