import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';
import { getJsonItem, removeItem, setJsonItem } from '@/storage/asyncStorage';
import type { CartLine, CartRestaurant, MenuItem, Restaurant } from '@/types';

const CART_ITEMS_KEY = 'gebetago.cartItems';
const CART_RESTAURANT_KEY = 'gebetago.cartRestaurant';

type CartContextValue = {
  items: CartLine[];
  restaurant: CartRestaurant | null;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  quantityFor: (menuItemId: string) => number;
  addItem: (item: MenuItem, restaurant: Restaurant) => void;
  increment: (menuItemId: string) => void;
  decrement: (menuItemId: string) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function toCartRestaurant(restaurant: Restaurant): CartRestaurant {
  return {
    id: restaurant.id,
    name: restaurant.name,
    deliveryFee: restaurant.deliveryFee,
  };
}

function persist(items: CartLine[], restaurant: CartRestaurant | null) {
  void setJsonItem(CART_ITEMS_KEY, items);
  if (restaurant) {
    void setJsonItem(CART_RESTAURANT_KEY, restaurant);
  } else {
    void removeItem(CART_RESTAURANT_KEY);
  }
}

type CartProviderProps = {
  children: ReactNode;
};

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [restaurant, setRestaurant] = useState<CartRestaurant | null>(null);

  useEffect(() => {
    const restore = async () => {
      try {
        const savedItems = await getJsonItem<CartLine[]>(CART_ITEMS_KEY);
        const savedRestaurant = await getJsonItem<CartRestaurant>(CART_RESTAURANT_KEY);
        if (savedItems) {
          setItems(savedItems);
        }
        if (savedRestaurant) {
          setRestaurant(savedRestaurant);
        }
      } catch {
        setItems([]);
        setRestaurant(null);
      }
    };

    void restore();
  }, []);

  const sync = useCallback((nextItems: CartLine[], nextRestaurant: CartRestaurant | null) => {
    setItems(nextItems);
    setRestaurant(nextRestaurant);
    persist(nextItems, nextRestaurant);
  }, []);

  const addLine = useCallback(
    (item: MenuItem, nextRestaurant: Restaurant, replace: boolean) => {
      const currentItems = replace ? [] : [...items];
      const currentRestaurant = replace ? toCartRestaurant(nextRestaurant) : restaurant ?? toCartRestaurant(nextRestaurant);
      const existingIndex = currentItems.findIndex((line) => line.menuItemId === item.id);

      if (existingIndex >= 0) {
        const existing = currentItems[existingIndex];
        if (existing) {
          currentItems[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        }
      } else {
        currentItems.push({
          menuItemId: item.id,
          itemName: item.itemName,
          price: item.price,
          quantity: 1,
          imageUrl: item.imageUrl,
        });
      }

      sync(currentItems, currentRestaurant);
    },
    [items, restaurant, sync],
  );

  const addItem = useCallback(
    (item: MenuItem, nextRestaurant: Restaurant) => {
      if (restaurant && restaurant.id !== nextRestaurant.id && items.length > 0) {
        Alert.alert(
          'Start a new cart?',
          `Your cart has items from ${restaurant.name}. Replace it with items from ${nextRestaurant.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Replace', onPress: () => addLine(item, nextRestaurant, true) },
          ],
        );
        return;
      }

      addLine(item, nextRestaurant, false);
    },
    [addLine, items.length, restaurant],
  );

  const increment = useCallback(
    (menuItemId: string) => {
      sync(
        items.map((line) =>
          line.menuItemId === menuItemId ? { ...line, quantity: line.quantity + 1 } : line,
        ),
        restaurant,
      );
    },
    [items, restaurant, sync],
  );

  const decrement = useCallback(
    (menuItemId: string) => {
      const nextItems = items
        .map((line) =>
          line.menuItemId === menuItemId ? { ...line, quantity: line.quantity - 1 } : line,
        )
        .filter((line) => line.quantity > 0);

      sync(nextItems, nextItems.length === 0 ? null : restaurant);
    },
    [items, restaurant, sync],
  );

  const removeLine = useCallback(
    (menuItemId: string) => {
      const nextItems = items.filter((line) => line.menuItemId !== menuItemId);
      sync(nextItems, nextItems.length === 0 ? null : restaurant);
    },
    [items, restaurant, sync],
  );

  const clearCart = useCallback(() => {
    sync([], null);
  }, [sync]);

  const quantityFor = useCallback(
    (menuItemId: string) => items.find((line) => line.menuItemId === menuItemId)?.quantity ?? 0,
    [items],
  );

  const subtotal = items.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      restaurant,
      itemCount,
      subtotal,
      deliveryFee,
      totalAmount: subtotal + deliveryFee,
      quantityFor,
      addItem,
      increment,
      decrement,
      removeItem: removeLine,
      clearCart,
    }),
    [
      items,
      restaurant,
      itemCount,
      subtotal,
      deliveryFee,
      quantityFor,
      addItem,
      increment,
      decrement,
      removeLine,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
}
