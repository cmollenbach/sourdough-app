import axios from "axios";
import type { StepTemplate } from "../types/recipeLayout"; // Changed to recipeLayout
import type { RecipeStub } from "../types/recipe"; // Added for recipe list

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

// --- EXISTING FUNCTIONS ---
export async function updateStepTemplate(
  id: number,
  data: { name: string; description: string }
): Promise<StepTemplate> {
  return apiPut(`/steps/templates/${id}`, data);
}

// ... existing generic functions ...
export async function apiGet<T>(url: string): Promise<T> {
  const response = await api.get<T>(url);
  return response.data;
}
export async function apiPost<T>(url: string, data: unknown): Promise<T> {
  const response = await api.post<T>(url, data);
  return response.data;
}
export async function apiPut<T>(url: string, data: unknown): Promise<T> {
  const response = await api.put<T>(url, data);
  return response.data;
}
export async function apiDelete<T>(url: string): Promise<T> {
  const response = await api.delete<T>(url);
  return response.data;
}

export default api;