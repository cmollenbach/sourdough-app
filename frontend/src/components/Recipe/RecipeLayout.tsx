// Example: src/components/Recipe/RecipeLayout.tsx
import { useCallback } from "react";
import { IonGrid, IonRow, IonCol } from "@ionic/react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { RecipeStep } from "../../types/recipe";
import type { RecipeLayoutProps } from "../../types/recipeLayout";
import RecipeGlobalControls from "./RecipeGlobalControls"; // Import RecipeGlobalControls
import StepColumn from "./StepColumn";
import { TargetEditor } from "./TargetEditor";
import RecipeControls from "./RecipeControls"; // Import the new component
import RecipeCalculator from "./RecipeCalculator"; // Import the RecipeCalculator

export default function RecipeLayout({
  recipe,
  steps, // Use the steps prop
  ingredientsMeta,
  stepTemplates,
  showAdvanced,
  setShowAdvanced,
  onRecipeChange,    // New prop
  onStepDuplicate, // Use the prop
  onStepRemove,    // Use the prop
  onStepSave,      // Use the prop
  onStepAddHandler,  // New prop
  onStepsReorderHandler, // New prop
  newlyAddedStepId, // Add this
  onNewlyAddedStepHandled, // Add this
}: RecipeLayoutProps) {

  const handleStepChange = useCallback((_idx: number, updatedStep: RecipeStep) => {
    // The onStepSave prop now handles this. The _isNew flag might need to be determined.
    onStepSave(updatedStep, updatedStep.id === 0);
  }, [onStepSave]);

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
              <RecipeGlobalControls
                showAdvanced={showAdvanced}
                onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
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
                showAdvanced={showAdvanced}
                onStepChange={handleStepChange}
                onStepAdd={onStepAddHandler} // Pass the new prop handler here
                onStepDuplicate={onStepDuplicate} // Use prop
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
