import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiPost } from '../utils/api';

interface AuthContextType {
  user: string | null;
  login: (email: string, password?: string) => Promise<{ token: string; user: { id: number; email: string } }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user from storage or API
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(storedUser);
    setLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    const result = await apiPost<{ token: string; user: { id: number; email: string } }>(
      '/api/auth/login',
      { email, password }
    );
    setUser(result.user.email);
    localStorage.setItem('user', result.user.email);
    localStorage.setItem('token', result.token);
    return result;
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}