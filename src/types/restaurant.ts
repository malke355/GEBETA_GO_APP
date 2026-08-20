export type MenuItem = {
  id: string;
  itemName: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
};

export type RestaurantReview = {
  id: string;
  rating: number;
  review: string;
  customerName: string;
  createdAt: string;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisineType: string;
  city: string;
  imageUrl: string;
  rating: number;
  ratingCount: number;
  deliveryTime: number;
  deliveryFee: number;
  ownerId?: string;
  isSuspended?: boolean;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  menu: MenuItem[];
  reviews?: RestaurantReview[];
};

export type CreateRestaurantInput = {
  name: string;
  cuisineType: string;
  address: string;
  image?: import('./media').PickedImage | null;
};

export type UpdateRestaurantInput = {
  name?: string;
  cuisineType?: string;
  address?: string;
  deliveryFee?: number;
  deliveryTime?: number;
  image?: import('./media').PickedImage | null;
};

export type AddMenuItemInput = {
  itemName: string;
  price: number;
  description: string;
  category: string;
  image?: import('./media').PickedImage | null;
};

export type UpdateMenuItemInput = AddMenuItemInput & {
  itemId: string;
};

export type RestaurantListResponse = {
  success: boolean;
  count: number;
  data: Array<Restaurant & { _id?: string }>;
};

export type RestaurantDetailResponse = {
  success: boolean;
  data: Restaurant & { _id?: string };
};
