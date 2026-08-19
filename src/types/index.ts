export type Nullable<T> = T | null;

export type ApiSuccess<T> = {
  data: T;
  message?: string;
};

export type ApiFailure = {
  message: string;
  code?: string;
};

export type {
  AuthResponse,
  AuthUser,
  LoginInput,
  MeResponse,
  RegisterInput,
  UserRole,
} from './auth';

export type {
  AddMenuItemInput,
  CreateRestaurantInput,
  MenuItem,
  Restaurant,
  RestaurantDetailResponse,
  RestaurantListResponse,
} from './restaurant';

export type { CartLine, CartRestaurant, CartState } from './cart';

export type {
  CreateOrderResponse,
  Order,
  OrderListResponse,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PlaceOrderInput,
} from './order';
