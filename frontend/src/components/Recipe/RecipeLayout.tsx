// Example: src/components/Recipe/RecipeLayout.tsx

import { IonGrid, IonRow, IonCol } from "@ionic/react";
import type { RecipeStep } from "../../types/recipe";
import StepColumn from "./StepColumn";
import { TargetEditor } from "./TargetEditor";
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";

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

export default function RecipeLayout() {
  const recipe = useRecipeBuilderStore((state) => state.recipe);
  const setRecipe = useRecipeBuilderStore((state) => state.setRecipe);
  const showAdvanced = useRecipeBuilderStore((state) => state.showAdvanced);
  const setShowAdvanced = useRecipeBuilderStore((state) => state.setShowAdvanced);
  const stepTemplates = useRecipeBuilderStore((state) => state.stepTemplates);
  const ingredientsMeta = useRecipeBuilderStore((state) => state.ingredientsMeta);
  const updateStep = useRecipeBuilderStore((state) => state.updateStep);
  const removeStep = useRecipeBuilderStore((state) => state.removeStep);

  const steps = recipe?.steps ?? [];

  const handleStepChange = (_idx: number, updated: RecipeStep) => {
    updateStep(updated);
  };

  const handleStepAdd = () => {
    if (!recipe) return;
    const newStep = getEmptyStep(recipe.id, steps.length + 1);
    updateStep(newStep);
  };

  const handleStepDuplicate = (step: RecipeStep) => {
    if (!recipe) return;
    const newStep: RecipeStep = {
      ...step,
      id: 0,
      order: steps.length + 1,
    };
    updateStep(newStep);
  };

  const handleStepRemove = (stepId: number) => {
    removeStep(stepId);
  };

  const handleReorder = () => {
    // Implement if you support drag-and-drop reordering
  };

  return (
    <div className="flex flex-col">
      <div>
        {recipe && (
          <TargetEditor
            recipe={recipe}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            onChange={setRecipe}
          />
        )}
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
                ingredientsMeta={ingredientsMeta}
                showAdvanced={showAdvanced}
                onStepChange={handleStepChange}
                onStepDuplicate={handleStepDuplicate}
                onStepRemove={handleStepRemove}
                onReorder={handleReorder}
              />
            </IonCol>
          </IonRow>
        </IonGrid>
      </div>
    </div>
  );
}