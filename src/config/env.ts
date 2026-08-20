import Constants from 'expo-constants';
import { Platform } from 'react-native';

const APP_ENVS = ['development', 'staging', 'production'] as const;

export type AppEnv = (typeof APP_ENVS)[number];

function readAppEnv(): AppEnv {
  const value = process.env.EXPO_PUBLIC_APP_ENV;
  return APP_ENVS.includes(value as AppEnv) ? (value as AppEnv) : 'development';
}

function inferLanHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const match = hostUri.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  return match?.[1] ?? null;
}

function resolveApiUrl(): string {
  const configured = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');

  if (Platform.OS === 'web') {
    return configured;
  }

  const lanHost = inferLanHost();
  if (lanHost && /localhost|127\.0\.0\.1/.test(configured)) {
    return configured.replace(/localhost|127\.0\.0\.1/g, lanHost);
  }

  return configured;
}

function readMockFlag(): boolean {
  const value = process.env.EXPO_PUBLIC_USE_MOCK_API;
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return false;
}

const appEnv = readAppEnv();

export const env = {
  appEnv,
  apiUrl: resolveApiUrl(),
  apiTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? '15000'),
  isDev: appEnv === 'development',
  useMockApi: readMockFlag(),
} as const;
