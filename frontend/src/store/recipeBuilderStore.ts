import { create } from 'zustand';

import type { FullRecipe, RecipeStep } from '../types/recipe';
import type { StepTemplate, IngredientMeta, FieldMeta } from '../types/recipeLayout';


interface RecipeBuilderState {
  recipe: FullRecipe | null;
  stepTemplates: StepTemplate[];
  ingredientsMeta: IngredientMeta[];
  fieldsMeta: FieldMeta[];
  showAdvanced: boolean;
  setRecipe: (recipe: FullRecipe) => void;
  setStepTemplates: (templates: StepTemplate[]) => void;
  setIngredientsMeta: (ingredients: IngredientMeta[]) => void;
  setFieldsMeta: (fields: FieldMeta[]) => void;
  setShowAdvanced: (show: boolean) => void;
  updateStep: (step: RecipeStep) => void;
  removeStep: (stepId: number) => void;
  reorderSteps: (newStepsArray: RecipeStep[]) => void; // Added for reordering
  // Add more actions as needed
}

export const useRecipeBuilderStore = create<RecipeBuilderState>((set) => ({
  recipe: null,
  stepTemplates: [],
  ingredientsMeta: [],
  fieldsMeta: [],
  showAdvanced: false,
  setRecipe: (recipe) => set({ recipe }),
  setStepTemplates: (templates) => set({ stepTemplates: templates }),
  setIngredientsMeta: (ingredients) => set({ ingredientsMeta: ingredients }),
  setFieldsMeta: (fields) => set({ fieldsMeta: fields }),
  setShowAdvanced: (show) => set({ showAdvanced: show }),
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
}));
