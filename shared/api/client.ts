/**
 * Platform-agnostic API client for Sourdough app
 * Works with both web (axios) and React Native (axios)
 */

import type { FullRecipe } from '../types/recipe';
import type { Bake } from '../types/bake';

export interface ApiConfig {
  baseURL: string;
  getAuthToken?: () => string | null;
}

export function createApiClient(config: ApiConfig) {
  const { baseURL, getAuthToken } = config;

  /**
   * Generic fetch wrapper with auth
   */
  async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getAuthToken?.();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({
        message: 'Network error',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  return {
    // Recipe endpoints
    recipes: {
      getAll: () => apiFetch<FullRecipe[]>('/recipes'),
      
      getById: (id: number) => apiFetch<FullRecipe>(`/recipes/${id}/full`),
      
      create: (data: Partial<FullRecipe>) =>
        apiFetch<FullRecipe>('/recipes', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      update: (id: number, data: Partial<FullRecipe>) =>
        apiFetch<FullRecipe>(`/recipes/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      
      delete: (id: number) =>
        apiFetch<void>(`/recipes/${id}`, { method: 'DELETE' }),
    },

    // Bake endpoints
    bakes: {
      getAll: () => apiFetch<Bake[]>('/bakes'),
      
      getById: (id: number) => apiFetch<Bake>(`/bakes/${id}`),
      
      create: (data: Partial<Bake>) =>
        apiFetch<Bake>('/bakes', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      update: (id: number, data: Partial<Bake>) =>
        apiFetch<Bake>(`/bakes/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      
      delete: (id: number) =>
        apiFetch<void>(`/bakes/${id}`, { method: 'DELETE' }),
      
      complete: (id: number, data: { rating?: number; notes?: string }) =>
        apiFetch<Bake>(`/bakes/${id}/complete`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
    },

    // Auth endpoints
    auth: {
      login: (credentials: { email: string; password: string }) =>
        apiFetch<{ token: string; user: any }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        }),
      
      register: (data: { email: string; password: string; name?: string }) =>
        apiFetch<{ token: string; user: any }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      googleAuth: (idToken: string) =>
        apiFetch<{ token: string; user: any }>('/auth/oauth/google', {
          method: 'POST',
          body: JSON.stringify({ idToken }),
        }),
    },

    // Meta endpoints (ingredients, categories, templates)
    meta: {
      getIngredients: () => apiFetch<{ ingredients: any[] }>('/meta/ingredients').then(r => r.ingredients),
      getCategories: () => apiFetch<{ categories: any[] }>('/meta/ingredient-categories').then(r => r.categories),
      getTemplates: () => apiFetch<{ templates: any[] }>('/meta/step-templates').then(r => r.templates),
    },
  };
}

// Export type for the API client
export type ApiClient = ReturnType<typeof createApiClient>;
