import { ApiError } from '@/api/errors';
import { getAuthToken } from '@/api/token';
import type { AuthResponse, LoginInput, MeResponse, RegisterInput } from '@/types';
import { delay } from './delay';
import {
  addMockUser,
  createMockToken,
  findMockUserByEmail,
  findMockUserById,
  isSelfServiceRole,
  readMockUserIdFromToken,
  toggleMockFavorite,
  toPublicUser,
  updateMockUserProfile,
} from './users';

export async function mockLogin(input: LoginInput): Promise<AuthResponse> {
  await delay();

  const user = await findMockUserByEmail(input.email);
  if (!user || user.password !== input.password) {
    throw new ApiError({
      message: 'Invalid credentials',
      status: 401,
      payload: { success: false, message: 'Invalid credentials' },
    });
  }

  if (user.role !== input.role) {
    throw new ApiError({
      message: `Access denied: This account is registered as a ${user.role}, not a ${input.role}.`,
      status: 401,
      payload: null,
    });
  }

  if (user.isSuspended) {
    throw new ApiError({
      message: 'This account has been suspended',
      status: 403,
      payload: null,
    });
  }

  return {
    success: true,
    token: createMockToken(user.id),
    user: toPublicUser(user),
  };
}

export async function mockRegister(input: RegisterInput): Promise<AuthResponse> {
  await delay();

  if (!isSelfServiceRole(input.role)) {
    throw new ApiError({
      message: 'Role must be customer, restaurant or driver',
      status: 400,
      payload: null,
    });
  }

  const existing = await findMockUserByEmail(input.email);
  if (existing) {
    throw new ApiError({
      message: 'User already exists',
      status: 400,
      payload: null,
    });
  }

  const user = await addMockUser({
    id: `user-${Date.now()}`,
    name: input.name,
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: input.role,
    address: input.address,
    phone: input.phone,
  });

  return {
    success: true,
    token: createMockToken(user.id),
    user,
  };
}

export async function mockFetchCurrentUser(): Promise<MeResponse> {
  await delay(150);

  const token = await getAuthToken();
  const userId = token ? readMockUserIdFromToken(token) : null;
  const user = userId ? await findMockUserById(userId) : undefined;

  if (!user) {
    throw new ApiError({
      message: 'Not authorized',
      status: 401,
      payload: null,
    });
  }

  return {
    success: true,
    user: toPublicUser(user),
  };
}

export async function mockUpdateProfile(input: {
  name?: string;
  address?: string;
  phone?: string;
}): Promise<MeResponse> {
  await delay(300);
  const token = await getAuthToken();
  const userId = token ? readMockUserIdFromToken(token) : null;
  if (!userId) {
    throw new ApiError({ message: 'Not authorized', status: 401, payload: null });
  }
  const user = await updateMockUserProfile(userId, input);
  return { success: true, user };
}

export async function mockToggleFavorite(restaurantId: string): Promise<MeResponse> {
  await delay(200);
  const token = await getAuthToken();
  const userId = token ? readMockUserIdFromToken(token) : null;
  if (!userId) {
    throw new ApiError({ message: 'Not authorized', status: 401, payload: null });
  }
  const user = await toggleMockFavorite(userId, restaurantId);
  return { success: true, user };
}
