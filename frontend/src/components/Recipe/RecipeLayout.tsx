// Example: src/components/Recipe/RecipeLayout.tsx

import { IonGrid, IonRow, IonCol } from "@ionic/react";
import { useState } from "react";
// import RecipeForm from "./RecipeForm"; // <-- Remove this line
import RecipeStepList from "./RecipeStepList";
import RecipeCalculator from "./RecipeCalculator";
import RecipeStepEditor from "./RecipeStepEditor";
import type { RecipeStep } from "../../types/recipe";
import type { RecipeLayoutProps } from "../../types/recipeLayout";

const getEmptyStep = (recipeId: number, order: number): RecipeStep => ({
  id: 0, // Use 0 or -1 for new/unsaved step
  recipeId,
  stepTemplateId: 0, // Or -1 if you want to indicate "unset"
  order,
  notes: "",
  description: "",
  fields: [],
  ingredients: [],
});

const RecipeLayout = ({
  recipe,
  fieldsMeta,
  steps,
  stepFieldsMeta,
  ingredientsMeta,
  // onRecipeChange, // Remove this line
  // onRecipeSave,   // Remove this line
  onStepDuplicate,
  onStepRemove,
  onStepSave,
}: RecipeLayoutProps) => {
  const [editingStep, setEditingStep] = useState<RecipeStep | null>(null);

  const handleStepSave = (step: RecipeStep) => {
    const isNew = !step.id;
    onStepSave(step, isNew);
    setEditingStep(null);
  };

  return (
    <IonGrid>
      <IonRow>
        {/* Left Column: Recipe management, calculator, etc. */}
        <IonCol size="12" sizeMd="6">
          {/* <RecipeForm
            recipe={recipe}
            fieldsMeta={fieldsMeta}
            onChange={onRecipeChange}
            onSave={onRecipeSave}
          /> */}
          <RecipeCalculator
            recipe={recipe}
            steps={steps}
            fieldsMeta={fieldsMeta}
            ingredientsMeta={ingredientsMeta}
          />
        </IonCol>
        {/* Right Column: Steps */}
        <IonCol size="12" sizeMd="6">
          <button
            onClick={() =>
              setEditingStep(getEmptyStep(recipe.id, steps.length + 1))
            }
            className="mb-2 px-4 py-2 bg-blue-600 text-white rounded"
          >
            + Add Step
          </button>
          <RecipeStepList
            steps={steps}
            fieldsMeta={stepFieldsMeta}
            ingredientsMeta={ingredientsMeta}
            onEdit={setEditingStep}
            onDuplicate={onStepDuplicate}
            onRemove={onStepRemove}
          />
          {editingStep && (
            <RecipeStepEditor
              step={editingStep}
              fieldsMeta={stepFieldsMeta}
              ingredientsMeta={ingredientsMeta}
              onSave={handleStepSave}
              onCancel={() => setEditingStep(null)}
            />
          )}
        </IonCol>
      </IonRow>
    </IonGrid>
  );
};

export default RecipeLayout;