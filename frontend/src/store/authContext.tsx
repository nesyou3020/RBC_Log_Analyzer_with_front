import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { LoginResponse } from '../types';
import { AuthStorageMode, clearAuthStorage, getToken, getUser, setAuthSession } from '../services/storage';

type AuthState = {
  token: string | null;
  user: LoginResponse | null;
  isAuthenticated: boolean;
  storageMode: AuthStorageMode;
  setSession: (data: LoginResponse, mode?: AuthStorageMode) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [tokenState, setTokenState] = useState<string | null>(() => getToken());
  const [userState, setUserState] = useState<LoginResponse | null>(() => getUser());
  const [storageMode, setStorageMode] = useState<AuthStorageMode>(() => 'localStorage');

  const value = useMemo<AuthState>(
    () => ({
      token: tokenState,
      user: userState,
      isAuthenticated: Boolean(tokenState),
      storageMode,
      setSession: (data, mode = 'localStorage') => {
        setAuthSession(data.token, data, mode);
        setTokenState(data.token);
        setUserState(data);
        setStorageMode(mode);
      },
      clearSession: () => {
        clearAuthStorage();
        setTokenState(null);
        setUserState(null);
        setStorageMode('localStorage');
      }
    }),
    [tokenState, userState, storageMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}
