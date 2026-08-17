export type Nullable<T> = T | null;

export type ApiSuccess<T> = {
  data: T;
  message?: string;
};

export type ApiFailure = {
  message: string;
  code?: string;
};
