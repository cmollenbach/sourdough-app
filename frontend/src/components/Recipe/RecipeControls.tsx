// RecipeControls.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useRecipeBuilderStore } from '../../store/recipeBuilderStore';
import type { FullRecipe, RecipeFieldValue, RecipeStep, RecipeStepField, RecipeStepIngredient, IngredientCalculationMode } from '../../types/recipe';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api'; // Import all needed API utils

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


const SIMPLE_BASE_RECIPE_ID = 1;
// --- End Placeholder API functions ---


export default function RecipeControls() {
  const currentRecipe = useRecipeBuilderStore(state => state.recipe);
  const setRecipe = useRecipeBuilderStore(state => state.setRecipe);
  const fieldsMeta = useRecipeBuilderStore(state => state.fieldsMeta); // Access fieldsMeta from the store
  const isRecipeDirty = useRecipeBuilderStore(state => state.isRecipeDirty); // Get the dirty flag

  const [recipeList, setRecipeList] = useState<RecipeStub[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const newName = window.prompt("Enter name for the new recipe:", suggestedName);
    if (!newName || newName.trim() === "") {
      setIsLoading(false);
      return; // User cancelled or entered empty name
    }
    try {
      const payload = transformRecipeToBackendPayload({ ...recipeToSave, name: newName.trim(), id: 0 });
      const savedRecipe = await apiSaveNewRecipe(payload); // Use real API call
      setRecipe(savedRecipe);
      await fetchRecipeList(); // Refresh the recipe list
      setSelectedRecipeId(savedRecipe.id.toString()); // Select the newly saved recipe
      alert('Recipe saved successfully!');
    } catch (_err) {
      setError('Failed to save recipe.');
      console.error("Failed to save recipe:", _err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrSave = async () => {
    if (!currentRecipe) {
      setError("No recipe loaded.");
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
    const shouldUpdate = window.confirm(
      `Do you want to update the existing recipe "${currentRecipe.name}"?\n\n(OK = Update, Cancel = Save as New)`
    );

    if (!shouldUpdate) {
      performSaveAsNew(currentRecipe, currentRecipe.name);
      return;
    }

    // Perform Update
    setIsLoading(true);
    setError(null);
    try {
      const payload = transformRecipeToBackendPayload(currentRecipe);
      const updatedRecipe = await apiUpdateExistingRecipe(currentRecipe.id, payload); // Use real API call
      setRecipe(updatedRecipe);
      await fetchRecipeList(); // Refresh the recipe list
      // setSelectedRecipeId(updatedRecipe.id.toString()); // Already selected, but good for consistency if needed
      alert('Recipe updated successfully!');
    } catch (_err) {
      setError('Failed to update recipe.');
      console.error("Failed to update recipe:", _err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewFromBase = async () => {
    if (currentRecipe && isRecipeDirty) { // Only confirm if there are unsaved changes
      if (!window.confirm("You have unsaved changes to the current recipe. Creating a new one will discard these changes. Continue?")) {
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const baseRecipe = await fetchFullRecipe(SIMPLE_BASE_RECIPE_ID); // Use the actual fetching function
      if (baseRecipe) {
        let newName = "Untitled";
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
            id: 0,
            recipeId: 0,
            order: step.order || stepIdx + 1,
            fields: step.fields.map(f => ({ ...f, id: 0, recipeStepId: 0 } as RecipeStepField)),
            ingredients: step.ingredients.map(i => ({ ...i, id: 0, recipeStepId: 0 } as RecipeStepIngredient)),
          } as RecipeStep)),
      fieldValues: baseRecipe.fieldValues
        .filter(fv => {
          const meta = fieldsMeta.find(fm => fm.id === fv.fieldId);
          return meta ? !['name', 'notes'].includes(meta.name) : false; // Copy only *other* dynamic params
        }).map(fv => ({ ...fv } as RecipeFieldValue)),
        };
        setRecipe(newRecipe);
      } else {
        setError('Simple Base Recipe template not found.');
      }
    } catch (_err) {
      setError('Failed to create new recipe from template.');
      console.error("Failed to create new recipe from template:", _err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentRecipe || currentRecipe.id === 0 || currentRecipe.isPredefined) {
      alert("Cannot delete a new, unsaved recipe or a predefined template.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete the recipe "${currentRecipe.name}"? This action cannot be undone.`)) {
      setIsLoading(true);
      setError(null);
      try {
        await apiDeleteRecipe(currentRecipe.id);
        alert(`Recipe "${currentRecipe.name}" deleted successfully.`);
        // Optionally, load the base template or clear the current recipe
        await fetchRecipeList(); // Refresh list first
        handleNewFromBase(); // Load new from base after delete
      } catch (_err) {
        setError('Failed to delete recipe.');
        console.error("Failed to delete recipe:", _err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const canPerformActions = !isLoading && currentRecipe;

  return (
    <div className="p-4 border rounded-lg shadow bg-white mb-6">
      <h2 className="text-xl font-bold mb-3">Recipe Controls</h2>
      {isLoading && <div className="text-blue-500">Loading...</div>}
      {error && <div className="text-red-500 p-2 my-2 border border-red-300 rounded bg-red-50">{error}</div>}

      <div className="mb-3">
        <label htmlFor="recipe-select" className="block text-sm font-medium text-gray-700 mb-1">
          Load Recipe:
        </label>
        <select
          id="recipe-select"
          value={selectedRecipeId}
          onChange={handleRecipeSelect}
          disabled={isLoading}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleUpdateOrSave}
          disabled={!canPerformActions}
          className="px-4 py-2 flex-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed text-center"
        >
          Update / Save
        </button>
        <button
          onClick={handleNewFromBase}
          disabled={isLoading} // Disable if any operation is in progress
          className="px-4 py-2 flex-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed text-center"
        >
          New
        </button>
        <button
          onClick={handleDelete}
          disabled={!canPerformActions || currentRecipe?.isPredefined || currentRecipe?.id === 0}
          className="px-4 py-2 flex-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-60 disabled:cursor-not-allowed text-center"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
