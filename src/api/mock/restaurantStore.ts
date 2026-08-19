import { getJsonItem, setJsonItem } from '@/storage/asyncStorage';
import { MOCK_RESTAURANTS } from './restaurants';
import type { Restaurant } from '@/types/restaurant';

const OVERLAY_KEY = 'gebetago.restaurantsOverlay';
const DEFAULT_RESTAURANT_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';

async function readOverlay(): Promise<Restaurant[]> {
  return (await getJsonItem<Restaurant[]>(OVERLAY_KEY)) ?? [];
}

export async function listPersistedRestaurants(): Promise<Restaurant[]> {
  const overlay = await readOverlay();
  const overlayIds = new Set(overlay.map((restaurant) => restaurant.id));
  return [...overlay, ...MOCK_RESTAURANTS.filter((restaurant) => !overlayIds.has(restaurant.id))];
}

export async function getPersistedRestaurant(id: string): Promise<Restaurant | null> {
  const restaurants = await listPersistedRestaurants();
  return restaurants.find((restaurant) => restaurant.id === id) ?? null;
}

export async function findRestaurantByOwnerId(ownerId: string): Promise<Restaurant | null> {
  const restaurants = await listPersistedRestaurants();
  return restaurants.find((restaurant) => (restaurant.ownerId ?? restaurant.id) === ownerId) ?? null;
}

export async function saveRestaurant(restaurant: Restaurant): Promise<Restaurant> {
  const overlay = await readOverlay();
  await setJsonItem(OVERLAY_KEY, [restaurant, ...overlay.filter((item) => item.id !== restaurant.id)]);
  return restaurant;
}

export function defaultRestaurantImage(): string {
  return DEFAULT_RESTAURANT_IMAGE;
}
