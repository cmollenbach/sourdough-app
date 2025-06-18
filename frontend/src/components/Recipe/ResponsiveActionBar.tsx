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
      className="bg-surface-elevated p-4 border border-border rounded-lg shadow-card 
                 sm:fixed sm:bottom-0 sm:left-0 sm:right-0 sm:z-40 
                 md:sticky md:top-0 md:z-40"
      // Note: shadow-card replaces platform-specific shadows like shadow-top-md or md:shadow-md for consistency with RecipeControls
    >
      <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center gap-2">
        <button
          onClick={onSave}
          disabled={isSavingOrLoading}
          className="btn-primary w-full" // Full width always
        >
          {isSavingOrLoading ? 'Saving...' : 'Update / Save'}
        </button>
        <button
          onClick={onStartBake}
          disabled={!canStartBake || isSavingOrLoading}
          className="btn-secondary w-full" // Full width always
        >
          Start Bake
        </button>
      </div>
    </div>
  );
};

export default ResponsiveActionBar; 