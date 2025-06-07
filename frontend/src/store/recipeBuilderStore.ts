import { create } from 'zustand';

import type { FullRecipe, RecipeStep, RecipeStepIngredient } from '../types/recipe'; // Removed unused RecipeFieldValue
// If IngredientCalculationMode is defined in your schema.prisma and you've run `npx prisma generate`,
// it's better to import it from the generated client for consistency with the backend.
// import { IngredientCalculationMode } from '@prisma/client';
// If IngredientCalculationMode is defined in your frontend types (e.g., src/types/recipe.ts):
import { IngredientCalculationMode } from '../types/recipe';
import type { StepTemplate, IngredientMeta, FieldMeta } from '../types/recipeLayout';
import type { IngredientCategoryMeta } from '../types/recipeLayout'; // Import IngredientCategoryMeta
// import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

// interface BackendRecipeStepIngredientPayload { // Commented out as it's currently unused
//   ingredientId: number;
//   amount: number;
//   calculationMode: string; // Backend might expect string representation of enum
//   preparation?: string | null;
//   notes?: string | null;
// }
// interface BackendRecipeStepPayload { // Commented out as it's currently unused
//   stepTemplateId: number;
//   order: number;
//   notes?: string | null;
//   description?: string | null;
//   parameterValues?: { parameterId: number; value: string | number | boolean | null; notes?: string | null }[];
//   ingredients?: BackendRecipeStepIngredientPayload[];
// }

// interface BackendRecipePayload { // Commented out as it's currently unused
//   totalWeight?: number | null;
//   hydrationPct?: number | null;
//   saltPct?: number | null;
//   parameterValues: { parameterId: number, value: string | number | boolean | null }[];
//   steps?: BackendRecipeStepPayload[];
// }

interface RecipeBuilderState {
  recipe: FullRecipe | null;
  stepTemplates: StepTemplate[];
  ingredientsMeta: IngredientMeta[];
  fieldsMeta: FieldMeta[];
  ingredientCategoriesMeta: IngredientCategoryMeta[]; // Added for category metadata
  showAdvanced: boolean;
  isLoading: boolean;
  error: string | null;

  setRecipe: (recipe: FullRecipe) => void;
  setStepTemplates: (templates: StepTemplate[]) => void;
  setIngredientsMeta: (ingredients: IngredientMeta[]) => void;
  setFieldsMeta: (fields: FieldMeta[]) => void;
  setIngredientCategoriesMeta: (categories: IngredientCategoryMeta[]) => void; // Added setter
  setShowAdvanced: (show: boolean) => void;

  updateRecipeDetails: (details: Partial<Pick<FullRecipe, 'name' | 'notes' | 'totalWeight' | 'hydrationPct' | 'saltPct'>>) => void;
  addStep: (newStepData: Partial<Omit<RecipeStep, 'id' | 'recipeId' | 'order' | 'fields' | 'ingredients'>> & { stepTemplateId: number }, template?: StepTemplate) => void;
  updateStep: (step: RecipeStep) => void;
  removeStep: (stepId: number) => void;
  reorderSteps: (newStepsArray: RecipeStep[]) => void; // Added for reordering

  addIngredientToStep: (stepId: number, newIngredientData: Omit<RecipeStepIngredient, 'id' | 'recipeStepId'>) => void;
  updateIngredientInStep: (stepId: number, ingredientIdOrTempId: number, ingredientUpdates: Partial<RecipeStepIngredient>) => void;
  removeIngredientFromStep: (stepId: number, ingredientIdOrTempId: number) => void;

  // Async actions (examples, implement with your API calls)
  // loadRecipeList: () => Promise<void>;
  // loadFullRecipe: (id: number) => Promise<void>;
  // saveCurrentRecipe: () => Promise<void>;
  // cloneRecipeFromTemplate: (templateId: number) => Promise<void>;
  // Add more actions as needed
}

export const useRecipeBuilderStore = create<RecipeBuilderState>((set) => ({
  recipe: null,
  stepTemplates: [],
  ingredientsMeta: [],
  fieldsMeta: [],
  ingredientCategoriesMeta: [], // Initialize as empty array
  showAdvanced: false,
  isLoading: false,
  error: null,

  setRecipe: (recipe) => set({ recipe }),
  setStepTemplates: (templates) => set({ stepTemplates: templates }),
  setIngredientsMeta: (ingredients) => set({ ingredientsMeta: ingredients }),
  setFieldsMeta: (fields) => set({ fieldsMeta: fields }),
  setIngredientCategoriesMeta: (categories) => set({ ingredientCategoriesMeta: categories }), // Added setter implementation
  setShowAdvanced: (show) => set({ showAdvanced: show }),

  updateRecipeDetails: (details) => set(state => {
    if (!state.recipe) return { error: "No active recipe to update details." };
    // Handle name and notes which might be in fieldValues or direct properties
    // depending on your FullRecipe type and how you manage them.
    // For this example, we assume they are direct properties on FullRecipe for simplicity in the store.
    // If they are purely from fieldValues, this logic would need to adjust fieldValues array.
    const updatedRecipe = { ...state.recipe, ...details };
    return { recipe: updatedRecipe, error: null };
  }),

  addStep: (newStepData, template) => set(state => {
    if (!state.recipe) return { error: "No active recipe to add a step to." };
    const newStep: RecipeStep = {
      id: -(state.recipe.steps.length + 1 + Date.now()), // Unique temporary ID
      recipeId: state.recipe.id, // Or 0 if it's a new recipe not yet saved
      order: state.recipe.steps.length + 1,
      stepTemplateId: newStepData.stepTemplateId,
      notes: newStepData.notes ?? null,
      description: newStepData.description ?? null,
      fields: template?.fields.map(f => ({ id: -(Date.now() + f.fieldId), recipeStepId: 0, fieldId: f.fieldId, value: f.defaultValue ?? (f.field?.type === 'number' ? 0 : ''), notes: null })) || [],
      ingredients: template?.ingredientRules.map(ir => ({
        id: -(Date.now() + ir.ingredientCategoryId), recipeStepId: 0, ingredientId: 0, // Default to "select ingredient"
        amount: 0,
        // Access ingredientsMeta from the store's state
        // Assuming IngredientMeta has a defaultCalculationMode property
        calculationMode: (state.ingredientsMeta.find((im: IngredientMeta) => im.ingredientCategoryId === ir.ingredientCategoryId)?.defaultCalculationMode || IngredientCalculationMode.PERCENTAGE),
        ingredientCategoryId: ir.ingredientCategoryId, preparation: null, notes: null,
      })) || [],
    };
    return { recipe: { ...state.recipe, steps: [...state.recipe.steps, newStep].sort((a, b) => a.order - b.order) }, error: null };
  }),

  updateStep: (updatedStep) => set(state => {
    if (!state.recipe) return {};
    // If the step has an ID of 0, it's a new step, so add it.
    // Otherwise, update the existing step.
    const stepExists = updatedStep.id !== 0 && state.recipe.steps.some(s => s.id === updatedStep.id);

    let newSteps: RecipeStep[];
    if (stepExists) {
      newSteps = state.recipe.steps.map(s =>
        s.id === updatedStep.id ? updatedStep : s
      );
    } else {
      // For a new step, assign a temporary negative ID if it's 0 to ensure unique keys before saving,
      // or handle ID generation as per your backend strategy.
      // For now, we'll assume new steps might come with ID 0 and need to be added.
      // If your backend assigns IDs, this logic might differ slightly.
      // A more robust way for new steps is to have a dedicated `addStep` action.
      // This `updateStep` is now more like `addOrUpdateStep`.
      const tempNewStep = updatedStep.id === 0
        ? { ...updatedStep, id: -(state.recipe.steps.length + 1) } // Example: temp negative ID
        : updatedStep;
      newSteps = [...state.recipe.steps, tempNewStep];
    }

    return {
      recipe: {
        ...state.recipe,
        steps: newSteps.sort((a, b) => a.order - b.order), // Ensure steps remain sorted by order
      },
    };
  }),
  removeStep: (stepId) => set(state => ({
    recipe: state.recipe
      ? {
          ...state.recipe,
          steps: state.recipe.steps.filter(s => s.id !== stepId)
                                 .map((step, index) => ({ ...step, order: index + 1 })), // Re-order after removal
        }
      : null,
  })),
  reorderSteps: (newStepsArray) =>
    set((state) => {
      if (state.recipe) {
        return {
          recipe: { ...state.recipe, steps: newStepsArray },
        };
      }
      return {};
    }),

  addIngredientToStep: (stepId, newIngredientData) => set(state => {
    if (!state.recipe) return { error: "No active recipe." };
    const newSteps = state.recipe.steps.map(step => {
      if (step.id === stepId) {
        const newIngredient: RecipeStepIngredient = {
          ...newIngredientData,
          id: -(step.ingredients.length + 1 + Date.now()), // Unique temp ID
          recipeStepId: step.id, // This will be 0 or a real ID if step is saved
        };
        return { ...step, ingredients: [...step.ingredients, newIngredient] };
      }
      return step;
    });
    return { recipe: { ...state.recipe, steps: newSteps }, error: null };
  }),

  updateIngredientInStep: (stepId, ingredientIdOrTempId, ingredientUpdates) => set(state => {
    if (!state.recipe) return { error: "No active recipe." };
    const newSteps = state.recipe.steps.map(step => {
      if (step.id === stepId) {
        const newIngredients = step.ingredients.map(ing =>
          ing.id === ingredientIdOrTempId ? { ...ing, ...ingredientUpdates } : ing
        );
        return { ...step, ingredients: newIngredients };
      }
      return step;
    });
    return { recipe: { ...state.recipe, steps: newSteps }, error: null };
  }),

  removeIngredientFromStep: (stepId, ingredientIdOrTempId) => set(state => {
    if (!state.recipe) return { error: "No active recipe." };
    const newSteps = state.recipe.steps.map(step => {
      if (step.id === stepId) {
        const newIngredients = step.ingredients.filter(ing => ing.id !== ingredientIdOrTempId);
        return { ...step, ingredients: newIngredients };
      }
      return step;
    });
    return { recipe: { ...state.recipe, steps: newSteps }, error: null };
  }),

  // --- Example Async Actions (implement with your actual API calls) ---
  // loadFullRecipe: async (id: number) => {
  //   set({ isLoading: true, error: null });
  //   try {
  //     const recipe = await apiGet<FullRecipe>(`/recipes/${id}/full`); // Replace with actual API call
  //     if (recipe) {
  //       set({ recipe, isLoading: false });
  //     } else {
  //       set({ isLoading: false, error: `Recipe with ID ${id} not found.` });
  //     }
  //   } catch (err) {
  //     console.error("Failed to load recipe:", err);
  //     set({ isLoading: false, error: 'Failed to load recipe.' });
  //   }
  // },

  // saveCurrentRecipe: async () => {
  //   const currentRecipe = get().recipe;
  //   if (!currentRecipe) {
  //     set({ error: "No recipe to save." });
  //     return;
  //   }
  //   set({ isLoading: true, error: null });
  //   try {
  //     // const payload = transformRecipeToBackendPayload(currentRecipe); // You'll need this transformation
  //     let savedRecipe: FullRecipe;
  //     // if (currentRecipe.id === 0) { // Assuming 0 means new
  //     //   savedRecipe = await apiPost<FullRecipe>('/recipes', payload);
  //     // } else {
  //     //   savedRecipe = await apiPut<FullRecipe>(`/recipes/${currentRecipe.id}`, payload);
  //     // }
  //     // set({ recipe: savedRecipe, isLoading: false });
  //     // alert('Recipe saved successfully!'); // Or use a toast notification
  //   } catch (err) {
  //     console.error("Failed to save recipe:", err);
  //     set({ isLoading: false, error: 'Failed to save recipe.' });
  //   }
  // },
}));
