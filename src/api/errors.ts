type ApiErrorParams = {
  message: string;
  status: number;
  payload: unknown;
};

function readPayloadMessage(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.length > 0) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = payload.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return null;
}

function normalizeTransportMessage(message: string): string {
  const lower = message.toLowerCase();

  // Expo SDK 57 native fetch wraps AbortController cancels as:
  // "fetch failed: Fetch request has been canceled"
  if (
    lower.includes('has been canceled') ||
    lower.includes('has been cancelled') ||
    lower.includes('the operation was aborted') ||
    lower.includes('aborterror') ||
    lower === 'aborted'
  ) {
    return 'The GebetaGo server took too long to respond. It may be waking up or offline — try again in a minute.';
  }

  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('could not connect')
  ) {
    return 'Cannot reach the GebetaGo server. Check your connection, or confirm the API is running.';
  }

  // Strip Expo's "fetch failed: ..." prefix for any remaining transport errors.
  if (lower.startsWith('fetch failed:')) {
    return message.slice('fetch failed:'.length).trim() || message;
  }

  return message;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor({ message, status, payload }: ApiErrorParams) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }

  static fromResponse(status: number, payload: unknown): ApiError {
    return new ApiError({
      message: readPayloadMessage(payload) ?? `Request failed with status ${status}`,
      status,
      payload,
    });
  }
}

export function isAbortLikeError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const name = 'name' in error && typeof error.name === 'string' ? error.name : '';
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const lower = message.toLowerCase();

  return (
    name === 'AbortError' ||
    lower.includes('has been canceled') ||
    lower.includes('has been cancelled') ||
    lower.includes('the operation was aborted') ||
    lower.includes('aborterror')
  );
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) {
    return normalizeTransportMessage(error.message);
  }

  if (error instanceof Error && error.message.length > 0) {
    return normalizeTransportMessage(error.message);
  }

  return fallback;
}
