// AdvancedUserFeatures.tsx - Enhanced power user interface
import React from 'react';
import { useUserExperience } from '../../hooks/useUserExperience';

export interface AdvancedUserFeaturesProps {
  showAdvanced: boolean;
  onToggleAdvanced: (show: boolean) => void;
  currentRecipe?: any;
  onQuickRatio?: (hydration: number) => void;
}

export default function AdvancedUserFeatures({ 
  showAdvanced, 
  onToggleAdvanced,
  currentRecipe,
  onQuickRatio
}: AdvancedUserFeaturesProps) {
  const { userExperience, trackAction } = useUserExperience();
  
  const handleToggleAdvanced = (checked: boolean) => {
    if (checked) {
      trackAction('advanced_feature', 'advanced_mode_enabled');
    }
    onToggleAdvanced(checked);
  };

  const handleQuickRatio = (hydration: number) => {
    trackAction('advanced_feature', 'quick_ratio_used');
    onQuickRatio?.(hydration);
  };
  return (
    <div className="bg-surface-elevated p-3 rounded-lg shadow-card border border-border mb-4">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        
        {/* Left side: Mode indicators */}
        <div className="flex items-center gap-3">
          {/* User level indicator */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
            userExperience.level === 'beginner' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : userExperience.level === 'intermediate'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}>
            {userExperience.level === 'beginner' ? '🌱 Beginner' : 
             userExperience.level === 'intermediate' ? '🧑‍🍳 Baker' : '👨‍🎓 Expert'}
          </span>

          {/* Advanced Mode Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary text-sm">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={showAdvanced}
                onChange={(e) => handleToggleAdvanced(e.target.checked)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${showAdvanced ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showAdvanced ? 'transform translate-x-full' : ''}`}></div>
            </div>
            <span className="font-medium">Advanced Mode</span>
          </label>

          {/* Mode indicator badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            showAdvanced 
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            {showAdvanced ? 'Expert' : 'Simplified'}
          </span>
        </div>

        {/* Right side: Quick actions for advanced users */}
        {showAdvanced && (
          <div className="flex items-center gap-2 text-xs">
            {/* Quick ratio presets */}
            <div className="flex items-center gap-1">
              <span className="text-text-secondary">Quick ratios:</span>
              <button 
                onClick={() => handleQuickRatio(75)}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
              >
                75% Hydration
              </button>
              <button 
                onClick={() => handleQuickRatio(80)}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
              >
                80% Hydration
              </button>
              <button 
                onClick={() => handleQuickRatio(0)}
                className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs transition-colors"
                title="Set custom hydration percentage"
              >
                Custom...
              </button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
