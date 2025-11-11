import { useState, useEffect, useCallback } from 'react';
import { createApiClient } from '../api/client';
import type { FullRecipe } from '../types/recipe';

export interface UseRecipesOptions {
  autoFetch?: boolean;
  apiBaseUrl?: string;
  getAuthToken?: () => string | null;
}

export interface UseRecipesReturn {
  recipes: FullRecipe[];
  loading: boolean;
  error: string | null;
  fetchRecipes: () => Promise<void>;
  createRecipe: (recipe: Omit<FullRecipe, 'id' | 'userId'>) => Promise<FullRecipe>;
  updateRecipe: (id: number, recipe: Partial<FullRecipe>) => Promise<FullRecipe>;
  deleteRecipe: (id: number) => Promise<void>;
  getRecipeById: (id: number) => Promise<FullRecipe>;
}

/**
 * Hook for managing recipes with the shared API client
 * 
 * @example
 * ```typescript
 * const { recipes, loading, fetchRecipes, createRecipe } = useRecipes({
 *   autoFetch: true,
 *   apiBaseUrl: process.env.VITE_API_BASE_URL,
 *   getAuthToken: () => localStorage.getItem('token')
 * });
 * ```
 */
export function useRecipes(options: UseRecipesOptions = {}): UseRecipesReturn {
  const { 
    autoFetch = false, 
    apiBaseUrl = 'http://localhost:3000/api',
    getAuthToken 
  } = options;

  const [recipes, setRecipes] = useState<FullRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create API client instance
  const apiClient = createApiClient({
    baseURL: apiBaseUrl,
    getAuthToken
  });

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.recipes.getAll();
      setRecipes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recipes';
      setError(errorMessage);
      console.error('Error fetching recipes:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const createRecipe = useCallback(async (recipe: Omit<FullRecipe, 'id' | 'userId'>) => {
    setLoading(true);
    setError(null);
    try {
      const newRecipe = await apiClient.recipes.create(recipe);
      setRecipes((prev: FullRecipe[]) => [...prev, newRecipe]);
      return newRecipe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create recipe';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const updateRecipe = useCallback(async (id: number, recipe: Partial<FullRecipe>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedRecipe = await apiClient.recipes.update(id, recipe);
      setRecipes((prev: FullRecipe[]) => prev.map((r: FullRecipe) => r.id === id ? updatedRecipe : r));
      return updatedRecipe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recipe';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const deleteRecipe = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.recipes.delete(id);
      setRecipes((prev: FullRecipe[]) => prev.filter((r: FullRecipe) => r.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recipe';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const getRecipeById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const recipe = await apiClient.recipes.getById(id);
      return recipe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recipe';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchRecipes();
    }
  }, [autoFetch, fetchRecipes]);

  return {
    recipes,
    loading,
    error,
    fetchRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipeById
  };
}
