declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_APP_ENV?: 'development' | 'staging' | 'production';
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_API_TIMEOUT_MS?: string;
    EXPO_PUBLIC_USE_MOCK_API?: 'true' | 'false';
  }
}
