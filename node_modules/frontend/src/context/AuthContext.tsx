import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { apiPost } from '../utils/api';
import { AuthContext, type User } from './authContextDefinition'; // Import context and types
import { jwtDecode } from 'jwt-decode'; // You'll need to install this: npm install jwt-decode

// The User interface is now imported from authContextDefinition.ts
// The AuthContextType interface is now imported from authContextDefinition.ts
// The AuthContext (createContext call) is now imported from authContextDefinition.ts

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Changed from 'loading'

  const initializeAuth = useCallback(async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('user');

    if (storedToken) {
      try {
        const decoded: { exp: number } = jwtDecode(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          if (storedUserString) {
            setUser(JSON.parse(storedUserString) as User);
          } else {
            // Optionally, if user isn't stored but token is valid,
            // you might want to fetch user details from a /me endpoint.
            // For now, we assume if token is valid, user should have been stored.
            // Or, rely on the next login to populate the user.
            console.warn("Token found but user data missing from localStorage.");
          }
        } else {
          // Token expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (e) {
        console.error("Failed to process stored token/user:", e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await apiPost<{ token: string; user: User }>(
      '/auth/login',
      { email, password }
    );
      setAuthenticatedUser(result.user, result.token);
    } catch (error) {
      setIsLoading(false);
      throw error; // Re-throw to be caught by the calling component
    }
  };

  const setAuthenticatedUser = (userData: User, jwtToken: string) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
    setIsLoading(false); // Ensure loading is set to false after user is set
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Also remove token on logout
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, setAuthenticatedUser, logout, initializeAuth }}>
      {children}
    </AuthContext.Provider>
  );
}