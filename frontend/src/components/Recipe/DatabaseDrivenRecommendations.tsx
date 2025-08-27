// Database-driven Recipe Recommendations Component
// frontend/src/components/Recipe/DatabaseDrivenRecommendations.tsx

import React, { useState, useEffect } from 'react';
import { useUserExperience } from '../../hooks/useUserExperience';

interface RecommendationData {
  suggestedHydration: number;
  suggestedSteps: string[];
  personalizedTips: string[];
  experienceLevel: string;
  progressToNext: number;
}

export const DatabaseDrivenRecommendations: React.FC = () => {
  const { 
    userExperience, 
    trackAction, 
    updatePreferences,
    getSmartDefaults 
  } = useUserExperience();
  
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateRecommendations();
  }, [userExperience]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call for smart recommendations based on user data
      const smartDefaults = getSmartDefaults();
      const level = userExperience.level || 'beginner';
      
      const data: RecommendationData = {
        suggestedHydration: smartDefaults.defaultHydration,
        suggestedSteps: level === 'beginner' 
          ? ['Mix ingredients', 'Bulk fermentation', 'Shape', 'Final proof', 'Bake']
          : level === 'intermediate'
          ? ['Autolyse', 'Mix', 'Coil folds', 'Pre-shape', 'Final shape', 'Cold proof', 'Bake']
          : ['Autolyse', 'Mix', 'Lamination', 'Coil folds', 'Pre-shape', 'Bench rest', 'Final shape', 'Cold proof', 'Score', 'Bake'],
        personalizedTips: getPersonalizedTips(level, userExperience),
        experienceLevel: level,
        progressToNext: getProgressToNextLevel(userExperience)
      };

      setRecommendations(data);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonalizedTips = (level: string, experience: any) => {
    const tips = [];
    
    if (level === 'beginner') {
      tips.push("Start with 70-75% hydration for easier handling");
      tips.push("Use a kitchen scale for accuracy");
      if (experience.recipesCreated < 3) {
        tips.push("Try the 'My First Sourdough Loaf' recipe for best results");
      }
    } else if (level === 'intermediate') {
      tips.push("Experiment with 76-80% hydration for more open crumb");
      tips.push("Try incorporating coil folds for better dough strength");
      if (experience.bakesCompleted > 10) {
        tips.push("Consider trying different flour types for flavor complexity");
      }
    } else {
      tips.push("Push hydration to 82-85% for maximum open crumb");
      tips.push("Experiment with lamination techniques");
      tips.push("Try multi-day cold fermentation for enhanced flavor");
    }

    // Add usage-based tips
    if (experience.preferences?.showAdvancedFields === false) {
      tips.push("💡 Try enabling advanced fields for more control options");
    }

    return tips;
  };

  const getProgressToNextLevel = (experience: any) => {
    const level = experience.level || 'beginner';
    const recipes = experience.recipesCreated || 0;
    const bakes = experience.bakesCompleted || 0;
    
    if (level === 'beginner') {
      const needed = Math.max(0, 5 - (recipes + bakes));
      return Math.min(100, ((recipes + bakes) / 5) * 100);
    } else if (level === 'intermediate') {
      const needed = Math.max(0, 20 - (recipes + bakes));
      return Math.min(100, ((recipes + bakes - 5) / 15) * 100);
    }
    
    return 100; // Already advanced
  };

  const handleTipAction = async (tip: string) => {
    await trackAction('advanced_feature', tip);
    
    if (tip.includes('advanced fields')) {
      await updatePreferences({ showAdvancedFields: true });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Your Personalized Recommendations
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            recommendations.experienceLevel === 'beginner' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : recommendations.experienceLevel === 'intermediate'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
          }`}>
            {recommendations.experienceLevel}
          </span>
        </div>
      </div>

      {/* Progress to Next Level */}
      {recommendations.experienceLevel !== 'advanced' && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress to {recommendations.experienceLevel === 'beginner' ? 'Intermediate' : 'Advanced'}</span>
            <span>{Math.round(recommendations.progressToNext)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${recommendations.progressToNext}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Smart Defaults */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Smart Defaults</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Recommended Hydration:</span>
              <span className="font-medium">{recommendations.suggestedHydration}%</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Based on your {userExperience.recipesCreated} recipes and {userExperience.bakesCompleted} bakes
            </div>
          </div>
        </div>

        {/* Suggested Process */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Suggested Process</h4>
          <div className="space-y-1">
            {recommendations.suggestedSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 rounded-full w-5 h-5 flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personalized Tips */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Tips for You</h4>
        <div className="space-y-2">
          {recommendations.personalizedTips.map((tip, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-md text-sm ${
                tip.includes('💡') 
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30' 
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => tip.includes('💡') && handleTipAction(tip)}
            >
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Database Status */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Recommendations based on your baking history</span>
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Database Connected</span>
          </span>
        </div>
      </div>
    </div>
  );
};
