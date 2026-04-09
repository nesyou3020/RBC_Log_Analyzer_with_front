import { env } from '../../config/env';
import { ApiErrorShape } from '../../types';
import { clearAuthStorage, getToken } from '../storage';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: BodyInit | Record<string, unknown>;
  headers?: Record<string, string>;
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, auth = true } = options;

  const requestHeaders: Record<string, string> = {
    ...headers
  };

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (typeof body === 'object' && body !== null) {
    requestHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  } else {
    requestBody = body;
  }

  if (auth) {
    const token = getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: requestBody
  });

  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as unknown) : {};

  if (!response.ok) {
    const errorBody = parsed as ApiErrorShape;
    if (auth && (response.status === 401 || response.status === 403)) {
      clearAuthStorage();
    }
    throw new ApiError(errorBody.detail ?? 'Request failed', response.status);
  }

  return parsed as T;
}
