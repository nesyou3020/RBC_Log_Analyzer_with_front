export type ApiEnvelope<T> = {
  data: T;
};

export type ApiErrorShape = {
  detail?: string;
};
