# **Sourdough App: Ingredient Input Refactoring Plan**

This document provides a complete plan for refactoring the recipe ingredient input system in your sourdough application. The goal is to simplify the user experience by implementing an auto-balancing feature for flour percentages, while also streamlining the frontend code.

### 1\. Objective

To refactor the recipe ingredient input system to be more intuitive for the end-user. The primary goal is to ensure that when a user modifies the percentage of one flour in a recipe step, the percentages of the other flours in the same step automatically adjust, keeping the total flour composition at 100%. This refactoring will be focused exclusively on the frontend.

### 2\. Scope & Core Files

This is a frontend-only refactoring. The backend API and database schema will not require any changes.

* **Primary File for State Logic:** frontend/src/store/recipeBuilderStore.ts  
* **Primary File for UI Interaction:** frontend/src/components/Recipe/StepIngredientRow.tsx

### 3\. Phase 1: Refactor State Management (Zustand Store)

This is the most critical phase. We will implement the core auto-balancing logic within the recipeBuilderStore.

**File:** frontend/src/store/recipeBuilderStore.ts

**Action:** The updateIngredientPercentage function will be replaced with a more intelligent version that handles the proportional balancing of flours.

New Code:  
Replace the entire content of frontend/src/store/recipeBuilderStore.ts with the following code. The new updateIngredientPercentage function contains all the necessary logic.  
import { create } from 'zustand';  
import { Recipe, Step, RecipeIngredient } from '../types/recipe';  
import { immer } from 'zustand/middleware/immer';

interface RecipeBuilderState {  
  recipe: Recipe | null;  
  setRecipe: (recipe: Recipe) \=\> void;  
  updateTarget: (  
    target: keyof Recipe\['targets'\],  
    value: number | string  
  ) \=\> void;  
  updateIngredientPercentage: (  
    stepId: string,  
    ingredientId: string,  
    percentage: number  
  ) \=\> void;  
  // ... other actions from your original store  
}

export const useRecipeBuilderStore \= create\<RecipeBuilderState\>()(  
  immer((set) \=\> ({  
    recipe: null,  
    setRecipe: (recipe) \=\> set({ recipe }),  
    updateTarget: (target, value) \=\> {  
      set((state) \=\> {  
        if (state.recipe) {  
          state.recipe.targets\[target\] \=  
            typeof value \=== 'number' ? value : parseFloat(value) || 0;  
        }  
      });  
    },

    updateIngredientPercentage: (stepId, ingredientId, newPercentage) \=\> {  
      set((state) \=\> {  
        if (\!state.recipe) return;

        const step \= state.recipe.steps.find((s) \=\> s.id \=== stepId);  
        if (\!step) return;

        const targetIngredient \= step.ingredients.find(  
          (ing) \=\> ing.id \=== ingredientId  
        );  
        if (\!targetIngredient) return;

        // If the ingredient is not a flour, update its percentage directly.  
        if (\!targetIngredient.ingredient.isFlour) {  
          targetIngredient.percentage \= Math.max(0, newPercentage);  
          return;  
        }

        // \--- Auto-balancing logic for flours \---

        const floursInStep \= step.ingredients.filter(  
          (ing) \=\> ing.ingredient.isFlour  
        );  
        const otherFlours \= floursInStep.filter(  
          (ing) \=\> ing.id \!== ingredientId  
        );

        // 1\. Clamp the input value for the target flour  
        let clampedPercentage \= Math.max(0, Math.min(100, newPercentage));  
        const oldPercentage \= targetIngredient.percentage;  
        targetIngredient.percentage \= clampedPercentage;

        // 2\. Calculate the difference to redistribute  
        const delta \= oldPercentage \- clampedPercentage;

        // 3\. Distribute the delta among other flours  
        if (otherFlours.length \> 0\) {  
          const totalPercentageOfOtherFlours \= otherFlours.reduce(  
            (sum, ing) \=\> sum \+ ing.percentage,  
            0  
          );

          if (totalPercentageOfOtherFlours \> 0\) {  
            // Distribute proportionally  
            let remainingDelta \= delta;  
            for (const flour of otherFlours) {  
              const proportion \= flour.percentage / totalPercentageOfOtherFlours;  
              const adjustment \= delta \* proportion;  
              flour.percentage \+= adjustment;  
              remainingDelta \-= adjustment;  
            }  
          } else if (delta \!== 0\) {  
            // Distribute equally if all other flours were at 0  
            const adjustment \= delta / otherFlours.length;  
            for (const flour of otherFlours) {  
              flour.percentage \+= adjustment;  
            }  
          }  
        }

        // 4\. Final pass to clamp all values and fix rounding errors  
        let currentTotal \= 0;  
        for (const flour of floursInStep) {  
          flour.percentage \= Math.max(0, Math.min(100, flour.percentage));  
          currentTotal \+= flour.percentage;  
        }

        const roundingError \= 100 \- currentTotal;  
        if (Math.abs(roundingError) \> 1e-9) {  
           // Apply rounding error to the flour that was just edited, as it's the anchor of the change.  
          targetIngredient.percentage \+= roundingError;  
          // Final clamp to be safe  
          targetIngredient.percentage \= Math.max(0, Math.min(100, targetIngredient.percentage));  
        }

      });  
    },  
    // ... include any other actions from your original store here  
  }))  
);

### 4\. Phase 2: Enhance the User Interface (UI)

To create a smooth user experience, we will trigger the auto-balancing logic only when the user has finished editing an input field.

**File:** frontend/src/components/Recipe/StepIngredientRow.tsx

**Action:** We will use local state to manage the input's value while the user is typing (onChange). The global state update that triggers the auto-balancing will only happen when the user clicks away from the input (onBlur).

New Code:  
Replace the entire content of frontend/src/components/Recipe/StepIngredientRow.tsx with the following.  
import React, { useState, useEffect } from 'react';  
import { useRecipeBuilderStore } from '../../store/recipeBuilderStore';  
import { RecipeIngredient } from '../../types/recipe';  
import { formatPercentage } from '../../utils/formatters';

interface StepIngredientRowProps {  
  stepId: string;  
  ingredient: RecipeIngredient;  
}

const StepIngredientRow: React.FC\<StepIngredientRowProps\> \= ({  
  stepId,  
  ingredient,  
}) \=\> {  
  const { updateIngredientPercentage } \= useRecipeBuilderStore();  
  const \[localPercentage, setLocalPercentage\] \= useState\<string\>(  
    ingredient.percentage.toString()  
  );

  useEffect(() \=\> {  
    // Sync local state if the global state changes from an external source (like another input's auto-balancing)  
    setLocalPercentage(ingredient.percentage.toFixed(2).replace(/\\.00$/, ''));  
  }, \[ingredient.percentage\]);

  const handleBlur \= () \=\> {  
    const numericValue \= parseFloat(localPercentage);  
    if (\!isNaN(numericValue)) {  
      updateIngredientPercentage(stepId, ingredient.id, numericValue);  
    } else {  
      // Reset to original value if input is invalid  
      setLocalPercentage(ingredient.percentage.toString());  
    }  
  };

  const handleChange \= (e: React.ChangeEvent\<HTMLInputElement\>) \=\> {  
    setLocalPercentage(e.target.value);  
  };

  return (  
    \<tr className="border-b border-gray-200 dark:border-gray-700"\>  
      \<td className="py-2 px-4"\>{ingredient.ingredient.name}\</td\>  
      \<td className="py-2 px-4"\>  
        \<div className="flex items-center"\>  
          \<input  
            type="number"  
            value={localPercentage}  
            onChange={handleChange}  
            onBlur={handleBlur}  
            className="w-24 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-1 text-right"  
            // Allow decimals for more precise input  
            step="0.01"   
          /\>  
          \<span className="ml-2"\>%\</span\>  
        \</div\>  
      \</td\>  
      \<td className="py-2 px-4 text-right"\>  
        {/\* You may need to pass down the calculated grams to display here \*/}  
        {/\* Example: {formatGrams(calculatedGrams)}g \*/}  
      \</td\>  
    \</tr\>  
  );  
};

export default StepIngredientRow;

### 5\. Phase 3: Testing and Verification

After implementing the code changes, perform the following manual tests to ensure the new feature is robust and bug-free.

1. **Two-Flour Scenario**:  
   * In a step with two flours at 50% each, change one to **75%**.  
   * **Expected Result**: The other flour should automatically become **25%**.  
2. **Three-Flour Scenario**:  
   * In a step with three flours (e.g., 50%, 30%, 20%), increase the first to **60%**.  
   * **Expected Result**: The 10% increase should be proportionally subtracted from the other two. They should adjust while maintaining their 3:2 ratio.  
3. **Zero/Hundred Percent Test**:  
   * Change a flour's value to **100%**.  
   * **Expected Result**: All other flours in that step should become **0%**.  
   * Change a flour's value to **0%**.  
   * **Expected Result**: The difference should be distributed proportionally among the remaining flours.  
4. **Non-Flour Ingredient Test**:  
   * Modify the percentage of salt, water, or other non-flour ingredients.  
   * **Expected Result**: The flour percentages should **not** change.  
5. **Final Calculation Accuracy**:  
   * Observe the main RecipeCalculator display.  
   * **Expected Result**: The final gram calculations for all ingredients should update correctly and accurately reflect the new percentages.