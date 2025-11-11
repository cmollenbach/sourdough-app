/**
 * Shared React hooks for Sourdough app
 * Platform-agnostic hooks that work with both web and mobile
 */

export { useRecipes } from './useRecipes';
export { useBakes } from './useBakes';
export { useAuth } from './useAuth';
export { useMeta } from './useMeta';

// Re-export types for convenience
export type { UseRecipesOptions, UseRecipesReturn } from './useRecipes';
export type { UseBakesOptions, UseBakesReturn } from './useBakes';
export type { UseAuthOptions, UseAuthReturn } from './useAuth';
export type { UseMetaOptions, UseMetaReturn } from './useMeta';
