import { useState, useEffect, useCallback } from 'react';
import { createApiClient } from '../api/client';
import type { Bake } from '../types/bake';

export interface UseBakesOptions {
  autoFetch?: boolean;
  apiBaseUrl?: string;
  getAuthToken?: () => string | null;
}

export interface UseBakesReturn {
  bakes: Bake[];
  loading: boolean;
  error: string | null;
  fetchBakes: () => Promise<void>;
  createBake: (bake: Partial<Bake>) => Promise<Bake>;
  updateBake: (id: number, bake: Partial<Bake>) => Promise<Bake>;
  deleteBake: (id: number) => Promise<void>;
  completeBake: (id: number, data: { rating?: number; notes?: string }) => Promise<Bake>;
  getBakeById: (id: number) => Promise<Bake>;
}

/**
 * Hook for managing bakes with the shared API client
 * 
 * @example
 * ```typescript
 * const { bakes, loading, createBake, completeBake } = useBakes({
 *   autoFetch: true,
 *   apiBaseUrl: process.env.VITE_API_BASE_URL,
 *   getAuthToken: () => localStorage.getItem('token')
 * });
 * ```
 */
export function useBakes(options: UseBakesOptions = {}): UseBakesReturn {
  const { 
    autoFetch = false, 
    apiBaseUrl = 'http://localhost:3000/api',
    getAuthToken 
  } = options;

  const [bakes, setBakes] = useState<Bake[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create API client instance
  const apiClient = createApiClient({
    baseURL: apiBaseUrl,
    getAuthToken
  });

  const fetchBakes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.bakes.getAll();
      setBakes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bakes';
      setError(errorMessage);
      console.error('Error fetching bakes:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const createBake = useCallback(async (bake: Partial<Bake>) => {
    setLoading(true);
    setError(null);
    try {
      const newBake = await apiClient.bakes.create(bake);
      setBakes((prev: Bake[]) => [...prev, newBake]);
      return newBake;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bake';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const updateBake = useCallback(async (id: number, bake: Partial<Bake>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedBake = await apiClient.bakes.update(id, bake);
      setBakes((prev: Bake[]) => prev.map((b: Bake) => b.id === id ? updatedBake : b));
      return updatedBake;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update bake';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const deleteBake = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.bakes.delete(id);
      setBakes((prev: Bake[]) => prev.filter((b: Bake) => b.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete bake';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const completeBake = useCallback(async (id: number, data: { rating?: number; notes?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const completedBake = await apiClient.bakes.complete(id, data);
      setBakes((prev: Bake[]) => prev.map((b: Bake) => b.id === id ? completedBake : b));
      return completedBake;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete bake';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const getBakeById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const bake = await apiClient.bakes.getById(id);
      return bake;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bake';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchBakes();
    }
  }, [autoFetch, fetchBakes]);

  return {
    bakes,
    loading,
    error,
    fetchBakes,
    createBake,
    updateBake,
    deleteBake,
    completeBake,
    getBakeById
  };
}
