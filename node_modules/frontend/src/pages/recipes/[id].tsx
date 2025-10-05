import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import RecipeLayout from "../../components/Recipe/RecipeLayout";
// import { fetchRecipeList } from "../../utils/api"; // No longer needed here
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";
import type { FullRecipe, RecipeStep } from '@sourdough/shared'; // Removed RecipeStub

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
    ingredientCategoriesMeta, // Get from store
    fieldsMeta, // Get fieldsMeta from store
    showAdvanced,
    loading: storeLoading, // Loading state from the store (for recipe/metadata fetching)
    error: storeError,   // Error state from the store
    setRecipe,
    fetchRecipe,
    fetchPredefinedRecipeByName, // Add this action
    fetchAllMetaData,
    setShowAdvanced,
    addStep,
    removeStep,
    updateStep,
    reorderSteps,
    updateRecipeDetails,
  } = useRecipeBuilderStore();

  // State for tracking the newly added step ID
  const [newlyAddedStepId, setNewlyAddedStepId] = useState<number | null>(null);
  const prevRecipeRef = useRef<FullRecipe | null | undefined>(null);


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

  const handleRecipeChange = useCallback((updatedRecipe: FullRecipe) => {
    updateRecipeDetails(updatedRecipe);
  }, [updateRecipeDetails]);
  
  const handleNewlyAddedStepHandled = useCallback(() => {
    setNewlyAddedStepId(null);
  }, []);

  const handleStepAdd = useCallback(() => {
    const defaultTemplate = stepTemplates.length > 0 ? stepTemplates[0] : undefined;
    let newStepId: number | null = null;

    if (defaultTemplate) {
      newStepId = addStep({ stepTemplateId: defaultTemplate.id }, defaultTemplate) ?? null;
    } else {
      // If no templates, add a truly blank step (store's addStep should handle this)
      newStepId = addStep({ stepTemplateId: 0 }) ?? null; // Assuming stepTemplateId: 0 means a blank step
      console.warn("No step templates available to add a new step with a default template.");
    }
    setNewlyAddedStepId(newStepId);
  }, [addStep, stepTemplates]); // `recipe` is no longer needed if addStep returns ID

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

  // Diagnostic log for recipe object stability
  useEffect(() => {
    if (prevRecipeRef.current && recipe && prevRecipeRef.current !== recipe) {
      // console.groupCollapsed('%cRecipeBuilderPage: `recipe` object reference CHANGED.', 'color: red; font-weight: bold;');
      // console.log('Previous recipe object:', prevRecipeRef.current);
      // console.log('Current recipe object:', recipe);

      // Check a specific step if newlyAddedStepId was just cleared (meaning it was the one focused)
      // This requires capturing the ID before it's cleared or having another way to identify the relevant step.
      // For simplicity, let's log if any step reference changed if their content didn't.
      recipe.steps.forEach(currentStep => {
        const prevStep = prevRecipeRef.current?.steps.find(s => s.id === currentStep.id);
        const prevStepContent = prevStep ? JSON.stringify(prevStep) : 'undefined';
        const currentStepContent = JSON.stringify(currentStep);

        if (prevStep && prevStep !== currentStep && prevStepContent === currentStepContent) {
          // console.log(`%cRecipeBuilderPage: Step ID ${currentStep.id} reference CHANGED but content is IDENTICAL.`, 'color: orange; font-weight: bold;');
        }
      });
    }
    prevRecipeRef.current = recipe;
  }, [recipe]); // Log whenever the recipe object from the store changes


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
          try {
            // Fetch the "Basic Sourdough" recipe by its name as a base template
            const baseRecipeData = await fetchPredefinedRecipeByName("Basic Sourdough");

            if (baseRecipeData) {
              // Since availableRecipes is removed, we pass an empty array for unique name generation
              // This part of createNewRecipeFromBaseTemplate might need adjustment if unique naming is critical later
              const newRecipe = createNewRecipeFromBaseTemplate(baseRecipeData, []);
              if (newRecipe) {
                setRecipe(newRecipe);
              } else {
                console.error("\"Basic Sourdough\" recipe found but could not be processed into a new recipe.");
                setRecipe({id:0, name:"Blank Recipe", notes: '', totalWeight: null, hydrationPct: null, saltPct: null, steps:[], fieldValues:[]}); // Fallback
              }
            } else {
              console.error("\"Basic Sourdough\" could not be fetched. Store error:", useRecipeBuilderStore.getState().error);
              setRecipe({id:0, name:"Blank Recipe", notes: '', totalWeight: null, hydrationPct: null, saltPct: null, steps:[], fieldValues:[]}); // Fallback
            }
          } catch (fetchError) {
            console.error("Error fetching \"Base Template\":", fetchError);
            setRecipe({id:0, name:"Blank Recipe", notes: '', totalWeight: null, hydrationPct: null, saltPct: null, steps:[], fieldValues:[]}); // Fallback
          }
        }
      } catch (err) {
        console.error("Error initializing recipe page:", err);
      } finally {
        setPageLoading(false);
      }
    };

    initializePage();
  }, [id, history, fetchRecipe, setRecipe, fetchPredefinedRecipeByName]);

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
        ingredientCategoriesMeta={ingredientCategoriesMeta} // Pass down
        ingredientsMeta={ingredientsMeta}
        stepTemplates={stepTemplates}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        onRecipeChange={handleRecipeChange}
        onStepRemove={handleStepRemove}
        onStepSave={handleStepSave}
        onStepAddHandler={handleStepAdd}
        newlyAddedStepId={newlyAddedStepId} // Pass state
        onNewlyAddedStepHandled={handleNewlyAddedStepHandled} // Pass handler
        onStepsReorderHandler={handleStepsReorder}
      />
    </div>
  );
}
