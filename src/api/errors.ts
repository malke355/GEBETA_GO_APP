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

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}
