export const endpoints = {
  health: '/health',
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    me: '/api/auth/me',
  },
  restaurants: {
    list: '/api/restaurants',
    detail: (id: string) => `/api/restaurants/${id}`,
  },
  orders: {
    create: '/api/orders',
    detail: (id: string) => `/api/orders/${id}`,
  },
} as const;
