import { LoginResponse } from '../types';

export type AuthStorageMode = 'localStorage' | 'sessionStorage';

const TOKEN_KEY = 'rbc_token';
const USER_KEY = 'rbc_user';
const STORAGE_MODE_KEY = 'rbc_auth_storage_mode';

function getStorage(mode: AuthStorageMode): Storage {
  return mode === 'sessionStorage' ? sessionStorage : localStorage;
}

function getPreferredStorage(): Storage {
  if (typeof window === 'undefined') {
    return localStorage;
  }

  const mode = localStorage.getItem(STORAGE_MODE_KEY) as AuthStorageMode | null;
  if (mode === 'sessionStorage') {
    return sessionStorage;
  }

  return localStorage;
}

export function setAuthStorageMode(mode: AuthStorageMode): void {
  localStorage.setItem(STORAGE_MODE_KEY, mode);
}

export function getAuthStorageMode(): AuthStorageMode {
  return (localStorage.getItem(STORAGE_MODE_KEY) as AuthStorageMode | null) ?? 'localStorage';
}

export function setAuthSession(token: string, user: LoginResponse, mode: AuthStorageMode): void {
  const storage = getStorage(mode);
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
  setAuthStorageMode(mode);
}

export function getToken(): string | null {
  const storage = getPreferredStorage();
  return storage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  getPreferredStorage().setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getUser(): LoginResponse | null {
  const storage = getPreferredStorage();
  const raw = storage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as LoginResponse;
  } catch {
    return null;
  }
}

export function setUser(user: LoginResponse): void {
  getPreferredStorage().setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function clearAuthStorage(): void {
  clearToken();
  clearUser();
  localStorage.removeItem(STORAGE_MODE_KEY);
}
