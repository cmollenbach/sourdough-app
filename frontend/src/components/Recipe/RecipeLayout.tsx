// Example: src/components/Recipe/RecipeLayout.tsx

import { IonGrid, IonRow, IonCol } from "@ionic/react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { RecipeStep } from "../../types/recipe";
import type { StepTemplate } from "../../types/recipeLayout";
import StepColumn from "./StepColumn";
import { TargetEditor } from "./TargetEditor";
import RecipeControls from "./RecipeControls"; // Import the new component
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";

const getEmptyStep = (recipeId: number, order: number, stepTemplates: StepTemplate[]): RecipeStep => ({
  id: 0,
  recipeId,
  stepTemplateId: stepTemplates.length > 0 ? stepTemplates[0].id : 0, // Use first template if available
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
  const fieldsMeta = useRecipeBuilderStore((state) => state.fieldsMeta);
  const updateStep = useRecipeBuilderStore((state) => state.updateStep);
  const reorderSteps = useRecipeBuilderStore((state) => state.reorderSteps);
  const removeStep = useRecipeBuilderStore((state) => state.removeStep);

  const steps = recipe?.steps ?? [];

  const handleStepChange = (_idx: number, updated: RecipeStep) => {
    updateStep(updated);
  };

  const handleStepAdd = () => {
    if (!recipe) return;
    const newStep = getEmptyStep(recipe.id, steps.length + 1, stepTemplates);
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
        reorderSteps(finalSteps); // Call store action to update all steps
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
                  fieldsMeta={fieldsMeta}
                  showAdvanced={showAdvanced}
                  setShowAdvanced={setShowAdvanced}
                  onChange={setRecipe}
                />
              )}
              {/* You can add more left column content here */}
            </IonCol>
            <IonCol size="12" sizeMd="6">
              <StepColumn
                steps={steps}
                stepTemplates={stepTemplates}
                ingredientsMeta={ingredientsMeta}
                showAdvanced={showAdvanced}
                onStepChange={handleStepChange}
                onStepAdd={handleStepAdd} // Pass the handler here
                onStepDuplicate={handleStepDuplicate}
                onStepRemove={handleStepRemove}
                onDragEnd={handleDragEnd} // Changed prop name
              />
            </IonCol>
          </IonRow>
        </IonGrid>
      </div>
    </div>
  );
}