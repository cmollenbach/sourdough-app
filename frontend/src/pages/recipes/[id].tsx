import { useEffect, useState, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";
import RecipeLayout from "../../components/Recipe/RecipeLayout";
// import { fetchRecipeList } from "../../utils/api"; // No longer needed here
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";
import type { FullRecipe, RecipeStep } from "../../types/recipe"; // Removed RecipeStub
// StepTemplate type is available via useRecipeBuilderStore if needed for props, but not directly imported here if unused

const SIMPLE_BASE_RECIPE_ID = 1; // ID of your "Simple Base Recipe"

function createNewRecipeFromBaseTemplate(baseRecipe: FullRecipe | null, existingRecipeNames: string[] = []): FullRecipe | null {
  if (!baseRecipe) return null;
  let newName = "Untitled Recipe";
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
      id: -(Date.now() + stepIdx + Math.floor(Math.random() * 100000)), // Unique temporary ID
      recipeId: 0, // Belongs to the new, unsaved recipe (which will have ID 0)
      order: step.order || stepIdx + 1,
      fields: step.fields.map((f, fIdx) => ({ ...f, id: -(Date.now() + stepIdx + fIdx + Math.floor(Math.random() * 100000) + 1000), recipeStepId: 0 })),
      ingredients: step.ingredients.map((i, iIdx) => ({ ...i, id: -(Date.now() + stepIdx + iIdx + Math.floor(Math.random() * 100000) + 2000), recipeStepId: 0 })),
    })),
    fieldValues: baseRecipe.fieldValues.map(fv => ({ ...fv })),
  };
}

export default function RecipeBuilderPage() {
  const { id } = useParams<{ id: string | undefined }>(); // id can now be undefined
  const history = useHistory();
  const [pageLoading, setPageLoading] = useState(true); // Local loading state for this page's setup
  // const [availableRecipes, setAvailableRecipes] = useState<RecipeStub[]>([]); // No longer needed here

  const {
    recipe,
    stepTemplates,
    ingredientsMeta,
    fieldsMeta, // Get fieldsMeta from store
    showAdvanced,
    loading: storeLoading, // Loading state from the store (for recipe/metadata fetching)
    error: storeError,   // Error state from the store
    setRecipe,
    fetchRecipe,
    fetchAllMetaData,
    setShowAdvanced,
    addStep,
    removeStep,
    updateStep,
    reorderSteps,
    updateRecipeDetails,
  } = useRecipeBuilderStore();

  const handleStepRemove = useCallback((stepId: number) => {
    removeStep(stepId);
  }, [removeStep]);

  const handleStepSave = useCallback((
    updatedStep: RecipeStep,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isNew: boolean // _isNew is part of the prop signature, but not used in this specific implementation
  ) => {
    updateStep(updatedStep);
  }, [updateStep]);

  const handleStepDuplicate = useCallback((stepToDuplicate: RecipeStep) => {
    if (recipe) { // Use recipe from destructured store state
      // const newStep: RecipeStep = { // This variable was unused
      //   ...stepToDuplicate,
      //   id: 0, 
      //   order: recipe.steps.length + 1, 
      // };
      // This is a simplified duplication. A more robust one would re-evaluate fields/ingredients
      // based on the original step's template or data.
      // For now, let's assume we add a new step based on the duplicated step's template.
      const templateForDuplicatedStep = stepTemplates.find(t => t.id === stepToDuplicate.stepTemplateId);
      addStep({ stepTemplateId: stepToDuplicate.stepTemplateId, notes: stepToDuplicate.notes, description: stepToDuplicate.description }, templateForDuplicatedStep);
    }
  }, [recipe, addStep, stepTemplates]);

  const handleRecipeChange = useCallback((updatedRecipe: FullRecipe) => {
    updateRecipeDetails(updatedRecipe);
  }, [updateRecipeDetails]);

  const handleStepAdd = useCallback(() => {
    const defaultTemplate = stepTemplates.length > 0 ? stepTemplates[0] : undefined;
    if (defaultTemplate) {
      addStep({ stepTemplateId: defaultTemplate.id }, defaultTemplate);
    } else {
      // If no templates, add a truly blank step (store's addStep should handle this)
      addStep({ stepTemplateId: 0 }); // Assuming stepTemplateId: 0 means a blank step
      console.warn("No step templates available to add a new step with a default template.");
    }
  }, [addStep, stepTemplates]);

  const handleStepsReorder = useCallback((reorderedSteps: RecipeStep[]) => {
    reorderSteps(reorderedSteps);
  }, [reorderSteps]);

  // Fetch metadata once on component mount
  useEffect(() => {
    fetchAllMetaData();
    // fetchRecipeList().then(setAvailableRecipes).catch(err => { // No longer needed here
    //   console.error("Failed to load recipe list for dropdown:", err);
    //   // Optionally set an error state for the dropdown
    // });
  }, [fetchAllMetaData]);

  // Effect to load or initialize a recipe based on URL 'id'
  useEffect(() => {
    const initializePage = async () => {
      setPageLoading(true);
      try {
        if (id && id !== "new" && id !== "0") { // Existing recipe ID
          await fetchRecipe(Number(id));
          // The store will update 'recipe', 'storeLoading', and 'storeError'
          // We can check storeError after fetchRecipe completes if needed
          if (useRecipeBuilderStore.getState().error) {
             console.error(`Recipe with id ${id} not found or failed to load.`);
             history.push("/recipes/new"); // Or to a 404 or specific error display
          }
        } else { // New recipe mode (id is undefined, "new", or "0")
          // Fetch the base recipe template using the store's fetchRecipe
          // This assumes fetchRecipe can handle fetching a recipe that will then be *copied*
          // A dedicated store action `initializeNewRecipe(baseId)` would be cleaner.
          // For now, we fetch the base, then create a new one from it.
          const baseRecipeStoreState = useRecipeBuilderStore.getState();
          await baseRecipeStoreState.fetchRecipe(SIMPLE_BASE_RECIPE_ID); // Fetch base recipe into store temporarily
          const fetchedBaseRecipe = useRecipeBuilderStore.getState().recipe; // Get it

          // Since availableRecipes is removed, we pass an empty array for unique name generation
          // This part of createNewRecipeFromBaseTemplate might need adjustment if unique naming is critical
          if (fetchedBaseRecipe) { 
            const newRecipe = createNewRecipeFromBaseTemplate(fetchedBaseRecipe, []); // Pass empty array
            if (newRecipe) {
              setRecipe(newRecipe);
            } else {
              console.error("Base recipe template (ID 1) not found or failed to process.");
              setRecipe({id:0, name:"Blank Recipe", notes: '', steps:[], fieldValues:[]}); // Fallback to a truly blank FullRecipe
            }
          } else {
            console.error("Base recipe template (ID 1) could not be fetched.");
            setRecipe({id:0, name:"Blank Recipe", notes: '', steps:[], fieldValues:[]}); // Fallback to a truly blank FullRecipe
          }
        }
      } catch (err) {
        console.error("Error initializing recipe page:", err);
        // Potentially set a page-level error state
      } finally {
        setPageLoading(false);
      }
    };

    initializePage();
  }, [id, history, fetchRecipe, setRecipe]); // Removed availableRecipes from dependencies

  // const handleRecipeSelect = (selectedId: string) => { // No longer needed here
  //   if (selectedId) {
  //     history.push(`/recipes/${selectedId}`);
  //   }
  // };

  // Use storeLoading for the main recipe data, pageLoading for initial setup phase
  if (pageLoading || (storeLoading && id && id !== "new")) {
    return <div className="container mx-auto p-8 text-center">Loading recipe editor...</div>;
  }
  if (storeError && id && id !== "new") {
    return <div className="container mx-auto p-8 text-center text-red-500">Error loading recipe: {storeError}</div>;
  }
  if (!recipe) {
    return <div className="container mx-auto p-8 text-center">Recipe data could not be loaded or no recipe selected.</div>;
  }

  return (
    <div>
      <RecipeLayout
        recipe={recipe}
        fieldsMeta={fieldsMeta} // Pass fieldsMeta from the store
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
      />
    </div>
  );
}
