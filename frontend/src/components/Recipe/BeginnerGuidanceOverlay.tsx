// BeginnerGuidanceOverlay.tsx - Contextual help for new users
import React, { useState } from 'react';

export interface BeginnerGuidanceProps {
  showAdvanced: boolean;
  isFirstTime?: boolean;
  currentStep?: string;
}

export default function BeginnerGuidanceOverlay({ 
  showAdvanced, 
  isFirstTime = false,
  currentStep 
}: BeginnerGuidanceProps) {
  const [showHelp, setShowHelp] = useState(isFirstTime);
  const [currentTip, setCurrentTip] = useState(0);

  const beginnerTips = [
    {
      title: "Start Simple",
      content: "Keep 'Advanced Mode' OFF until you're comfortable with basic sourdough. This hides complex options.",
      highlight: "advanced-toggle"
    },
    {
      title: "Use Templates", 
      content: "Choose 'My First Sourdough Loaf' from the recipe dropdown. It's designed for beginners.",
      highlight: "recipe-select"
    },
    {
      title: "Follow Step Order",
      content: "Steps are in chronological order. Each step shows only the ingredients you need for that phase.",
      highlight: "steps-column"
    },
    {
      title: "Start Your First Bake",
      content: "Once you're happy with the recipe, click 'Start Bake' to begin your guided baking journey.",
      highlight: "start-bake-button"
    }
  ];

  if (!showHelp || showAdvanced) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Welcome to Sourdough!</h3>
          <button 
            onClick={() => setShowHelp(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full mr-2"></div>
            <h4 className="font-medium text-gray-900">{beginnerTips[currentTip].title}</h4>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            {beginnerTips[currentTip].content}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {beginnerTips.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentTip ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {currentTip > 0 && (
              <button 
                onClick={() => setCurrentTip(currentTip - 1)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            {currentTip < beginnerTips.length - 1 ? (
              <button 
                onClick={() => setCurrentTip(currentTip + 1)}
                className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={() => setShowHelp(false)}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                Start Baking!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
