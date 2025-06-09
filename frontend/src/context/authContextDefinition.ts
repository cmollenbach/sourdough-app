import { createContext } from 'react';

// Define User type here as it's used by AuthContextType
export interface User {
  id: number;
  email: string;
  role: string; // Or a more specific enum/type like UserRole from Prisma if available on frontend
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<{ token: string; user: User }>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);