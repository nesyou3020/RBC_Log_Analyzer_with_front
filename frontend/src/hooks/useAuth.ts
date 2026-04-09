import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routes } from '../config/routes';
import { logoutApi, loginApi } from '../services/api/auth.api';
import { ApiError } from '../services/api/client';
import { AuthStorageMode } from '../services/storage';
import { useAuthContext } from '../store/authContext';

export function useAuth() {
  const navigate = useNavigate();
  const auth = useAuthContext();

  const login = useMutation({
    mutationFn: loginApi,
    onSuccess: (response, variables: { username: string; password: string; rememberMe?: boolean }) => {
      const storageMode: AuthStorageMode = variables.rememberMe ? 'localStorage' : 'sessionStorage';
      auth.setSession(response.data, storageMode);
      navigate(routes.dashboard);
    }
  });

  const logout = useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      auth.clearSession();
      navigate(routes.login);
    }
  });

  return {
    ...auth,
    login,
    logout,
    asMessage: (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          return 'Invalid username or password.';
        }
        if (error.status === 403) {
          return 'Your account is disabled or access is restricted.';
        }
        return error.message;
      }

      return 'Unexpected error';
    }
  };
}
