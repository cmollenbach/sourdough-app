// Example: src/components/Recipe/RecipeLayout.tsx

import { IonGrid, IonRow, IonCol } from "@ionic/react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { RecipeStep } from "../../types/recipe";
import type { RecipeLayoutProps } from "../../types/recipeLayout";
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
}: RecipeLayoutProps) {

  const handleStepChange = (_idx: number, updatedStep: RecipeStep) => {
    // The onStepSave prop now handles this. The _isNew flag might need to be determined.
    onStepSave(updatedStep, updatedStep.id === 0);
  };

  // Local handleStepAdd is removed; onStepAddHandler prop will be used by StepColumn.
  // Local reorderSteps is removed; onStepsReorderHandler prop will be used by DndContext.

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex(step => `step-${step.id}` === active.id);
      const newIndex = steps.findIndex(step => `step-${step.id}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && recipe) {
        const newOrderedSteps = arrayMove(steps, oldIndex, newIndex);
        // Update the 'order' property for each step to reflect the new sequence
        const finalSteps = newOrderedSteps.map((step, index) => ({
          ...step,
          order: index + 1,
        }));
        onStepsReorderHandler(finalSteps); // Use prop handler
      }
    }
  };

  return (
    <div className="flex flex-col">
      <div>
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="6">
              <RecipeControls /> {/* Add the RecipeControls component here */}
              {recipe && (
                <TargetEditor
                  recipe={recipe}
                  showAdvanced={showAdvanced}
                  setShowAdvanced={setShowAdvanced}
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
              />
            </IonCol>
          </IonRow>
        </IonGrid>
      </div>
    </div>
  );
}