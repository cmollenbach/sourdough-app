// Database-Driven User Experience Dashboard
// frontend/src/components/Dashboard/UserExperienceDashboard.tsx

import React, { useEffect, useState } from 'react';
import { useUserExperience } from '../../hooks/useUserExperience';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';
import { DatabaseDrivenRecommendations } from '../Recipe/DatabaseDrivenRecommendations';

interface UserStats {
  totalRecipes: number;
  totalBakes: number;
  averageHydration: number;
  favoriteStepTypes: string[];
  recentActivity: string[];
  achievements: string[];
}

export const UserExperienceDashboard: React.FC = () => {
  const { 
    userExperience, 
    isLoading: userLoading, 
    trackAction 
  } = useUserExperience();
  
  const { 
    preferences, 
    isLoading: prefsLoading, 
    loadPreferences 
  } = useUserPreferencesStore();
  
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showAdvancedView, setShowAdvancedView] = useState(false);

  useEffect(() => {
    loadPreferences();
    generateUserStats();
  }, [loadPreferences, userExperience]);

  const generateUserStats = () => {
    const stats: UserStats = {
      totalRecipes: userExperience.recipesCreated || 0,
      totalBakes: userExperience.bakesCompleted || 0,
      averageHydration: preferences.favoriteHydration || 75,
      favoriteStepTypes: ['Autolyse', 'Bulk Fermentation', 'Final Proof'],
      recentActivity: [
        'Created "Weekend Sourdough" recipe',
        'Completed bake #12',
        'Used advanced hydration calculator',
        'Saved custom flour blend'
      ],
      achievements: getAchievements(userExperience)
    };
    
    setUserStats(stats);
  };

  const getAchievements = (experience: any) => {
    const achievements = [];
    
    if (experience.recipesCreated >= 1) achievements.push('🎯 First Recipe Created');
    if (experience.bakesCompleted >= 1) achievements.push('🍞 First Bake Completed');
    if (experience.recipesCreated >= 5) achievements.push('📝 Recipe Creator');
    if (experience.bakesCompleted >= 10) achievements.push('👨‍🍳 Experienced Baker');
    if (experience.recipesCreated >= 10) achievements.push('🔬 Recipe Developer');
    if (experience.bakesCompleted >= 25) achievements.push('🏆 Master Baker');
    
    const level = experience.level || 'beginner';
    if (level === 'intermediate') achievements.push('📈 Intermediate Baker');
    if (level === 'advanced') achievements.push('⭐ Advanced Baker');
    
    if (experience.preferences?.showAdvancedFields) {
      achievements.push('🔧 Power User');
    }
    
    return achievements;
  };

  const handleViewToggle = async () => {
    setShowAdvancedView(!showAdvancedView);
    await trackAction('advanced_feature', 'dashboard_view_toggle');
  };

  if (userLoading || prefsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Sourdough Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Database-driven personalization based on your baking history
            </p>
          </div>
          <button
            onClick={handleViewToggle}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showAdvancedView ? 'Simple View' : 'Advanced View'}
          </button>
        </div>

        {/* Quick Stats */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userStats.totalRecipes}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Recipes Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userStats.totalBakes}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Bakes Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userStats.averageHydration}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Hydration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {userExperience.level || 'Beginner'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Experience Level</div>
            </div>
          </div>
        )}
      </div>

      {/* Achievements */}
      {userStats && userStats.achievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Achievements
          </h3>
          <div className="flex flex-wrap gap-2">
            {userStats.achievements.map((achievement, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium"
              >
                {achievement}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Database-Driven Recommendations */}
      <DatabaseDrivenRecommendations />

      {/* Advanced Features (conditional) */}
      {showAdvancedView && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Advanced Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium mb-2">Quick Ratio Presets</h4>
              <div className="space-y-2">
                {preferences.quickRatioPresets.map((preset, index) => (
                  <div key={index} className="text-sm">
                    {preset.name}: {preset.hydration}% / {preset.salt}%
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium mb-2">Database Preferences</h4>
              <div className="space-y-1 text-sm">
                <div>Auto-save: {preferences.autosaveEnabled ? 'Enabled' : 'Disabled'}</div>
                <div>Show Help: {preferences.showIngredientHelp ? 'Yes' : 'No'}</div>
                <div>Expand Steps: {preferences.expandStepsOnLoad ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {userStats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {userStats.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{activity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database Status Indicator */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <div>
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
              Database-Driven Experience Active
            </h4>
            <p className="text-xs text-green-700 dark:text-green-300">
              Your preferences, progress, and recommendations are being saved and 
              personalized based on your baking history. All data persists between sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
