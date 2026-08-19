import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '@/api/token';

const TOKEN_KEY = 'gebetago.authToken';

async function readValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function writeValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function saveAuthToken(token: string): Promise<void> {
  setAuthToken(token);
  await writeValue(TOKEN_KEY, token);
}

export async function loadAuthToken(): Promise<string | null> {
  const token = await readValue(TOKEN_KEY);
  setAuthToken(token);
  return token;
}

export async function clearAuthToken(): Promise<void> {
  setAuthToken(null);
  await deleteValue(TOKEN_KEY);
}

export async function getStoredItem(key: string): Promise<string | null> {
  return readValue(key);
}

export async function setStoredItem(key: string, value: string): Promise<void> {
  await writeValue(key, value);
}
