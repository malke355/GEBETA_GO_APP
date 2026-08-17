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

export const env = {
  appEnv: readAppEnv(),
  apiUrl: readEnv('EXPO_PUBLIC_API_URL', 'http://localhost:3000/api'),
  apiTimeoutMs: Number(readEnv('EXPO_PUBLIC_API_TIMEOUT_MS', '15000')),
  isDev: readAppEnv() === 'development',
} as const;
