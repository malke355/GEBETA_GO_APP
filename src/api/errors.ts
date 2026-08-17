type ApiErrorParams = {
  message: string;
  status: number;
  payload: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor({ message, status, payload }: ApiErrorParams) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}
