import axios from "axios";
import type { StepTemplate, RecipeStub } from "@sourdough/shared";

// Types for RecipeForm - ideally, these would be in a shared types file
export interface FieldMeta { // Exporting in case other components might need it
  name: string;
  type: string;
  label: string;
  required: boolean;
}

// Use the more specific type for RecipeFormData, matching RecipeForm.tsx
// Ideally, this type would be defined in a shared location (e.g., src/types/recipe.ts)
// and imported in both RecipeForm.tsx and here.
export type RecipeFormData = {
  name: string;
  totalWeight: number;
  hydrationPct: number;
  saltPct: number;
  notes?: string;
};


const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api", // Use environment variable
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to extract a meaningful error message
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      const { data } = error.response;
      // Check for common error message structures from backend
      if (typeof data.message === 'string' && data.message.trim() !== '') {
        return data.message;
      }
      if (typeof data.error === 'string' && data.error.trim() !== '') {
        return data.error;
      }
      // If backend sends a plain string error
      if (typeof data === 'string' && data.trim() !== '') {
        return data;
      }
    }
    // Fallback to Axios's error message or a generic one
    return error.message || 'An API request failed. Please try again.';
  }
  return error instanceof Error ? error.message : 'An unknown error occurred.';
}

// --- NEW --- API function to delete a step template
export async function deleteStepTemplate(id: number): Promise<void> {
  await apiDelete(`/steps/templates/${id}`);
}

// --- NEW --- API function to fetch recipe list
export async function fetchRecipeList(): Promise<RecipeStub[]> {
  return apiGet<RecipeStub[]>('/recipes');
}

// --- ADD THIS LOGIN FUNCTION ---
export async function login(email: string, password: string) {
  return apiPost<{ token: string; user: { id: number; email: string; role: string } }>(
    '/auth/login',
    { email, password }
  );
}

// --- USER PROFILE API FUNCTIONS (Unified Schema) ---
export interface UnifiedUserProfile {
  id: number;
  userId: number;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  recipesCreated: number;
  bakesCompleted: number;
  totalBakeTimeMinutes: number;
  advancedFeaturesUsed: string[];
  preferredDifficulty?: string | null;
  averageSessionMinutes: number;
  lastActiveAt: string;
  showAdvancedFields: boolean;
  autoSaveEnabled: boolean;
  defaultHydration: number;
  preferredSaltPct: number;
  expandStepsOnLoad: boolean;
  showIngredientHelp: boolean;
  createdAt: string;
  updatedAt: string;
  actions?: UserAction[];
  userPreferences?: UserPreference[];
}

export interface UserAction {
  id: number;
  userId: number;
  profileId: number;
  action: string;
  details?: any;
  sessionId?: string | null;
  timestamp: string;
}

export interface UserPreference {
  id: number;
  userId: number;
  profileId: number;
  key: string;
  value: string;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  // Structured preferences
  showAdvancedFields: boolean;
  autoSaveEnabled: boolean;
  defaultHydration: number;
  preferredSaltPct: number;
  expandStepsOnLoad: boolean;
  showIngredientHelp: boolean;
  // Complex preferences as key-value pairs
  [key: string]: any;
}

// Get unified user profile (includes experience + preferences)
export async function getUserProfile(): Promise<UnifiedUserProfile> {
  return apiGet<UnifiedUserProfile>('/userProfile/profile');
}

// Update unified user profile
export async function updateUserProfile(data: Partial<UnifiedUserProfile>): Promise<UnifiedUserProfile> {
  return apiPut<UnifiedUserProfile>('/userProfile/profile', data);
}

// Track user action (simplified)
export async function trackUserAction(action: string, details?: any, sessionId?: string): Promise<UserAction> {
  return apiPost<UserAction>('/userProfile/actions', { action, details, sessionId });
}

// Get user preferences (structured + complex)
export async function getUserPreferences(): Promise<UserPreferences> {
  return apiGet<UserPreferences>('/userProfile/preferences');
}

// Update user preferences
export async function updateUserPreferences(preferences: Partial<UserPreferences>): Promise<{ success: boolean; updated: number }> {
  return apiPut<{ success: boolean; updated: number }>('/userProfile/preferences', preferences);
}

// --- Function to get recipe form fields ---
export async function getRecipeFields(): Promise<FieldMeta[]> {
  // Assuming your backend has an endpoint like '/meta/recipe-fields' or similar
  // The `metaRouter` in your backend is mounted at `/api/meta`
  return apiGet<FieldMeta[]>('/meta/recipe-fields');
}

// --- Function to create a new recipe ---
export async function createRecipe(data: RecipeFormData): Promise<RecipeStub> { // Assuming it returns the created recipe stub or full recipe
  // The `recipesRouter` in your backend is mounted at `/api`, so this posts to `/api/recipes`
  return apiPost<RecipeStub>('/recipes', data);
}

// --- EXISTING FUNCTIONS ---
export async function updateStepTemplate(
  id: number,
  data: { name: string; description: string }
): Promise<StepTemplate> {
  return apiPut(`/steps/templates/${id}`, data);
}

// ... existing generic functions ...
export async function apiGet<T>(url: string): Promise<T> {
  try {
    const response = await api.get<T>(url);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
export async function apiPost<T>(url: string, data: unknown): Promise<T> {
  try {
    const response = await api.post<T>(url, data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
export async function apiPut<T>(url: string, data: unknown): Promise<T> {
  try {
    const response = await api.put<T>(url, data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
export async function apiDelete<T>(url: string): Promise<T> {
  try {
    const response = await api.delete<T>(url);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export default api;