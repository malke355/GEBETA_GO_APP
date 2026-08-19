import Constants from 'expo-constants';
import { Platform } from 'react-native';

const APP_ENVS = ['development', 'staging', 'production'] as const;

export type AppEnv = (typeof APP_ENVS)[number];

function readEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.length > 0 ? value : fallback;
}

function readAppEnv(): AppEnv {
  const value = readEnv('EXPO_PUBLIC_APP_ENV', 'development');
  return APP_ENVS.includes(value as AppEnv) ? (value as AppEnv) : 'development';
}

function inferLanHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const match = hostUri.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  return match?.[1] ?? null;
}

function resolveApiUrl(): string {
  const configured = readEnv('EXPO_PUBLIC_API_URL', 'http://localhost:5000').replace(/\/$/, '');

  if (Platform.OS === 'web') {
    return configured;
  }

  const lanHost = inferLanHost();
  if (lanHost && /localhost|127\.0\.0\.1/.test(configured)) {
    return configured.replace(/localhost|127\.0\.0\.1/g, lanHost);
  }

  return configured;
}

function readBooleanEnv(key: string, fallback: boolean): boolean {
  const value = process.env[key];
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return fallback;
}

const appEnv = readAppEnv();

export const env = {
  appEnv,
  apiUrl: resolveApiUrl(),
  apiTimeoutMs: Number(readEnv('EXPO_PUBLIC_API_TIMEOUT_MS', '15000')),
  isDev: appEnv === 'development',
  useMockApi: readBooleanEnv('EXPO_PUBLIC_USE_MOCK_API', true),
} as const;
