import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiPost } from '../utils/api';
import { AuthContext, type User } from './authContextDefinition'; // Import context and types

// The User interface is now imported from authContextDefinition.ts
// The AuthContextType interface is now imported from authContextDefinition.ts
// The AuthContext (createContext call) is now imported from authContextDefinition.ts

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from storage
    const storedUserString = localStorage.getItem('user');
    if (storedUserString) {
      try {
        const storedUser = JSON.parse(storedUserString) as User;
        setUser(storedUser);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem('user'); // Clear invalid stored user
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password?: string): Promise<{ token: string; user: User }> => {
    // Assuming the backend login returns id, email, and role for the user
    const result = await apiPost<{ token: string; user: User }>(
      '/auth/login',
      { email, password }
    );
    setUser(result.user);
    localStorage.setItem('user', JSON.stringify(result.user)); // Store the whole user object
    localStorage.setItem('token', result.token);
    return result;
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Also remove token on logout
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}