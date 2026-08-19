export const endpoints = {
  health: '/health',
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    me: '/api/auth/me',
  },
  restaurants: {
    list: '/api/restaurants',
    mine: '/api/restaurants/mine',
    create: '/api/restaurants',
    addMenu: '/api/restaurants/menu',
    detail: (id: string) => `/api/restaurants/${id}`,
  },
  orders: {
    create: '/api/orders',
    mine: '/api/orders/my-orders',
    restaurant: '/api/orders/restaurant',
    detail: (id: string) => `/api/orders/${id}`,
    status: (id: string) => `/api/orders/${id}/status`,
    cancel: (id: string) => `/api/orders/${id}/cancel`,
    verifyPayment: (id: string) => `/api/orders/${id}/verify-payment`,
  },
} as const;
