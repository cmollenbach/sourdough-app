// Store for database-driven recipe preferences and smart recommendations
// frontend/src/store/userPreferencesStore.ts

import { create } from 'zustand';
import { apiGet, apiPost, apiPut } from '../utils/api';

export interface RecipePreferences {
  favoriteHydration: number;
  preferredStepTemplates: number[]; // IDs of frequently used templates
  defaultRecipeSize: number; // Total weight in grams
  preferredSaltPercentage: number;
  quickRatioPresets: Array<{
    name: string;
    hydration: number;
    salt: number;
  }>;
  recentIngredients: number[]; // IDs of recently used ingredients
  skipStepTypes: string[]; // Step types user typically skips (e.g., 'AUTOLYSE')
  autosaveEnabled: boolean;
  showIngredientHelp: boolean;
  expandStepsOnLoad: boolean;
}

interface UserPreferencesState {
  preferences: RecipePreferences;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadPreferences: () => Promise<void>;
  updatePreference: <K extends keyof RecipePreferences>(
    key: K, 
    value: RecipePreferences[K]
  ) => Promise<void>;
  addQuickRatioPreset: (preset: { name: string; hydration: number; salt: number }) => Promise<void>;
  removeQuickRatioPreset: (index: number) => Promise<void>;
  trackIngredientUsage: (ingredientId: number) => Promise<void>;
  trackStepTemplateUsage: (templateId: number) => Promise<void>;
  getSmartRecommendations: () => {
    suggestedHydration: number;
    suggestedTemplates: number[];
    suggestedIngredients: number[];
  };
}

const defaultPreferences: RecipePreferences = {
  favoriteHydration: 75,
  preferredStepTemplates: [],
  defaultRecipeSize: 1000,
  preferredSaltPercentage: 2,
  quickRatioPresets: [
    { name: "Classic", hydration: 75, salt: 2 },
    { name: "High Hydration", hydration: 80, salt: 2.2 },
    { name: "Beginner Friendly", hydration: 70, salt: 1.8 }
  ],
  recentIngredients: [],
  skipStepTypes: [],
  autosaveEnabled: true,
  showIngredientHelp: true,
  expandStepsOnLoad: false
};

export const useUserPreferencesStore = create<UserPreferencesState>((set, get) => ({
  preferences: defaultPreferences,
  isLoading: false,
  error: null,

  loadPreferences: async () => {
    set({ isLoading: true, error: null });
    try {
      const prefs = await apiGet('/user-experience/preferences') as Record<string, string>;
      
      // Parse the preferences, falling back to defaults for missing values
      const loadedPreferences: RecipePreferences = {
        ...defaultPreferences,
        ...Object.keys(prefs).reduce((acc, key) => {
          try {
            acc[key as keyof RecipePreferences] = JSON.parse(prefs[key]);
          } catch {
            // If it's not JSON, use the raw value
            acc[key as keyof RecipePreferences] = prefs[key] as any;
          }
          return acc;
        }, {} as Partial<RecipePreferences>)
      };

      set({ preferences: loadedPreferences, isLoading: false });
    } catch (error) {
      console.error('Failed to load preferences from database:', error);
      set({ error: 'Failed to load preferences', isLoading: false });
      
      // Fall back to localStorage
      const stored = localStorage.getItem('sourdough-user-preferences');
      if (stored) {
        try {
          const localPrefs = JSON.parse(stored);
          set({ preferences: { ...defaultPreferences, ...localPrefs } });
        } catch {
          // Keep defaults if localStorage is corrupted
        }
      }
    }
  },

  updatePreference: async (key, value) => {
    const { preferences } = get();
    const newPreferences = { ...preferences, [key]: value };
    
    // Optimistic update
    set({ preferences: newPreferences });
    
    try {
      await apiPut('/user-experience/preferences', {
        [key]: JSON.stringify(value)
      });
      
      // Also update localStorage as backup
      localStorage.setItem('sourdough-user-preferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Failed to update preference in database:', error);
      // Still update localStorage for offline functionality
      localStorage.setItem('sourdough-user-preferences', JSON.stringify(newPreferences));
    }
  },

  addQuickRatioPreset: async (preset) => {
    const { preferences, updatePreference } = get();
    const newPresets = [...preferences.quickRatioPresets, preset];
    await updatePreference('quickRatioPresets', newPresets);
  },

  removeQuickRatioPreset: async (index) => {
    const { preferences, updatePreference } = get();
    const newPresets = preferences.quickRatioPresets.filter((_, i) => i !== index);
    await updatePreference('quickRatioPresets', newPresets);
  },

  trackIngredientUsage: async (ingredientId) => {
    const { preferences, updatePreference } = get();
    const recentIngredients = [
      ingredientId,
      ...preferences.recentIngredients.filter(id => id !== ingredientId)
    ].slice(0, 20); // Keep only last 20

    await updatePreference('recentIngredients', recentIngredients);
  },

  trackStepTemplateUsage: async (templateId) => {
    const { preferences, updatePreference } = get();
    const preferredTemplates = [
      templateId,
      ...preferences.preferredStepTemplates.filter(id => id !== templateId)
    ].slice(0, 10); // Keep only top 10

    await updatePreference('preferredStepTemplates', preferredTemplates);
  },

  getSmartRecommendations: () => {
    const { preferences } = get();
    
    return {
      suggestedHydration: preferences.favoriteHydration,
      suggestedTemplates: preferences.preferredStepTemplates.slice(0, 5),
      suggestedIngredients: preferences.recentIngredients.slice(0, 10)
    };
  }
}));
