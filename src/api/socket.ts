import { io, type Socket } from 'socket.io-client';
import { env } from '@/config/env';
import { getAuthToken } from './token';

export type OrderStatusPayload = {
  orderId?: string;
  status?: string;
};

let socket: Socket | null = null;

export async function connectRealtime(): Promise<void> {
  if (env.useMockApi) {
    return;
  }

  const token = await getAuthToken();
  if (!token) {
    return;
  }

  disconnectRealtime();
  socket = io(env.apiUrl, {
    auth: { token },
    transports: ['websocket'],
  });
}

export function disconnectRealtime(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

export function emitRealtime(event: string, payload?: unknown): void {
  socket?.emit(event, payload);
}

export function subscribeRealtime<T = OrderStatusPayload>(event: string, handler: (payload: T) => void): () => void {
  if (!socket) {
    return () => undefined;
  }

  socket.on(event, handler);
  return () => {
    socket?.off(event, handler);
  };
}
