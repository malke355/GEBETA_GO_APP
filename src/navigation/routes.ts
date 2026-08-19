export const routes = {
  root: '/',
  app: '/(app)',
  auth: '/(auth)',
  restaurant: (id: string) => `/(app)/restaurant/${id}`,
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
