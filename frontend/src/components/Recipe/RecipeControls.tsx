// RecipeControls.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDialog } from '../../context/useDialog'; // Updated import path
import { useHistory } from 'react-router-dom'; // For react-router-dom v5
import { useRecipeBuilderStore } from '../../store/recipeBuilderStore';
import { useBakeStore } from '../../store/useBakeStore'; // Import useBakeStore
import type { FullRecipe, RecipeFieldValue, RecipeStep, RecipeStepField, RecipeStepIngredient, IngredientCalculationMode } from '../../types/recipe';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api'; // Import all needed API utils
import ResponsiveActionBar from './ResponsiveActionBar.tsx'; // Import the new component

// Define RecipeStub based on the Recipe type for the dropdown
type RecipeStub = {
  id: number;
  name: string;
  isPredefined?: boolean;
  isTemplateAdvanced?: boolean; // True if a predefined template is considered advanced
};

// --- Real API Interaction Functions ---

async function fetchFullRecipe(id: number): Promise<FullRecipe | null> {
  return apiGet<FullRecipe>(`/recipes/${id}/full`);
}

// This interface defines what the backend expects for creating/updating.
// It should align with what your backend `POST /recipes` and `PUT /recipes/:id` routes consume.
// Note: The backend `PUT` route now returns the transformed FullRecipe.
interface BackendRecipePayload {
  name: string;
  notes?: string | null;
  totalWeight?: number | null;
  hydrationPct?: number | null;
  saltPct?: number | null;
  parameterValues: { parameterId: number, value: string | number | boolean | null }[]; // For any *other* dynamic parameters
  steps?: {
    id?: number; // For existing steps during an update
    stepTemplateId: number;
    order: number;
    notes?: string | null;
    description?: string | null;
    parameterValues?: { id?: number; parameterId: number, value: string | number | boolean | null, notes?: string | null }[]; // Corresponds to RecipeStep['fields']
    ingredients?: {
      id?: number;
      ingredientId: number;
      amount: number; // Changed from percentage
      calculationMode: IngredientCalculationMode; // Added
      ingredientCategoryId?: number; // Frontend has this, backend POST might not use it
      preparation?: string | null;
      notes?: string | null;
    }[]; // Corresponds to RecipeStep['ingredients']
  }[];
}

async function apiSaveNewRecipe(payload: BackendRecipePayload): Promise<FullRecipe> {
  // Backend POST /api/recipes should return the created FullRecipe
  return apiPost<FullRecipe>('/recipes', payload);
}

async function apiUpdateExistingRecipe(id: number, payload: BackendRecipePayload): Promise<FullRecipe> {
  // Backend PUT /api/recipes/:id should return an object like { message: string, recipe: FullRecipe }
  const response = await apiPut<{ message: string, recipe: FullRecipe }>(`/recipes/${id}`, payload);
  return response.recipe; // Extract the recipe object
}

async function apiDeleteRecipe(id: number): Promise<void> {
  // Backend DELETE /api/recipes/:id usually returns a success message or just a 204 No Content
  await apiDelete(`/recipes/${id}`);
}


// const BASE_TEMPLATE_NAME = "Base Template"; // No longer needed if selecting from list
// --- End Placeholder API functions ---

// Removed placeholder openNameInputModal as we'll use useDialog

export default function RecipeControls() {
  const { showDialog, hideDialog } = useDialog(); // Get showDialog and hideDialog
  const currentRecipe = useRecipeBuilderStore(state => state.recipe);
  const setRecipe = useRecipeBuilderStore(state => state.setRecipe);
  const fieldsMeta = useRecipeBuilderStore(state => state.fieldsMeta); // Access fieldsMeta from the store
  // const fetchPredefinedRecipeByNameFromStore = useRecipeBuilderStore(state => state.fetchPredefinedRecipeByName); // No longer directly used here
  const isRecipeDirty = useRecipeBuilderStore(state => state.isRecipeDirty);
  const { startBake: initiateBake, isLoading: isBakeLoading, error: bakeError, clearError: clearBakeError } = useBakeStore(); // Destructure from useBakeStore

  const [recipeList, setRecipeList] = useState<RecipeStub[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory(); // For react-router-dom v5

  const fetchRecipeList = async () => {
    // setIsLoading(true); // Optionally set loading for list refresh, but might be too quick
    // setError(null);
    try {
      const list = await apiGet<RecipeStub[]>("/recipes");
      setRecipeList(list);
    } catch (_err) {
      // setError('Failed to refresh recipe list.'); // Avoid overwriting main action error
      console.error("Failed to refresh recipe list:", _err);
    }
    // finally { setIsLoading(false); }
  };

  useEffect(() => {
    const fetchList = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use the actual API call here
        const list = await apiGet<RecipeStub[]>("/recipes");
        setRecipeList(list);
      } catch (_err) {
        setError('Failed to load recipe list.');
        console.error("Failed to load recipe list:", _err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchList();
  }, []);

  useEffect(() => {
    setSelectedRecipeId(currentRecipe?.id ? currentRecipe.id.toString() : '');
  }, [currentRecipe?.id]);

  const groupedRecipes = useMemo(() => {
    const own: RecipeStub[] = [];
    const simpleTemplates: RecipeStub[] = [];
    const advancedTemplates: RecipeStub[] = [];

    (recipeList || []).forEach(recipe => {
      if (!recipe.isPredefined) {
        own.push(recipe);
      } else if (recipe.isTemplateAdvanced) {
        advancedTemplates.push(recipe);
      } else {
        simpleTemplates.push(recipe);
      }
    });

    return {
      userRecipes: own.sort((a, b) => a.name.localeCompare(b.name)),
      simpleTemplates: simpleTemplates.sort((a, b) => a.name.localeCompare(b.name)),
      advancedTemplates: advancedTemplates.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [recipeList]);

  const handleRecipeSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(event.target.value, 10);
    if (isNaN(id) || id === 0) {
      setSelectedRecipeId('');
      return;
    }

    if (currentRecipe && isRecipeDirty) { // Only confirm if there are unsaved changes
      // TODO: Replace window.confirm with showDialog
      if (!window.confirm("You have unsaved changes to the current recipe. Loading a new one will discard these changes. Continue?")) {
        event.target.value = selectedRecipeId; // Revert dropdown
        return;
      }
    }
    setSelectedRecipeId(event.target.value);
    setIsLoading(true);
    setError(null);
    try {
      const fetchedRecipe = await fetchFullRecipe(id); // Use the actual fetching function
      if (fetchedRecipe) {
        setRecipe(fetchedRecipe);
      } else {
        setError(`Recipe with ID ${id} not found.`);
      }
    } catch (_err) {
      setError('Failed to load selected recipe.');
      console.error("Failed to load selected recipe:", _err);
    } finally {
      setIsLoading(false);
    }
  };

  const transformRecipeToBackendPayload = (recipe: FullRecipe): BackendRecipePayload => {
    return {
      name: recipe.name,
      notes: recipe.notes,
    totalWeight: recipe.totalWeight,
    hydrationPct: recipe.hydrationPct,
    saltPct: recipe.saltPct,
    parameterValues: recipe.fieldValues
      .filter(fv => {
        const meta = fieldsMeta.find(fm => fm.id === fv.fieldId);
        // Send only *other* dynamic params that are not direct fields
        return meta ? !['name', 'notes', 'totalWeight', 'hydrationPct', 'saltPct'].includes(meta.name) : false;
      })
      .map(fv => ({ parameterId: fv.fieldId, value: fv.value })),
      steps: recipe.steps.map(step => ({
        id: step.id === 0 ? undefined : step.id, // Send step ID if it exists and is not 0
        stepTemplateId: step.stepTemplateId,
        order: step.order,
        notes: step.notes,
        description: step.description,
        parameterValues: step.fields.map(f => ({
            id: f.id === 0 ? undefined : f.id,
            parameterId: f.fieldId,
            value: f.value,
            notes: f.notes
        })),
        ingredients: step.ingredients.map(ing => ({
          id: ing.id === 0 ? undefined : ing.id,
          ingredientId: ing.ingredientId,
          amount: ing.amount, // Use amount
          calculationMode: ing.calculationMode, // Use calculationMode
          ingredientCategoryId: ing.ingredientCategoryId, // Keep if backend uses it, otherwise optional
          preparation: ing.preparation,
          notes: ing.notes,
        })),
      })),
    };
  };

  const performSaveAsNew = async (recipeToSave: FullRecipe, suggestedName: string) => {
    setIsLoading(true);
    setError(null);

    let tempName = suggestedName; // Variable to hold the input value
    const NameInputComponent = (
      <input
        type="text"
        defaultValue={suggestedName}
        onChange={(e) => (tempName = e.target.value)}
        className="border border-border rounded px-3 py-2 w-full bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition-colors"
        autoFocus
        placeholder="Enter recipe name"
      />
    );

    showDialog({
      title: "Enter name for the new recipe:",
      content: NameInputComponent,
      confirmText: "Save",
      onConfirm: async () => {
        const newName = tempName; // Use the captured input value
        if (!newName || newName.trim() === "") {
          setError("Recipe name cannot be empty.");
          setIsLoading(false); // Keep dialog open by not calling hideDialog
          return; 
        }
        const trimmedNewName = newName.trim();

        const existingRecipeWithName = recipeList.find(r => r.name === trimmedNewName);
        if (existingRecipeWithName) {
          setError(`A recipe named "${trimmedNewName}" already exists. Please choose a different name to save as new.`);
          setIsLoading(false); // Keep dialog open
          return;
        }

        try {
          const payload = transformRecipeToBackendPayload({ ...recipeToSave, name: trimmedNewName, id: 0 });
          const savedRecipe = await apiSaveNewRecipe(payload);
          setRecipe(savedRecipe);
          await fetchRecipeList();
          setSelectedRecipeId(savedRecipe.id.toString());
          // TODO: showToast('Recipe saved successfully!', { type: 'success' });
          console.log('Success: Recipe saved successfully!'); 
        } catch (_err) {
          setError('Failed to save recipe.');
          // TODO: showToast('Failed to save recipe.', { type: 'error' });
          console.error("Failed to save recipe:", _err);
        } finally {
          setIsLoading(false);
          hideDialog(); // Close the name input dialog
        }
      },
      onCancel: () => {
        setIsLoading(false);
        // setError(null); // Optionally clear error if dialog is cancelled
        hideDialog(); // Close the name input dialog
      }
    });
  };

  const handleUpdateOrSave = async () => {
    if (!currentRecipe) {
      setError("No recipe loaded.");
      // TODO: showToast("No recipe loaded.", { type: 'error' });
      return;
    }

    // If it's a predefined template
    if (currentRecipe.isPredefined) {
      performSaveAsNew(currentRecipe, currentRecipe.name);
      return;
    }

    // If it's a new, unsaved recipe (ID 0)
    if (currentRecipe.id === 0) {
      performSaveAsNew(currentRecipe, currentRecipe.name || "Untitled");
      return;
    }

    // Existing user recipe: Ask to update or save as new
    showDialog({
      title: "Save Changes",
      content: `Do you want to update the existing recipe "${currentRecipe.name}" or save it as a new copy?`,
      confirmText: "Update Existing",
      onConfirm: async () => {
        // Perform Update
        setIsLoading(true);
        setError(null);
        try {
          const payload = transformRecipeToBackendPayload(currentRecipe);
          const updatedRecipe = await apiUpdateExistingRecipe(currentRecipe.id, payload);
          setRecipe(updatedRecipe);
          await fetchRecipeList();
          // TODO: showToast('Recipe updated successfully!', { type: 'success' });
          console.log('Success: Recipe updated successfully!'); 
        } catch (_err) {
          setError('Failed to update recipe.');
          // TODO: showToast('Failed to update recipe.', { type: 'error' });
          console.error("Failed to update recipe:", _err);
        } finally {
          setIsLoading(false);
          hideDialog(); // Close this dialog after update
        }
      },
      cancelText: "Save as New Copy",
      onCancel: () => {
        hideDialog(); // Hide the current "Update/Save as New" dialog first
        // Use a minimal timeout to ensure the UI has processed the hideDialog
        setTimeout(() => {
          performSaveAsNew(currentRecipe, currentRecipe.name);
        }, 0); // 0ms timeout is often enough to push to next event loop tick
      }
    });
  };

  const handleNewFromBase = async () => {
    if (currentRecipe && isRecipeDirty) { // Only confirm if there are unsaved changes
      showDialog({
        title: "Unsaved Changes",
        content: "You have unsaved changes. Creating a new recipe will discard them. Continue?",
        confirmText: "Continue",
        onConfirm: () => {
          hideDialog();
          proceedWithNewFromBase();
        },
        onCancel: () => { hideDialog(); /* User cancelled */ }
      });
      return; // Don't proceed until dialog is resolved
    }
    proceedWithNewFromBase();
  };

  const proceedWithNewFromBase = async () => { // Extracted logic
    setIsLoading(true);
    setError(null);
    try {
      // Find the first available template from the grouped list
      let firstTemplateStub: RecipeStub | undefined = groupedRecipes.simpleTemplates[0];
      if (!firstTemplateStub && groupedRecipes.advancedTemplates.length > 0) {
        firstTemplateStub = groupedRecipes.advancedTemplates[0];
      }

      if (!firstTemplateStub) {
        setError("No predefined templates available to start a new recipe.");
        // TODO: showToast("No predefined templates available.", { type: 'info' });
        setIsLoading(false);
        return;
      }

      // Fetch the full details of this first template
      const baseRecipe = await fetchFullRecipe(firstTemplateStub.id);

      if (baseRecipe) {
        let newName = "Untitled Recipe"; // Match the naming from [id].tsx
        let counter = 1;
        while (recipeList.some(r => r.name === newName)) {
          newName = `Untitled ${counter}`;
          counter++;
        }

        const newRecipe: FullRecipe = {
          ...baseRecipe,
          id: 0,
          name: newName,
      notes: baseRecipe.notes, // Copy notes directly
      totalWeight: baseRecipe.totalWeight,
      hydrationPct: baseRecipe.hydrationPct,
      saltPct: baseRecipe.saltPct,
          steps: baseRecipe.steps.map((step, stepIdx) => ({
            ...step,
            id: -(Date.now() + stepIdx + Math.floor(Math.random() * 100000) + 3000), // Unique temporary ID
            recipeId: 0,
            order: step.order || stepIdx + 1,
            fields: step.fields.map((f, fIdx) => ({ ...f, id: -(Date.now() + stepIdx + fIdx + Math.floor(Math.random() * 100000) + 4000), recipeStepId: 0 } as RecipeStepField)),
            ingredients: step.ingredients.map((i, iIdx) => ({ ...i, id: -(Date.now() + stepIdx + iIdx + Math.floor(Math.random() * 100000) + 5000), recipeStepId: 0 } as RecipeStepIngredient)),
          } as RecipeStep)),
      fieldValues: baseRecipe.fieldValues
        .filter(fv => {
          const meta = fieldsMeta.find(fm => fm.id === fv.fieldId);
          return meta ? !['name', 'notes'].includes(meta.name) : false; // Copy only *other* dynamic params
        }).map(fv => ({ ...fv } as RecipeFieldValue)),
        };
        setRecipe(newRecipe);
        setSelectedRecipeId(''); // Clear selection as it's a new, unsaved recipe
      } else {
        setError(`Could not load the details for the template: ${firstTemplateStub.name}.`);
        // TODO: showToast(`Could not load template: ${firstTemplateStub.name}.`, { type: 'error' });
      }
    } catch (_err) {
      setError('Failed to create new recipe from template.');
      // TODO: showToast('Failed to create new recipe.', { type: 'error' });
      console.error("Failed to create new recipe from template:", _err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const recipeForDelete = currentRecipe; // Assign to a new const for clearer type narrowing

    if (!recipeForDelete) {
      showDialog({
        title: "Cannot Delete",
        content: "No recipe is currently loaded to delete.",
        confirmText: "OK",
        onConfirm: hideDialog,
        hideCancelButton: true,
      });
      return;
    }

    // Now use recipeForDelete, which TypeScript knows is not null here
    if (recipeForDelete.id === 0 || recipeForDelete.isPredefined) {
      showDialog({
        title: "Cannot Delete",
        content: "Cannot delete a new, unsaved recipe or a predefined template.",
        confirmText: "OK",
        onConfirm: hideDialog,
        hideCancelButton: true,
      });
      return;
    }

    showDialog({
      title: "Confirm Deletion",
      content: `Are you sure you want to delete the recipe "${recipeForDelete.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      onConfirm: async () => {
      setIsLoading(true);
      setError(null);
      try {
        await apiDeleteRecipe(recipeForDelete.id);
        // TODO: showToast(`Recipe "${recipeForDelete.name}" deleted successfully.`, { type: 'success' });
        console.log(`Success: Recipe "${recipeForDelete.name}" deleted successfully.`); 
        // Optionally, load the base template or clear the current recipe
        await fetchRecipeList(); // Refresh list first
        hideDialog(); // Close the confirmation dialog
        handleNewFromBase(); // Load new from base after delete
      } catch (_err) {
        setError('Failed to delete recipe.');
        // TODO: showToast('Failed to delete recipe.', { type: 'error' });
        console.error("Failed to delete recipe:", _err);
      }
      finally {
        setIsLoading(false);
      }
      },
      onCancel: () => { hideDialog(); /* User cancelled deletion */ }
    });
  };

  const handleStartBake = async () => {
    if (!currentRecipe || currentRecipe.id === 0) {
      showDialog({ // This check is fine as it's the first one for currentRecipe in this function
        title: "Recipe Not Ready",
        content: "Please save or load a recipe before starting a bake.",
        confirmText: "OK",
        onConfirm: hideDialog,
        hideCancelButton: true,
      });
      return;
    }
    if (isRecipeDirty) {
      showDialog({
        title: "Unsaved Changes",
        content: "You have unsaved changes. It's recommended to save them before starting a bake. Continue to start bake with the last saved version?",
        confirmText: "Continue to Bake",
        onConfirm: () => {
          hideDialog();
          proceedWithStartBake();
        },
        onCancel: () => { hideDialog(); /* User cancelled */ }
      });
      return; // Don't proceed until dialog is resolved
    }
    proceedWithStartBake();
  };

  const proceedWithStartBake = async () => { // Extracted logic
    clearBakeError(); // Clear any previous bake errors
    // Add a null check for currentRecipe here as well, as its state might have changed
    // if there was a delay (e.g. user interaction with dialog) before this function is called.
    if (!currentRecipe) {
        console.error("Cannot start bake, current recipe is null.");
        // TODO: showToast('Error: No recipe loaded to start bake.', { type: 'error' });
        // Optionally show a dialog or set an error state
        return;
    }
    const newBake = await initiateBake(currentRecipe.id, `Bake of ${currentRecipe.name}`);

    if (newBake) {
      // Navigate to the bakes list page or directly to the new bake's detail page
      history.push(`/bakes`); // For react-router-dom v5. Or history.push(`/bakes/${newBake.id}`);
    } else {
      // bakeError will be set in the store, you could display it here or rely on a global error display
      // Replace alert with a toast notification or more integrated error display
      // TODO: showToast(`Failed to start bake: ${bakeError || 'Unknown error'}`, { type: 'error' });
      console.error(`Failed to start bake: ${bakeError || 'Unknown error'}`); // Placeholder for showToast/setError
    }
  };


  const canPerformActions = !isLoading && currentRecipe && !isBakeLoading;
  const canStartBake = !!(currentRecipe && currentRecipe.id !== 0 && !isBakeLoading);

  return (
    <>
      <ResponsiveActionBar
        onSave={handleUpdateOrSave}
        onStartBake={handleStartBake}
        isSavingOrLoading={isLoading || isBakeLoading}
        canStartBake={canStartBake}
      />
      <div className="p-4 border border-border rounded-lg shadow-card bg-surface-elevated mt-4 md:mt-6 mb-6"> {/* Added mt-4/md:mt-6 to account for sticky bar */}
        <h2 className="text-xl font-bold mb-3 text-text-primary">Recipe Management</h2>
        {isLoading && <div className="text-accent-500">Loading...</div>}
        {error && <div className="text-danger-700 p-2 my-2 border border-danger-200 rounded bg-danger-50">{error}</div>}
      {isBakeLoading && <div className="text-accent-500">Starting bake...</div>}
      {bakeError && <div className="text-danger-700 p-2 my-2 border border-danger-200 rounded bg-danger-50">Bake Error: {bakeError}</div>}

      <div className="mb-3">
        <label htmlFor="recipe-select" className="block text-sm font-medium text-text-secondary mb-1">
          Load Recipe:
        </label>
        <select
          id="recipe-select"
          value={selectedRecipeId}
          onChange={handleRecipeSelect}
          disabled={isLoading || isBakeLoading}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition-colors"
        >
          <option value="">-- Select a Recipe --</option>
          {groupedRecipes.userRecipes.length > 0 && (
            <optgroup label="My Recipes">
              {groupedRecipes.userRecipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </optgroup>
          )}
          {groupedRecipes.simpleTemplates.length > 0 && (
            <optgroup label="Simple Templates">
              {groupedRecipes.simpleTemplates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </optgroup>
          )}
          {groupedRecipes.advancedTemplates.length > 0 && (
            <optgroup label="Advanced Templates">
              {groupedRecipes.advancedTemplates.map((r) => (
                <option key={r.id} value={r.id}>{r.name} (Advanced)</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
        {/* "Update / Save" and "Start Bake" buttons are now in ResponsiveActionBar */}
        <button
          onClick={handleNewFromBase}
          disabled={isLoading || isBakeLoading} // Disable if any operation is in progress
          className="btn-secondary"
        >
          New
        </button>
        <button
          onClick={handleDelete}
          disabled={!canPerformActions || currentRecipe?.isPredefined || currentRecipe?.id === 0}
          className="btn-danger"
          aria-label="Delete"
          title="Delete"
        >
          🗑️
        </button>
      </div>
      </div>
    </>
  );
}
