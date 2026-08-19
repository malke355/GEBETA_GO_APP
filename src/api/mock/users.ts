import { getStoredItem, setStoredItem } from '@/storage/secureStorage';
import type { AuthUser, UserRole } from '@/types';

export type MockUser = AuthUser & {
  password: string;
};

const EXTRA_USERS_KEY = 'gebetago.mockUsers';
const DEMO_PASSWORD = 'password123';

export const DEMO_USERS: MockUser[] = [
  {
    id: 'customer-1',
    name: 'Solomon Alula',
    email: 'customer@test.com',
    password: DEMO_PASSWORD,
    role: 'customer',
    phone: '+251911111111',
    address: 'Addis Ababa, Bole Atlas',
  },
  {
    id: 'driver-1',
    name: 'Amanuel Tesfaye',
    email: 'driver@test.com',
    password: DEMO_PASSWORD,
    role: 'driver',
    phone: '+251922222222',
  },
  {
    id: 'restaurant-lucy',
    name: 'Lucy Manager',
    email: 'lucy@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
    phone: '+251933333333',
  },
  {
    id: 'restaurant-pizzahut',
    name: 'Pizza Hut Manager',
    email: 'pizzahut@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
  },
  {
    id: 'restaurant-burgerhouse',
    name: 'Burger House Manager',
    email: 'burgerhouse@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
  },
  {
    id: 'restaurant-ayat',
    name: 'Ayat Manager',
    email: 'ayat@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
  },
  {
    id: 'restaurant-yod',
    name: 'Yod Manager',
    email: 'yod@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
  },
  {
    id: 'restaurant-castelli',
    name: 'Castelli Manager',
    email: 'castelli@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
  },
  {
    id: 'admin-1',
    name: 'Platform Admin',
    email: 'admin@test.com',
    password: DEMO_PASSWORD,
    role: 'admin',
  },
];

let extraUsers: MockUser[] | null = null;

function toPublicUser(user: MockUser): AuthUser {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

async function loadExtraUsers(): Promise<MockUser[]> {
  if (extraUsers) {
    return extraUsers;
  }

  const raw = await getStoredItem(EXTRA_USERS_KEY);
  extraUsers = raw ? (JSON.parse(raw) as MockUser[]) : [];
  return extraUsers;
}

export async function listMockUsers(): Promise<MockUser[]> {
  const extras = await loadExtraUsers();
  return [...DEMO_USERS, ...extras];
}

export async function findMockUserByEmail(email: string): Promise<MockUser | undefined> {
  const users = await listMockUsers();
  return users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
}

export async function findMockUserById(id: string): Promise<MockUser | undefined> {
  const users = await listMockUsers();
  return users.find((user) => user.id === id);
}

export async function addMockUser(user: MockUser): Promise<AuthUser> {
  const extras = await loadExtraUsers();
  extras.push(user);
  extraUsers = extras;
  await setStoredItem(EXTRA_USERS_KEY, JSON.stringify(extras));
  return toPublicUser(user);
}

export function createMockToken(userId: string): string {
  return `mock:${userId}`;
}

export function readMockUserIdFromToken(token: string): string | null {
  return token.startsWith('mock:') ? token.slice('mock:'.length) : null;
}

export { toPublicUser };

export function isSelfServiceRole(role: UserRole): role is Exclude<UserRole, 'admin'> {
  return role === 'customer' || role === 'restaurant' || role === 'driver';
}
