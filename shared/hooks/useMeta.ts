import { useState, useEffect, useCallback } from 'react';
import { createApiClient } from '../api/client';

export interface UseMetaOptions {
  autoFetch?: boolean;
  apiBaseUrl?: string;
  getAuthToken?: () => string | null;
}

export interface UseMetaReturn {
  ingredients: any[];
  categories: any[];
  templates: any[];
  loading: boolean;
  error: string | null;
  fetchIngredients: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchAll: () => Promise<void>;
}

/**
 * Hook for managing meta data (ingredients, categories, templates) with the shared API client
 * 
 * @example
 * ```typescript
 * const { ingredients, categories, templates, loading } = useMeta({
 *   autoFetch: true,
 *   apiBaseUrl: process.env.VITE_API_BASE_URL,
 *   getAuthToken: () => localStorage.getItem('token')
 * });
 * ```
 */
export function useMeta(options: UseMetaOptions = {}): UseMetaReturn {
  const { 
    autoFetch = false, 
    apiBaseUrl = 'http://localhost:3000/api',
    getAuthToken 
  } = options;

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create API client instance
  const apiClient = createApiClient({
    baseURL: apiBaseUrl,
    getAuthToken
  });

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.meta.getIngredients();
      setIngredients(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ingredients';
      setError(errorMessage);
      console.error('Error fetching ingredients:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.meta.getCategories();
      setCategories(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.meta.getTemplates();
      setTemplates(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(errorMessage);
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ingredientsData, categoriesData, templatesData] = await Promise.all([
        apiClient.meta.getIngredients(),
        apiClient.meta.getCategories(),
        apiClient.meta.getTemplates()
      ]);
      setIngredients(ingredientsData);
      setCategories(categoriesData);
      setTemplates(templatesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch meta data';
      setError(errorMessage);
      console.error('Error fetching meta data:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAll();
    }
  }, [autoFetch, fetchAll]);

  return {
    ingredients,
    categories,
    templates,
    loading,
    error,
    fetchIngredients,
    fetchCategories,
    fetchTemplates,
    fetchAll
  };
}
