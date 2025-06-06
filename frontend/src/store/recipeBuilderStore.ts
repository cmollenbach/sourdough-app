import { create } from "zustand";
import type { FullRecipe, RecipeStep } from "../types/recipe";

interface RecipeBuilderState {
  recipe: FullRecipe | null;
  setRecipe: (recipe: FullRecipe) => void;
  updateStep: (step: RecipeStep) => void;
  removeStep: (stepId: number) => void;
  // Add more actions as needed
}

export const useRecipeBuilderStore = create<RecipeBuilderState>((set) => ({
  recipe: null,
  setRecipe: (recipe) => set({ recipe }),
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