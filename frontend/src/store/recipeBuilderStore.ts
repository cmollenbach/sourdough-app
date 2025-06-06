import { create } from "zustand";
import type { FullRecipe, RecipeStep } from "../types/recipe";
import type { StepTemplate, IngredientMeta, FieldMeta } from "../types/recipeLayout";

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
  updateStep: (updatedStep) => set(state => ({
    recipe: state.recipe
      ? {
          ...state.recipe,
          steps: state.recipe.steps.map(s =>
            s.id === updatedStep.id ? updatedStep : s
          ),
        }
      : null,
  })),
  removeStep: (stepId) => set(state => ({
    recipe: state.recipe
      ? {
          ...state.recipe,
          steps: state.recipe.steps.filter(s => s.id !== stepId),
        }
      : null,
  })),
}));