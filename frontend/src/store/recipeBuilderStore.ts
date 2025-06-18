import { create } from 'zustand';
import { apiGet } from '../utils/api';
import {
  type FullRecipe,
  type FieldMeta as RecipeFieldMeta,
  type IngredientMeta as RecipeIngredientMeta,
  type StepType,
  type IngredientCategory as RecipeIngredientCategory,
  type RecipeStep,
  // RecipeFieldValue was removed as it was unused in this file
} from '../types/recipe';

import type {
  StepTemplate,
  IngredientCategoryMeta,
  IngredientMeta as RecipeLayoutIngredientMeta,
  FieldMeta as RecipeLayoutFieldMeta
} from '../types/recipeLayout';

interface ApiErrorData {
  error?: string;
  message?: string;
  details?: string;
}

interface ApiError extends Error {
  response?: {
    data?: ApiErrorData;
    status?: number;
  };
}

interface RecipeBuilderState {
  recipe: FullRecipe | null;
  ingredientsMeta: RecipeLayoutIngredientMeta[];
  ingredientCategoriesMeta: IngredientCategoryMeta[];
  fieldsMeta: RecipeLayoutFieldMeta[];
  stepTemplates: StepTemplate[];
  stepTypes: StepType[];
  showAdvanced: boolean;
  isRecipeDirty: boolean;
  loading: boolean;
  error: string | null;

  fetchRecipe: (id: number) => Promise<void>;
  fetchPredefinedRecipeByName: (name: string) => Promise<FullRecipe | null>;
  fetchAllMetaData: () => Promise<void>;

  setRecipe: (recipe: FullRecipe) => void;
  setStepTemplates: (templates: StepTemplate[]) => void;
  setIngredientsMeta: (ingredients: RecipeLayoutIngredientMeta[]) => void;
  setFieldsMeta: (fields: RecipeLayoutFieldMeta[]) => void;
  setIngredientCategoriesMeta: (categories: IngredientCategoryMeta[]) => void;
  setShowAdvanced: (show: boolean) => void;
  setIsRecipeDirty: (isDirty: boolean) => void;
  updateRecipeDetails: (details: Partial<Pick<FullRecipe, 'name' | 'notes' | 'totalWeight' | 'hydrationPct' | 'saltPct'>>) => void;
  addStep: (newStepData: Partial<Omit<RecipeStep, 'id' | 'recipeId' | 'order' | 'fields' | 'ingredients'>> & { stepTemplateId: number }, template?: StepTemplate) => number | null;
  updateStep: (step: RecipeStep) => void;
  removeStep: (stepId: number) => void;
  reorderSteps: (newStepsArray: RecipeStep[]) => void;
}

export const useRecipeBuilderStore = create<RecipeBuilderState>((set) => ({
  recipe: null,
  ingredientsMeta: [],
  ingredientCategoriesMeta: [],
  fieldsMeta: [],
  stepTemplates: [],
  stepTypes: [],
  showAdvanced: false,
  isRecipeDirty: false,
  loading: false,
  error: null,

  fetchRecipe: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const recipeData = await apiGet<FullRecipe>(`/recipes/${id}`);
      set({ recipe: recipeData, loading: false });
    } catch (err) {
      console.error(`Failed to fetch recipe with id ${id}:`, err);
      set({ error: `Failed to fetch recipe (ID: ${id})`, loading: false });
    }
  },

  fetchPredefinedRecipeByName: async (name: string): Promise<FullRecipe | null> => {
    set({ loading: true, error: null });
    try {
      const recipeData = await apiGet<FullRecipe>(`/recipes/predefined/by-name?name=${encodeURIComponent(name)}`);
      set({ recipe: recipeData, loading: false });
      return recipeData;
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.error || apiError.response?.data?.message || apiError.message || `Failed to fetch predefined recipe by name: ${name}`;
      console.error(`Error fetching predefined recipe by name "${name}":`, error);
      set({ error: errorMessage, loading: false, recipe: null });
      return null;
    }
  },

  fetchAllMetaData: async () => {
    set({ loading: true, error: null });
    try {
      const [
        ingredientsResponse,
        ingredientCategoriesResponse,
        fieldsResponse,
        stepTemplatesResponse,
      ] = await Promise.all([
        apiGet<{ ingredients: RecipeIngredientMeta[] }>('/meta/ingredients'),
        apiGet<{ categories: RecipeIngredientCategory[] }>('/meta/ingredient-categories'),
        apiGet<{ fields: RecipeFieldMeta[] }>('/meta/fields'),
        apiGet<{ templates: StepTemplate[] }>('/meta/step-templates'),
      ]);
      const fetchedStepTypes: StepType[] = []; // Assuming StepType might be fetched or defined elsewhere

      const layoutIngredients: RecipeLayoutIngredientMeta[] = ingredientsResponse.ingredients.map(ing => ({
        id: ing.id,
        name: ing.name,
        ingredientCategoryId: ing.ingredientCategoryId,
      }));

      const layoutIngredientCategories: IngredientCategoryMeta[] = ingredientCategoriesResponse.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
      }));

      const layoutFields: RecipeLayoutFieldMeta[] = fieldsResponse.fields.map(field => ({
        id: field.id,
        name: field.name,
        description: field.description,
        type: field.type,
      }));

      set({
        ingredientsMeta: layoutIngredients,
        ingredientCategoriesMeta: layoutIngredientCategories,
        fieldsMeta: layoutFields,
        stepTemplates: stepTemplatesResponse.templates,
        stepTypes: fetchedStepTypes,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
      set({ error: 'Failed to fetch metadata', loading: false });
    }
  },

  setRecipe: (recipe: FullRecipe) => set({ recipe, isRecipeDirty: false }),
  setStepTemplates: (templates: StepTemplate[]) => set({ stepTemplates: templates }),
  setIngredientsMeta: (ingredients: RecipeLayoutIngredientMeta[]) => set({ ingredientsMeta: ingredients }),
  setFieldsMeta: (fields: RecipeLayoutFieldMeta[]) => set({ fieldsMeta: fields }),
  setIngredientCategoriesMeta: (categories: IngredientCategoryMeta[]) => set({ ingredientCategoriesMeta: categories }),
  setShowAdvanced: (show: boolean) => set({ showAdvanced: show }),
  setIsRecipeDirty: (isDirty: boolean) => set({ isRecipeDirty: isDirty }),

  updateRecipeDetails: (details: Partial<Pick<FullRecipe, 'name' | 'notes' | 'totalWeight' | 'hydrationPct' | 'saltPct'>>) => set(state => {
    if (!state.recipe) return { error: "No active recipe to update details." };
    const updatedRecipe = { ...state.recipe, ...details, fieldValues: state.recipe.fieldValues || [] } as FullRecipe;
    return { recipe: updatedRecipe, error: null, isRecipeDirty: true };
  }),

  addStep: (newStepData: Partial<Omit<RecipeStep, 'id' | 'recipeId' | 'order' | 'fields' | 'ingredients'>> & { stepTemplateId: number }, template?: StepTemplate): number | null => {
    let newStepId: number | null = null;
    set(state => {
      if (!state.recipe) {
        console.error("No active recipe to add a step to.");
        return { error: "No active recipe to add a step to." };
      }
      const currentRecipe = state.recipe;
      const tempNewStepId = -(currentRecipe.steps.length + 1 + Date.now()); // Generate ID before creating step object

      const newStep: RecipeStep = {
        id: tempNewStepId,
        recipeId: currentRecipe.id || 0,
        order: currentRecipe.steps.length + 1,
        stepTemplateId: newStepData.stepTemplateId,
        notes: newStepData.notes ?? null,
        description: newStepData.description ?? template?.description ?? null,
        fields: template?.fields.map(f => ({
          id: -(Date.now() + f.id + Math.random()), recipeStepId: tempNewStepId, fieldId: f.id, value: f.defaultValue ?? (f.field.type === 'number' ? 0 : ''), notes: null
        })) || [],
        ingredients: [], // Initialize ingredients as an empty array
      };
      newStepId = newStep.id; // Capture the ID

      return {
        recipe: {
          ...currentRecipe,
          fieldValues: currentRecipe.fieldValues || [], 
          steps: [...currentRecipe.steps, newStep].sort((a, b) => a.order - b.order)
        },
        error: null,
        isRecipeDirty: true
      };
    });
    return newStepId;
  },

  updateStep: (updatedStep: RecipeStep) => set(state => {
    if (!state.recipe) return {};
    const stepExists = state.recipe.steps.some(s => s.id === updatedStep.id);
    let newSteps: RecipeStep[];
    if (stepExists) {
      newSteps = state.recipe.steps.map(s => (s.id === updatedStep.id ? updatedStep : s));
    } else {
      const stepToAdd = updatedStep.id === 0 ? { ...updatedStep, id: -(Date.now() + Math.random()) } : updatedStep;
      newSteps = [...state.recipe.steps, stepToAdd];
    }
    return {
      recipe: {
        ...state.recipe,
        fieldValues: state.recipe.fieldValues || [], 
        steps: newSteps.sort((a, b) => a.order - b.order)
      },
      isRecipeDirty: true
    };
  }),

  removeStep: (stepId: number) => set(state => {
    if (!state.recipe) return {};
    return {
      recipe: {
        ...state.recipe,
        fieldValues: state.recipe.fieldValues || [], 
        steps: state.recipe.steps.filter(s => s.id !== stepId).map((step, index) => ({ ...step, order: index + 1 }))
      },
      isRecipeDirty: true,
    };
  }),

  reorderSteps: (newStepsArray: RecipeStep[]) => set(state => {
    if (!state.recipe) return {};
    return {
      recipe: {
        ...state.recipe,
        fieldValues: state.recipe.fieldValues || [], 
        steps: newStepsArray
      },
      isRecipeDirty: true
    };
  }),
}));
