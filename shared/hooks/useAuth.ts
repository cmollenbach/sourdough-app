import { useState, useCallback, useEffect } from 'react';
import { createApiClient } from '../api/client';

export interface UseAuthOptions {
  apiBaseUrl?: string;
  onLoginSuccess?: (token: string, user: any) => void;
  onLogout?: () => void;
}

export interface UseAuthReturn {
  user: any | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; name?: string }) => Promise<void>;
  googleAuth: (tokenId: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string | null) => void;
  setUser: (user: any | null) => void;
}

/**
 * Hook for managing authentication with the shared API client
 * 
 * @example
 * ```typescript
 * const { login, logout, isAuthenticated, user } = useAuth({
 *   apiBaseUrl: process.env.VITE_API_BASE_URL,
 *   onLoginSuccess: (token, user) => {
 *     localStorage.setItem('token', token);
 *     localStorage.setItem('user', JSON.stringify(user));
 *   },
 *   onLogout: () => {
 *     localStorage.removeItem('token');
 *     localStorage.removeItem('user');
 *   }
 * });
 * ```
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { 
    apiBaseUrl = 'http://localhost:3000/api',
    onLoginSuccess,
    onLogout
  } = options;

  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!token && !!user;

  // Create API client instance
  const apiClient = createApiClient({
    baseURL: apiBaseUrl,
    getAuthToken: () => token
  });

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.auth.login(credentials);
      setToken(response.token);
      setUser(response.user);
      onLoginSuccess?.(response.token, response.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, onLoginSuccess]);

  const register = useCallback(async (data: { email: string; password: string; name?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.auth.register(data);
      setToken(response.token);
      setUser(response.user);
      onLoginSuccess?.(response.token, response.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, onLoginSuccess]);

  const googleAuth = useCallback(async (tokenId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.auth.googleAuth(tokenId);
      setToken(response.token);
      setUser(response.user);
      onLoginSuccess?.(response.token, response.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google authentication failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, onLoginSuccess]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
    onLogout?.();
  }, [onLogout]);

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    googleAuth,
    logout,
    setToken,
    setUser
  };
}
