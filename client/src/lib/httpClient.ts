import axios, { isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

// Endpoints whose own 401s should never trigger a refresh-and-retry cycle —
// a 401 here means the credentials/refresh token themselves are invalid.
const AUTH_ENDPOINTS_WITHOUT_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Separate instance for the refresh call so its response doesn't pass back
// through the interceptor below and cause infinite recursion.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let pendingRefresh: Promise<void> | null = null;

function refreshAccessToken(): Promise<void> {
  if (!pendingRefresh) {
    pendingRefresh = refreshClient
      .post('/auth/refresh')
      .then(() => undefined)
      .finally(() => {
        pendingRefresh = null;
      });
  }
  return pendingRefresh;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiEnvelope<unknown>>(error)) {
    return error.response?.data?.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const url = config?.url ?? '';

    const shouldAttemptRefresh =
      status === 401 &&
      config &&
      !config._retry &&
      !AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) => url.includes(endpoint));

    if (!shouldAttemptRefresh) {
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      await refreshAccessToken();
      return await httpClient(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
