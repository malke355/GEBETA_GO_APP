export const routes = {
  root: '/',
  app: '/(app)',
  auth: '/(auth)',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
