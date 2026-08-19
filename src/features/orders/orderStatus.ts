import { assertNever } from '@/utils';
import type { OrderStatus, PaymentMethod } from '@/types';

export const TRACK_STEPS = [
  { key: 'placed', label: 'Order placed', description: 'Awaiting confirmation' },
  { key: 'confirmed', label: 'Confirmed', description: 'Preparing food' },
  { key: 'prepared', label: 'Food ready', description: 'Courier picking up' },
  { key: 'dispatched', label: 'Out for delivery', description: 'On the way' },
  { key: 'delivered', label: 'Delivered', description: 'Enjoy your meal!' },
] as const;

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash on delivery',
  telebirr: 'Telebirr',
  bank_transfer: 'Bank transfer',
};

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return status !== 'delivered' && status !== 'cancelled';
}

export function timelineStatus(status: OrderStatus): (typeof TRACK_STEPS)[number]['key'] | 'cancelled' {
  if (status === 'cancelled') {
    return 'cancelled';
  }
  if (status === 'picked_up') {
    return 'dispatched';
  }
  return status;
}

export function statusHeadline(status: OrderStatus): string {
  switch (status) {
    case 'placed':
      return 'Waiting for the restaurant to confirm';
    case 'confirmed':
      return 'The kitchen is preparing your order';
    case 'prepared':
      return 'Food is ready — waiting for a courier';
    case 'dispatched':
      return 'A courier is heading to the restaurant';
    case 'picked_up':
      return 'Your courier is on the way';
    case 'delivered':
      return 'Enjoy your meal';
    case 'cancelled':
      return 'This order was cancelled';
    default:
      return assertNever(status);
  }
}

export function statusLabel(status: OrderStatus): string {
  switch (status) {
    case 'placed':
      return 'Placed';
    case 'confirmed':
      return 'Confirmed';
    case 'prepared':
      return 'Ready';
    case 'dispatched':
      return 'Dispatched';
    case 'picked_up':
      return 'On the way';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return assertNever(status);
  }
}
