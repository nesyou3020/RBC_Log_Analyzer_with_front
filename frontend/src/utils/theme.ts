const THEME_STORAGE_KEY = 'rbc_theme_mode';

export type ThemeMode = 'light' | 'dark';

export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (value === 'light' || value === 'dark') {
    return value;
  }
  return null;
}

export function resolveTheme(): ThemeMode {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.setAttribute('data-theme', theme);
}

export function persistTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
