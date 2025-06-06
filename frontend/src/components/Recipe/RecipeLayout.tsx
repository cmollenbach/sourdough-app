// Example: src/components/Recipe/RecipeLayout.tsx

import { IonGrid, IonRow, IonCol } from "@ionic/react";
import StepColumn from "./StepColumn"; // <-- Import your new StepColumn
import type { RecipeStep } from "../../types/recipe";
import type { RecipeLayoutProps } from "../../types/recipeLayout";

const getEmptyStep = (recipeId: number, order: number): RecipeStep => ({
  id: 0,
  recipeId,
  stepTemplateId: 0,
  order,
  notes: "",
  description: "",
  fields: [],
  ingredients: [],
});

const RecipeLayout = ({
  recipe,
  steps,
  stepTemplates,
  showAdvanced,
  onStepDuplicate,
  onStepRemove,
  onStepSave,
}: RecipeLayoutProps) => {
  // No need for editingStep or modal editor

  const handleStepChange = (_idx: number, updated: RecipeStep) => {
    onStepSave(updated, false);
  };

  const handleStepAdd = () => {
    const newStep = getEmptyStep(recipe.id, steps.length + 1);
    onStepSave(newStep, true);
  };

  // Optional: stub for onReorder if StepColumn requires it
  const handleReorder = () => {};

  return (
    <IonGrid>
      <IonRow>
        <IonCol size="12" sizeMd="6">
          {/* Left column content */}
        </IonCol>
        <IonCol size="12" sizeMd="6">
          <button
            onClick={handleStepAdd}
            className="mb-2 px-4 py-2 bg-blue-600 text-white rounded"
          >
            + Add Step
          </button>
          <StepColumn
            steps={steps}
            stepTemplates={stepTemplates}
            showAdvanced={showAdvanced}
            onStepChange={handleStepChange}
            onStepDuplicate={onStepDuplicate}
            onStepRemove={onStepRemove}
            onReorder={handleReorder}
          />
        </IonCol>
      </IonRow>
    </IonGrid>
  );
};

export default RecipeLayout;