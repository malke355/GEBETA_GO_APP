export { api, apiRequest, type HttpMethod, type RequestOptions, type RequestQuery } from './client';
export { endpoints } from './endpoints';
export { ApiError, getApiErrorMessage } from './errors';
export { getAuthToken, setAuthToken } from './token';
export { connectRealtime, disconnectRealtime, emitRealtime, subscribeRealtime } from './socket';
export { loginRequest, registerRequest, fetchCurrentUser, updateProfileRequest, toggleFavoriteRequest } from './auth';
export {
  fetchAdminOrders,
  fetchAdminRestaurants,
  fetchAdminStats,
  fetchAdminUsers,
  setRestaurantSuspended,
  setUserSuspended,
  deleteAdminUser,
  deleteAdminRestaurant,
  assignAdminDriver,
} from './admin';
export {
  addMenuItem,
  createRestaurant,
  deleteMenuItem,
  getMyRestaurant,
  getRestaurant,
  listRestaurants,
  normalizeRestaurant,
  updateMenuItem,
  updateRestaurant,
} from './restaurants';
export {
  acceptJob,
  cancelOrder,
  createOrder,
  getActiveDelivery,
  getOrder,
  listAvailableJobs,
  listDriverHistory,
  listMyOrders,
  listRestaurantOrders,
  rateOrder,
  updateOrderStatus,
  uploadPaymentProof,
  verifyOrderPayment,
} from './orders';
