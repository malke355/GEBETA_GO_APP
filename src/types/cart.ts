export type CartLine = {
  menuItemId: string;
  itemName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

export type CartRestaurant = {
  id: string;
  name: string;
  deliveryFee: number;
};

export type CartState = {
  items: CartLine[];
  restaurant: CartRestaurant | null;
};
