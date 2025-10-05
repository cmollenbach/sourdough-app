// Example: src/components/Recipe/RecipeLayout.tsx
import { useCallback } from "react";
import { IonGrid, IonRow, IonCol } from "@ionic/react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { RecipeStep } from '@sourdough/shared';
import type { RecipeLayoutProps } from '@sourdough/shared';
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";
import RecipeGlobalControls from "./RecipeGlobalControls"; // Import RecipeGlobalControls
import AdvancedUserFeatures from "./AdvancedUserFeatures"; // Import the enhanced component
import StepColumn from "./StepColumn";
import { TargetEditor } from "./TargetEditor";
import RecipeControls from "./RecipeControls"; // Import the new component
import RecipeCalculator from "./RecipeCalculator"; // Import the RecipeCalculator

export default function RecipeLayout({
  recipe,
  steps, // Use the steps prop
  ingredientsMeta,
  ingredientCategoriesMeta, // Added
  stepTemplates,
  showAdvanced,
  setShowAdvanced,
  onRecipeChange,    // New prop
  onStepRemove,    // Use the prop
  onStepSave,      // Use the prop
  onStepAddHandler,  // New prop
  onStepsReorderHandler, // New prop
  newlyAddedStepId, // Add this
  onNewlyAddedStepHandled, // Add this
}: RecipeLayoutProps) {
  // Access the store for updating recipe details
  const { updateRecipeDetails } = useRecipeBuilderStore();

  const handleStepChange = useCallback((_idx: number, updatedStep: RecipeStep) => {
    // The onStepSave prop now handles this. The _isNew flag might need to be determined.
    onStepSave(updatedStep, updatedStep.id === 0);
  }, [onStepSave]);

  const handleQuickRatio = useCallback((hydration: number) => {
    if (!recipe) return;
    
    if (hydration === 0) {
      // Custom hydration - prompt user for input
      const customHydration = prompt(
        "Enter custom hydration percentage:", 
        recipe.hydrationPct?.toString() || "75"
      );
      
      if (customHydration && !isNaN(Number(customHydration))) {
        const hydrationValue = Math.max(50, Math.min(120, Number(customHydration))); // Clamp between 50-120%
        updateRecipeDetails({ hydrationPct: hydrationValue });
      }
    } else {
      // Preset hydration values
      updateRecipeDetails({ hydrationPct: hydration });
    }
  }, [recipe, updateRecipeDetails]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex(s => `step-${s.id}` === active.id);
      const newIndex = steps.findIndex(s => `step-${s.id}` === over.id);

      // The check for `recipe` might be removed if `steps` existing implies a valid context
      // for reordering, or if `onStepsReorderHandler` doesn't depend on the parent `recipe` object.
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrderedSteps = arrayMove(steps, oldIndex, newIndex);
        // Update the 'order' property for each step to reflect the new sequence
        const finalSteps = newOrderedSteps.map((s, index) => ({
          ...s,
          order: index + 1,
        }));
        onStepsReorderHandler(finalSteps); // Use prop handler
      }
    }
  }, [steps, onStepsReorderHandler]);

  return (
    <div className="flex flex-col page-bg"> {/* Applied .page-bg for themed background */}
      <div>
        <IonGrid>
          <IonRow>
            <IonCol size="12"> {/* This column will span the full width for the global controls bar */}
              <AdvancedUserFeatures
                showAdvanced={showAdvanced}
                onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
                currentRecipe={recipe}
                onQuickRatio={handleQuickRatio}
              />
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12" sizeMd="6">
              <RecipeControls /> {/* Add the RecipeControls component here */}
              {recipe && (
                <TargetEditor
                  recipe={recipe}
                  onChange={onRecipeChange} // Use prop handler
                />
              )}
              <RecipeCalculator /> {/* Add the RecipeCalculator here */}
            </IonCol>
            <IonCol size="12" sizeMd="6">
              <StepColumn
                steps={steps}
                stepTemplates={stepTemplates}
                ingredientsMeta={ingredientsMeta}
                ingredientCategoriesMeta={ingredientCategoriesMeta} // Pass down
                showAdvanced={showAdvanced}
                onStepChange={handleStepChange}
                onStepAdd={onStepAddHandler} // Pass the new prop handler here
                onStepRemove={onStepRemove}       // Use prop
                onDragEnd={handleDragEnd} // Changed prop name
                newlyAddedStepId={newlyAddedStepId} // Pass down
                onNewlyAddedStepHandled={onNewlyAddedStepHandled} // Pass down
              />
            </IonCol>
          </IonRow>
        </IonGrid>
      </div>
    </div>
  );
}
