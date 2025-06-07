// RecipeControls.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useRecipeBuilderStore } from '../../store/recipeBuilderStore';
import type { FullRecipe, RecipeFieldValue, RecipeStep, RecipeStepField, RecipeStepIngredient, IngredientCalculationMode } from '../../types/recipe';
import { apiGet } from '../../utils/api'; // Import your actual apiGet function

// Define RecipeStub based on the Recipe type for the dropdown
type RecipeStub = {
  id: number;
  name: string;
  isPredefined?: boolean;
  isTemplateAdvanced?: boolean; // True if a predefined template is considered advanced
};

async function fetchFullRecipe(id: number): Promise<FullRecipe | null> {
  // Use your actual apiGet function to fetch the full recipe details
  // The backend endpoint /api/recipes/:id/full should return data matching FullRecipe
  return apiGet<FullRecipe>(`/recipes/${id}/full`);
}

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

async function apiSaveRecipe(payload: BackendRecipePayload): Promise<FullRecipe> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newId = Math.floor(Math.random() * 1000) + 100;
  return {
    id: newId,
    name: payload.name,
    notes: payload.notes ?? undefined,
  totalWeight: payload.totalWeight,
  hydrationPct: payload.hydrationPct,
  saltPct: payload.saltPct,
  fieldValues: payload.parameterValues.map(pv => ({ fieldId: pv.parameterId, value: String(pv.value) } as RecipeFieldValue)),
    steps: payload.steps?.map((s, idx) => ({
      id: idx + 1000, // Simulate new step IDs
      recipeId: newId,
      stepTemplateId: s.stepTemplateId,
      order: s.order,
      notes: s.notes,
      description: s.description,
      fields: s.parameterValues?.map(spv => ({ id: idx + 2000, recipeStepId: idx + 1000, fieldId: spv.parameterId, value: spv.value, notes: spv.notes } as RecipeStepField)) || [],
      ingredients: s.ingredients?.map(ing => ({
        ...ing, // This would include amount and calculationMode if payload was correct
        id: idx + 3000, // Simulate new ID
        recipeStepId: idx + 1000, // Simulate new recipeStepId
        // Ensure amount and calculationMode are present for the type cast
      } as RecipeStepIngredient)) || []
    } as RecipeStep)) || []
  };
}

async function apiUpdateRecipe(id: number, payload: BackendRecipePayload): Promise<FullRecipe> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    id,
    name: payload.name,
    notes: payload.notes ?? undefined,
  totalWeight: payload.totalWeight,
  hydrationPct: payload.hydrationPct,
  saltPct: payload.saltPct,
  fieldValues: payload.parameterValues.map(pv => ({ fieldId: pv.parameterId, value: String(pv.value) } as RecipeFieldValue)),
    steps: payload.steps?.map((s, idx) => ({
      id: s.id || idx + 1000,
      recipeId: id,
      stepTemplateId: s.stepTemplateId,
      order: s.order,
      notes: s.notes,
      description: s.description,
      fields: s.parameterValues?.map(spv => ({ id: spv.id || idx + 2000, recipeStepId: s.id || idx + 1000, fieldId: spv.parameterId, value: spv.value, notes: spv.notes } as RecipeStepField)) || [],
      ingredients: s.ingredients?.map(ing => ({
        ...ing, // This would include amount and calculationMode if payload was correct
        id: ing.id || idx + 3000,
        recipeStepId: s.id || idx + 1000,
      } as RecipeStepIngredient)) || []
    } as RecipeStep)) || []
  };
}

const SIMPLE_BASE_RECIPE_ID = 1;
// --- End Placeholder API functions ---


export default function RecipeControls() {
  const currentRecipe = useRecipeBuilderStore(state => state.recipe);
  const setRecipe = useRecipeBuilderStore(state => state.setRecipe);
  const fieldsMeta = useRecipeBuilderStore(state => state.fieldsMeta); // Access fieldsMeta from the store

  const [recipeList, setRecipeList] = useState<RecipeStub[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (currentRecipe) {
      if (!window.confirm("You have an active recipe. Loading a new one will discard any unsaved changes. Continue?")) {
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

  const handleSave = async () => {
    if (!currentRecipe || currentRecipe.id !== 0) {
      alert("This recipe is not new. Use 'Update' or create a new one first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = transformRecipeToBackendPayload(currentRecipe);
      const savedRecipe = await apiSaveRecipe(payload);
      setRecipe(savedRecipe);
      alert('Recipe saved successfully!');
    } catch (_err) {
      setError('Failed to save recipe.');
      console.error("Failed to save recipe:", _err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!currentRecipe || currentRecipe.id === 0) {
      alert('No existing recipe loaded to update. Use "Save" for new recipes.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = transformRecipeToBackendPayload(currentRecipe);
      const updatedRecipe = await apiUpdateRecipe(currentRecipe.id, payload);
      setRecipe(updatedRecipe);
      // Note: Backend PUT /api/recipes/:id currently only updates top-level parameterValues.
      // Full step/ingredient updates require backend enhancement.
      alert('Recipe updated successfully!');
    } catch (_err) {
      setError('Failed to update recipe.');
      console.error("Failed to update recipe:", _err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = async () => {
    if (currentRecipe) {
      if (!window.confirm("You have an active recipe. Creating a new one will discard any unsaved changes. Continue?")) {
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

  const canUpdate = !isLoading && currentRecipe && currentRecipe.id !== 0;
  const canSave = !isLoading && currentRecipe && currentRecipe.id === 0;


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
          onClick={handleSave}
          disabled={!canSave}
          className="px-4 py-2 flex-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed text-center"
        >
          Save New Recipe
        </button>
        <button
          onClick={handleUpdate}
          disabled={!canUpdate}
          className="px-4 py-2 flex-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed text-center"
        >
          Update Current Recipe
        </button>
        <button
          onClick={handleNew}
          disabled={isLoading}
          className="px-4 py-2 flex-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed text-center"
        >
          New from Base
        </button>
      </div>
    </div>
  );
}
