import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCurrentUser, loginRequest, normalizeUser, registerRequest } from '@/api/auth';
import { connectRealtime, disconnectRealtime } from '@/api/socket';
import { ApiError } from '@/api/errors';
import { clearAuthToken, loadAuthToken, saveAuthToken } from '@/storage/secureStorage';
import type { AuthUser, LoginInput, RegisterInput } from '@/types';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    disconnectRealtime();
    await clearAuthToken();
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const token = await loadAuthToken();
        if (!token) {
          return;
        }

        const data = await fetchCurrentUser();
        const nextUser = normalizeUser(data.user);

        if (nextUser.isSuspended) {
          throw new ApiError({
            message: 'This account has been suspended',
            status: 403,
            payload: data,
          });
        }

        if (!cancelled) {
          await connectRealtime();
          setUser(nextUser);
        }
      } catch {
        await clearAuthToken();
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const data = await loginRequest(input);
    const nextUser = normalizeUser(data.user);
    await saveAuthToken(data.token);
    await connectRealtime();
    setUser(nextUser);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await registerRequest(input);
    const nextUser = normalizeUser(data.user);
    await saveAuthToken(data.token);
    await connectRealtime();
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
