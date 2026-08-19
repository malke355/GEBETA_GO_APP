export type MenuItem = {
  id: string;
  itemName: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
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
  isSuspended?: boolean;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  menu: MenuItem[];
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
