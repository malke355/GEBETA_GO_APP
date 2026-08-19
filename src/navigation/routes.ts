export const routes = {
  root: '/',
  app: '/(app)',
  auth: '/(auth)',
  restaurant: (id: string) => `/(app)/restaurant/${id}`,
  cart: '/(app)/cart',
  checkout: '/(app)/checkout',
  orders: '/(app)/orders',
  order: (id: string) => `/(app)/order/${id}`,
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
