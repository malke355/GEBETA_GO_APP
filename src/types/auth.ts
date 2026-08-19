export type UserRole = 'customer' | 'restaurant' | 'driver' | 'admin';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  address?: string;
  phone?: string;
  isSuspended?: boolean;
};

export type AuthResponse = {
  success: boolean;
  token: string;
  user: AuthUser & { _id?: string };
  message?: string;
};

export type MeResponse = {
  success: boolean;
  user: AuthUser & { _id?: string };
  message?: string;
};

export type LoginInput = {
  email: string;
  password: string;
  role: UserRole;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, 'admin'>;
  address?: string;
  phone: string;
};
