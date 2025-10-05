import { createContext } from 'react';

// Define User type here as it's used by AuthContextType
export interface User {
  id: string; // User ID is typically a string (e.g., CUID, UUID) from Prisma
  email: string;
  role?: string; // Role can be optional
  displayName?: string; // For social logins
  avatarUrl?: string;   // For social logins
}

export interface AuthContextType {
  user: User | null;
  token: string | null; // Add token to the context state
  isLoading: boolean; // Renamed from 'loading' for clarity, or keep 'loading' if preferred
  // For email/password login: makes API call, sets user and token on success
  login: (email: string, password: string) => Promise<void>;
  // For setting user state after social login (token is already handled in component, context updates itself)
  setAuthenticatedUser: (userData: User, jwtToken: string) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>; // To handle session persistence
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);