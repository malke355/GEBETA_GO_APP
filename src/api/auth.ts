import { env } from '@/config/env';
import { mockFetchCurrentUser, mockLogin, mockRegister } from '@/api/mock/auth';
import { api } from './client';
import { endpoints } from './endpoints';
import type { AuthResponse, AuthUser, LoginInput, MeResponse, RegisterInput, UserRole } from '@/types';

const USER_ROLES: UserRole[] = ['customer', 'restaurant', 'driver', 'admin'];

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

export function normalizeUser(raw: AuthUser & { _id?: string }): AuthUser {
  return {
    id: String(raw.id ?? raw._id),
    name: raw.name,
    email: raw.email,
    role: isUserRole(raw.role) ? raw.role : 'customer',
    address: raw.address,
    phone: raw.phone,
    isSuspended: raw.isSuspended,
  };
}

export function loginRequest(input: LoginInput) {
  if (env.useMockApi) {
    return mockLogin(input);
  }

  return api.post<AuthResponse>(endpoints.auth.login, input);
}

export function registerRequest(input: RegisterInput) {
  if (env.useMockApi) {
    return mockRegister(input);
  }

  return api.post<AuthResponse>(endpoints.auth.register, input);
}

export function fetchCurrentUser() {
  if (env.useMockApi) {
    return mockFetchCurrentUser();
  }

  return api.get<MeResponse>(endpoints.auth.me);
}
