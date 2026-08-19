export const endpoints = {
  health: '/health',
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    me: '/api/auth/me',
  },
  restaurants: {
    list: '/api/restaurants',
  },
} as const;
