import { env } from '@/config/env';
import { ApiError } from './errors';
import { getAuthToken } from './token';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestQuery = Record<string, string | number | boolean | undefined>;

export type RequestOptions = {
  method?: HttpMethod;
  path: string;
  query?: RequestQuery;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

function buildUrl(path: string, query?: RequestQuery): string {
  const base = env.apiUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  const {
    method = 'GET',
    path,
    query,
    body,
    headers,
    signal,
    timeoutMs = env.apiTimeoutMs,
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const token = await getAuthToken();
    const response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw ApiError.fromResponse(response.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError({
        message: 'Request timed out',
        status: 0,
        payload: null,
      });
    }

    throw new ApiError({
      message: error instanceof Error ? error.message : 'Unknown network error',
      status: 0,
      payload: null,
    });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>) =>
    apiRequest<T>({ ...options, method: 'GET', path }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>) =>
    apiRequest<T>({ ...options, method: 'POST', path, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>) =>
    apiRequest<T>({ ...options, method: 'PUT', path, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>) =>
    apiRequest<T>({ ...options, method: 'PATCH', path, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>) =>
    apiRequest<T>({ ...options, method: 'DELETE', path }),
};
