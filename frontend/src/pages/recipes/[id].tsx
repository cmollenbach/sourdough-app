import { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import RecipeLayout from "../../components/Recipe/RecipeLayout";
import { apiGet } from "../../utils/api";
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";
import type { FullRecipe, RecipeStep, RecipeStepField, RecipeStepIngredient } from "../../types/recipe";
import type { StepTemplate, IngredientMeta, FieldMeta, IngredientCategoryMeta } from "../../types/recipeLayout"; // Added FieldMeta

const SIMPLE_BASE_RECIPE_ID = 1; // ID of your "Simple Base Recipe"

async function fetchFullRecipeData(id: number): Promise<FullRecipe | null> {
  try {
    return await apiGet<FullRecipe>(`/recipes/${id}/full`);
  } catch (error) {
    console.error(`Error fetching recipe ${id}:`, error);
    return null;
  }
}

function createNewRecipeFromBaseTemplate(baseRecipe: FullRecipe, existingRecipeNames: string[] = []): FullRecipe {
  let newName = "Untitled";
  let counter = 1;
  // This simple check can be improved if many "Untitled X" recipes are expected.
  while (existingRecipeNames.includes(newName)) {
    newName = `Untitled ${counter}`;
    counter++;
  }
  return {
    ...baseRecipe,
    id: 0, // Mark as new
    name: newName,
    steps: baseRecipe.steps.map((step, stepIdx) => ({
      ...step,
      id: 0, recipeId: 0, order: step.order || stepIdx + 1,
      fields: step.fields.map(f => ({ ...f, id: 0, recipeStepId: 0 } as RecipeStepField)),
      ingredients: step.ingredients.map(i => ({ ...i, id: 0, recipeStepId: 0 } as RecipeStepIngredient)),
    } as RecipeStep)),
    fieldValues: baseRecipe.fieldValues.map(fv => ({ ...fv })),
  };
}

export default function RecipeBuilderPage() {
  const { id } = useParams<{ id: string | undefined }>(); // id can now be undefined
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const {
    recipe, // Used
    stepTemplates, // Will be passed to RecipeLayout
    ingredientsMeta, // Will be passed to RecipeLayout
    showAdvanced, // Will be passed to RecipeLayout
    setRecipe,
    setStepTemplates,
    setIngredientsMeta,
    setFieldsMeta,
    setIngredientCategoriesMeta, // Destructure the new setter
    setShowAdvanced, // Will be passed to RecipeLayout
    addStep, // Get addStep action from store
    reorderSteps, // Get reorderSteps action from store
  } = useRecipeBuilderStore();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const initializePage = async () => {
      try {
        // Fetch metadata first, always needed
        const [stepTemplatesData, ingredientsMetaData, fieldsMetaData, ingredientCategoriesData] = await Promise.all([
          apiGet<{ templates: StepTemplate[] }>("/meta/step-templates"),
          apiGet<{ ingredients: IngredientMeta[] }>("/meta/ingredients"), // Corrected type for ingredients response
          apiGet<{ fields: FieldMeta[] }>("/meta/fields"), // Changed to fetch step fields
          apiGet<{ categories: IngredientCategoryMeta[] }>("/meta/ingredient-categories"), // Fetch categories
        ]);

        if (!isMounted) return;

        setStepTemplates(stepTemplatesData?.templates || []);
        setIngredientsMeta(ingredientsMetaData?.ingredients || []); // Access the 'ingredients' property
        setFieldsMeta(fieldsMetaData.fields || []);
        setIngredientCategoriesMeta(ingredientCategoriesData?.categories || []); // Set categories

        if (id && id !== "new" && id !== "0") { // Existing recipe ID
          const recipeData = await fetchFullRecipeData(Number(id));
          if (isMounted) {
            if (recipeData) {
              setRecipe(recipeData);
            } else {
              console.error(`Recipe with id ${id} not found.`);
              history.push("/404"); // Or handle error: set an error state
            }
          }
        } else { // New recipe mode (id is undefined, "new", or "0")
          const baseRecipeData = await fetchFullRecipeData(SIMPLE_BASE_RECIPE_ID);
          if (isMounted) {
            if (baseRecipeData) {
              // Fetch existing recipe names to generate a unique "Untitled" name (optional enhancement)
              // const recipeStubs = await apiGet<RecipeStub[]>("/recipes");
              // const existingNames = recipeStubs.map(r => r.name);
              // const newRecipe = createNewRecipeFromBaseTemplate(baseRecipeData, existingNames);
              const newRecipe = createNewRecipeFromBaseTemplate(baseRecipeData); // Simpler version for now
              setRecipe(newRecipe);
            } else {
              console.error("Base recipe template (ID 1) not found.");
              // Potentially set a truly blank recipe or show an error
            }
          }
        }
      } catch (err) {
        if (isMounted) console.error("Error loading recipe data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializePage();
    return () => { isMounted = false; };
  }, [id, history, setRecipe, setStepTemplates, setIngredientsMeta, setFieldsMeta, setIngredientCategoriesMeta]);

  if (loading) return <div className="p-8 text-center">Loading recipe editor...</div>;
  if (!recipe) return <div className="p-8 text-center">Recipe data could not be loaded.</div>;

  // Define handlers to pass to RecipeLayout, these would typically call store actions
  const handleStepRemove = (stepId: number) => {
    // Example: useRecipeBuilderStore.getState().removeStep(stepId);
    console.log("Remove step:", stepId);
    const store = useRecipeBuilderStore.getState();
    store.removeStep(stepId);
  };

  const handleStepSave = (updatedStep: RecipeStep, _isNew: boolean) => {
    // Example: useRecipeBuilderStore.getState().updateStep(updatedStep);
    // The store's updateStep handles both new (ID 0) and existing steps.
    console.log("Save step:", updatedStep, "isNew:", _isNew);
    const store = useRecipeBuilderStore.getState();
    store.updateStep(updatedStep);
  };

  const handleStepDuplicate = (stepToDuplicate: RecipeStep) => {
    // This logic would ideally be a store action for better state management and ID generation.
    console.log("Duplicate step:", stepToDuplicate);
    const store = useRecipeBuilderStore.getState();
    if (store.recipe) {
      const newStep: RecipeStep = {
        ...stepToDuplicate,
        id: 0, // Mark as new, store action should handle proper temp ID
        order: store.recipe.steps.length + 1, // Append at the end
        fields: stepToDuplicate.fields.map(f => ({ ...f, id: 0, recipeStepId: 0 })),
        ingredients: stepToDuplicate.ingredients.map(i => ({ ...i, id: 0, recipeStepId: 0 })),
      };
      store.updateStep(newStep); // Assuming updateStep with ID 0 adds it
    }
  };

  const handleRecipeChange = (updatedRecipe: FullRecipe) => {
    setRecipe(updatedRecipe); // Or call a more specific store.updateRecipeDetails if available
  };

  const handleStepAdd = () => {
    // The addStep action in the store should handle creating the empty step structure
    // It might need access to stepTemplates from the store state.
    addStep({ stepTemplateId: stepTemplates.length > 0 ? stepTemplates[0].id : 0 }, stepTemplates.find(st => st.id === (stepTemplates.length > 0 ? stepTemplates[0].id : 0)));
  };

  const handleStepsReorder = (reorderedSteps: RecipeStep[]) => {
    reorderSteps(reorderedSteps);
  };

  return <RecipeLayout
    recipe={recipe}
    // fieldsMeta={fieldsMeta} // No longer needed by RecipeLayout
    steps={recipe.steps}
    ingredientsMeta={ingredientsMeta}
    stepTemplates={stepTemplates}
    showAdvanced={showAdvanced}
    setShowAdvanced={setShowAdvanced}
    onRecipeChange={handleRecipeChange}
    onStepDuplicate={handleStepDuplicate}
    onStepRemove={handleStepRemove}
    onStepSave={handleStepSave}
    onStepAddHandler={handleStepAdd}
    onStepsReorderHandler={handleStepsReorder}
  />;
}