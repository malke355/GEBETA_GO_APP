import type { UserRole } from '@/types';

export const LOGIN_ROLES: { id: UserRole; label: string; icon: 'person-outline' | 'restaurant-outline' | 'bicycle-outline' | 'shield-checkmark-outline' }[] = [
  { id: 'customer', label: 'Customer', icon: 'person-outline' },
  { id: 'restaurant', label: 'Merchant', icon: 'restaurant-outline' },
  { id: 'driver', label: 'Driver', icon: 'bicycle-outline' },
  { id: 'admin', label: 'Admin', icon: 'shield-checkmark-outline' },
];

export const REGISTER_ROLES = LOGIN_ROLES.filter((role) => role.id !== 'admin');
