import { useEffect, useState, useCallback } from "react";
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
    name: newName, // The recipe itself is new
    steps: baseRecipe.steps.map((step, stepIdx) => ({
      ...step, // Spread original step data first
      id: -(Date.now() + stepIdx + Math.floor(Math.random() * 100000)), // More robust unique temporary ID
      recipeId: 0, // Belongs to the new, unsaved recipe (which will have ID 0)
      order: step.order || stepIdx + 1,
      fields: step.fields.map((f, fIdx) => ({ ...f, id: -(Date.now() + stepIdx + fIdx + Math.floor(Math.random() * 100000) + 1000), recipeStepId: 0 } as RecipeStepField)), // Assign unique temporary IDs
      ingredients: step.ingredients.map((i, iIdx) => ({ ...i, id: -(Date.now() + stepIdx + iIdx + Math.floor(Math.random() * 100000) + 2000), recipeStepId: 0 } as RecipeStepIngredient)), // Assign unique temporary IDs
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

  // Define handlers to pass to RecipeLayout, these would typically call store actions
  // Moved before conditional returns to adhere to Rules of Hooks
  const handleStepRemove = useCallback((stepId: number) => {
    // console.log("Remove step:", stepId);
    const store = useRecipeBuilderStore.getState();
    store.removeStep(stepId);
  }, []);

  const handleStepSave = useCallback((
    updatedStep: RecipeStep,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isNew: boolean // _isNew is part of the prop signature, but not used in this specific implementation
  ) => {
    // console.log("Save step:", updatedStep, "isNew:", _isNew);
    const store = useRecipeBuilderStore.getState();
    store.updateStep(updatedStep);
  }, []);

  const handleStepDuplicate = useCallback((stepToDuplicate: RecipeStep) => {
    // console.log("Duplicate step:", stepToDuplicate);
    const store = useRecipeBuilderStore.getState();
    if (store.recipe) {
      const newStep: RecipeStep = {
        ...stepToDuplicate,
        // Assign unique temporary ID. Store's addStep/updateStep should handle if it's truly new.
        id: -(Date.now() + Math.floor(Math.random() * 100000) + 3000),
        order: store.recipe.steps.length + 1,
        fields: stepToDuplicate.fields.map((f, fIdx) => ({ ...f, id: -(Date.now() + fIdx + Math.floor(Math.random() * 100000) + 4000), recipeStepId: 0 })), // Assign unique temp IDs
        ingredients: stepToDuplicate.ingredients.map((i, iIdx) => ({ ...i, id: -(Date.now() + iIdx + Math.floor(Math.random() * 100000) + 5000), recipeStepId: 0 })), // Assign unique temp IDs
      };
      // Consider if addStep is more appropriate if the ID generation implies it's always new here
      store.updateStep(newStep);
    }
  }, []);

  const handleRecipeChange = useCallback((updatedRecipe: FullRecipe) => {
    // Call the store action that updates details AND marks the recipe as dirty
    useRecipeBuilderStore.getState().updateRecipeDetails(updatedRecipe);
  }, []);

  const handleStepAdd = useCallback(() => {
    const defaultTemplate = stepTemplates.length > 0 ? stepTemplates[0] : undefined;
    if (defaultTemplate) {
      addStep({ stepTemplateId: defaultTemplate.id }, defaultTemplate);
    } else {
      addStep({ stepTemplateId: 0 });
      console.warn("No step templates available to add a new step with a default template.");
    }
  }, [addStep, stepTemplates]);

  const handleStepsReorder = useCallback((reorderedSteps: RecipeStep[]) => {
    reorderSteps(reorderedSteps);
  }, [reorderSteps]);

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
