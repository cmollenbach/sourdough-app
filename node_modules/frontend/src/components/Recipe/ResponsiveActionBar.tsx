// c:\Sourdough-app\sourdough-app\frontend\src\components\Recipe\ResponsiveActionBar.tsx
import * as React from 'react';

interface ResponsiveActionBarProps {
  onSave: () => void;
  onStartBake: () => void;
  isSavingOrLoading: boolean; // Combined state for disabling buttons
  canStartBake: boolean;
  // Add any other relevant props, e.g., isDirty
}

const ResponsiveActionBar: React.FC<ResponsiveActionBarProps> = ({
  onSave,
  onStartBake,
  isSavingOrLoading,
  canStartBake,
}) => {
  return (
    <div
      className="bg-surface-elevated border border-border rounded-lg shadow-card 
                 sm:fixed sm:bottom-0 sm:left-0 sm:right-0 sm:z-50 sm:rounded-none sm:border-x-0 sm:border-b-0
                 md:sticky md:top-0 md:z-40 md:rounded-lg md:border"
    >
      {/* Enhanced mobile layout with better touch targets and safe areas */}
      <div className="container mx-auto px-4 py-3 sm:py-4 md:py-3">
        <div className="flex flex-col sm:flex-row justify-center items-stretch gap-3 sm:gap-4 md:justify-end">
          <button
            onClick={onSave}
            disabled={isSavingOrLoading}
            className="btn-primary min-h-[48px] sm:min-h-[44px] px-6 font-medium flex items-center justify-center gap-2 order-1"
          >
            {isSavingOrLoading ? (
              <>
                <span className="animate-spin text-lg">⚙️</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="text-lg">💾</span>
                <span>Save Recipe</span>
              </>
            )}
          </button>
          
          <button
            onClick={onStartBake}
            disabled={!canStartBake || isSavingOrLoading}
            className={`min-h-[48px] sm:min-h-[44px] px-6 font-medium flex items-center justify-center gap-2 transition-all duration-200 order-2 ${
              canStartBake && !isSavingOrLoading
                ? 'btn-success hover:scale-105'
                : 'bg-secondary-200 text-secondary-500 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="text-lg">🚀</span>
            <span>Start Bake</span>
          </button>
        </div>
      </div>
      
      {/* Mobile safe area padding */}
      <div className="h-4 sm:block md:hidden"></div>
    </div>
  );
};

export default ResponsiveActionBar; 