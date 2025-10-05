// hooks/useUserExperience.ts - Unified user profile and experience tracking
import { useState, useEffect } from 'react';
import { 
  getUserProfile, 
  updateUserProfile, 
  trackUserAction, 
  getUserPreferences, 
  updateUserPreferences,
  type UnifiedUserProfile,
  type UserPreferences 
} from '../utils/api';

export type UserExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

interface UserExperienceData {
  level: UserExperienceLevel;
  recipesCreated: number;
  bakesCompleted: number;
  totalBakeTimeMinutes: number;
  advancedFeaturesUsed: string[];
  averageSessionMinutes: number;
  lastActiveAt: string;
  preferences: UserPreferences;
}

export function useUserExperience() {
  const [userExperience, setUserExperience] = useState<UserExperienceData>({
    level: 'beginner',
    recipesCreated: 0,
    bakesCompleted: 0,
    totalBakeTimeMinutes: 0,
    advancedFeaturesUsed: [],
    averageSessionMinutes: 0,
    lastActiveAt: new Date().toISOString(),
    preferences: {
      showAdvancedFields: false,
      autoSaveEnabled: true,
      defaultHydration: 75.0,
      preferredSaltPct: 2.0,
      expandStepsOnLoad: false,
      showIngredientHelp: true
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load unified user profile data from database
  useEffect(() => {
    const loadUserExperience = async () => {
      try {
        setIsLoading(true);
        const profile: UnifiedUserProfile = await getUserProfile();
        
        // Get preferences separately (they're part of the unified model now)
        const preferences: UserPreferences = await getUserPreferences();
        
        setUserExperience({
          level: profile.experienceLevel,
          recipesCreated: profile.recipesCreated,
          bakesCompleted: profile.bakesCompleted,
          totalBakeTimeMinutes: profile.totalBakeTimeMinutes,
          advancedFeaturesUsed: profile.advancedFeaturesUsed,
          averageSessionMinutes: profile.averageSessionMinutes,
          lastActiveAt: profile.lastActiveAt,
          preferences
        });
        setError(null);
      } catch (err) {
        console.warn('Failed to load user profile from database, using defaults:', err);
        // Fall back to localStorage if database is unavailable
        const stored = localStorage.getItem('sourdough-user-experience');
        if (stored) {
          try {
            const localData = JSON.parse(stored);
            setUserExperience(localData);
          } catch {
            // Keep default values if localStorage is corrupted
          }
        }
        setError('Using offline mode for user preferences');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserExperience();
  }, []);

  // Track actions that contribute to experience (unified database)
  const trackAction = async (
    action: 'recipe_created' | 'bake_completed' | 'advanced_feature' | 'quick_preset_used' | 'custom_preset_created', 
    feature?: string | Record<string, any>
  ) => {
    try {
      // Handle different parameter formats for backward compatibility
      const details = typeof feature === 'string' ? { feature } : feature;
      
      // Send to unified database for persistence and analytics
      await trackUserAction(action, details);

      // Update local state optimistically
      const updated = { ...userExperience };
      
      switch (action) {
        case 'recipe_created':
          updated.recipesCreated += 1;
          break;
        case 'bake_completed':
          updated.bakesCompleted += 1;
          break;
        case 'advanced_feature':
        case 'quick_preset_used':
        case 'custom_preset_created':
          const featureName = typeof feature === 'string' ? feature : action;
          if (featureName && !updated.advancedFeaturesUsed.includes(featureName)) {
            updated.advancedFeaturesUsed.push(featureName);
          }
          break;
      }
      
      setUserExperience(updated);
      
      // Also update localStorage as backup
      localStorage.setItem('sourdough-user-experience', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to track action in database:', err);
      // Fall back to localStorage-only tracking
      const updated = { ...userExperience };
      
      switch (action) {
        case 'recipe_created':
          updated.recipesCreated += 1;
          break;
        case 'bake_completed':
          updated.bakesCompleted += 1;
          break;
        case 'advanced_feature':
        case 'quick_preset_used':
        case 'custom_preset_created':
          const featureName = typeof feature === 'string' ? feature : action;
          if (featureName && !updated.advancedFeaturesUsed.includes(featureName)) {
            updated.advancedFeaturesUsed.push(featureName);
          }
          break;
      }
      
      setUserExperience(updated);
      localStorage.setItem('sourdough-user-experience', JSON.stringify(updated));
    }
  };

  // Update user preferences in unified database
  const updatePrefs = async (newPreferences: Partial<UserPreferences>) => {
    try {
      await updateUserPreferences(newPreferences);
      setUserExperience(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...newPreferences }
      }));
    } catch (err) {
      console.error('Failed to update preferences in database:', err);
      // Fall back to localStorage
      const updated = {
        ...userExperience,
        preferences: { ...userExperience.preferences, ...newPreferences }
      };
      setUserExperience(updated);
      localStorage.setItem('sourdough-user-experience', JSON.stringify(updated));
    }
  };

  // Get smart defaults based on user level
  const getSmartDefaults = () => {
    switch (userExperience.level) {
      case 'beginner':
        return {
          showAdvancedByDefault: false,
          expandStepsOnLoad: false,
          showGuidance: true,
          autoSave: true,
          recommendedRecipes: ['Base Template', 'My First Sourdough Loaf'],
          defaultHydration: 75,
          showTimers: true,
          contextualHelp: true
        };
      case 'intermediate':
        return {
          showAdvancedByDefault: false,
          expandStepsOnLoad: true,
          showGuidance: false,
          autoSave: true,
          recommendedRecipes: ['Simple Whole Wheat', 'Same-Day Sourdough'],
          defaultHydration: 78,
          showTimers: true,
          contextualHelp: false
        };
      case 'advanced':
        return {
          showAdvancedByDefault: true,
          expandStepsOnLoad: true,
          showGuidance: false,
          autoSave: false,
          recommendedRecipes: ['High Hydration Challenge', 'Sourdough Panettone'],
          defaultHydration: 80,
          showTimers: false,
          contextualHelp: false
        };
    }
  };

  return {
    userExperience,
    isLoading,
    error,
    trackAction,
    updatePreferences: updatePrefs,
    getSmartDefaults,
    // Backward compatibility properties
    userLevel: userExperience.level,
    getUserStats: () => ({
      level: userExperience.level,
      recipesCreated: userExperience.recipesCreated,
      bakesCompleted: userExperience.bakesCompleted,
      totalBakeTimeMinutes: userExperience.totalBakeTimeMinutes,
      advancedFeaturesUsed: userExperience.advancedFeaturesUsed.length
    }),
    isAdvancedUser: userExperience.level === 'advanced',
    setUserLevel: async (level: UserExperienceLevel) => {
      try {
        await updateUserProfile({
          experienceLevel: level
        });
        setUserExperience(prev => ({
          ...prev,
          level,
          lastActiveAt: new Date().toISOString()
        }));
      } catch (err) {
        console.error('Failed to update user level in database:', err);
        // Fall back to local update
        const updated = {
          ...userExperience,
          level,
          lastActiveAt: new Date().toISOString()
        };
        setUserExperience(updated);
        localStorage.setItem('sourdough-user-experience', JSON.stringify(updated));
      }
    }
  };
}
