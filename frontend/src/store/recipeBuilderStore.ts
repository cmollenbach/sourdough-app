import { create } from 'zustand';
import { apiGet } from '../utils/api';
import {
  type FullRecipe, // from recipe.ts
  type FieldMeta as RecipeFieldMeta,    // from recipe.ts, aliasing to avoid conflict
  type IngredientMeta as RecipeIngredientMeta, // from recipe.ts, aliasing to avoid conflict
  type StepType, // Now defined in recipe.ts
  type IngredientCategory as RecipeIngredientCategory, // from recipe.ts, aliasing to avoid conflict
  type RecipeStep, // from recipe.ts
  type RecipeStepIngredient // from recipe.ts
} from '../types/recipe'; // Assuming all these types are centralized

// If StepType and IngredientCategory are not in recipe.ts, adjust imports accordingly.
// For now, this reflects the centralization of the main types.

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

// Import StepTemplate from recipeLayout.ts as RecipeLayout expects this structure
import type { 
  StepTemplate, 
  IngredientCategoryMeta,
  IngredientMeta as RecipeLayoutIngredientMeta, // Use this for the store state
  FieldMeta as RecipeLayoutFieldMeta         // Use this for the store state
} from '../types/recipeLayout';

// Define a more specific error type for API responses
interface ApiErrorData {
  error?: string;
  message?: string; // Sometimes 'message' is used by APIs
  details?: string; // Optional details
}

interface ApiError extends Error { // Extends the built-in Error
  response?: {
    data?: ApiErrorData;
    status?: number;
  };
}

interface RecipeBuilderState {
  recipe: FullRecipe | null;
  ingredientsMeta: RecipeLayoutIngredientMeta[];      // Changed to RecipeLayoutIngredientMeta
  ingredientCategoriesMeta: IngredientCategoryMeta[]; // Changed to IngredientCategoryMeta from recipeLayout
  fieldsMeta: RecipeLayoutFieldMeta[];              // Changed to RecipeLayoutFieldMeta
  stepTemplates: StepTemplate[];
  stepTypes: StepType[]; // Kept for type consistency, but fetching will be commented out
  showAdvanced: boolean;
  isRecipeDirty: boolean;
  loading: boolean;
  error: string | null;

  // Data fetching
  fetchRecipe: (id: number) => Promise<void>;
  fetchPredefinedRecipeByName: (name: string) => Promise<FullRecipe | null>; // Added this line
  fetchAllMetaData: () => Promise<void>;

  // Client-side state setters & actions
  setRecipe: (recipe: FullRecipe) => void;
  setStepTemplates: (templates: StepTemplate[]) => void;
  setIngredientsMeta: (ingredients: RecipeLayoutIngredientMeta[]) => void; // Expect RecipeLayoutIngredientMeta
  setFieldsMeta: (fields: RecipeLayoutFieldMeta[]) => void;             // Expect RecipeLayoutFieldMeta
  setIngredientCategoriesMeta: (categories: IngredientCategoryMeta[]) => void;
  setShowAdvanced: (show: boolean) => void;
  setIsRecipeDirty: (isDirty: boolean) => void;
  updateRecipeDetails: (details: Partial<Pick<FullRecipe, 'name' | 'notes' | 'totalWeight' | 'hydrationPct' | 'saltPct'>>) => void;
  addStep: (newStepData: Partial<Omit<RecipeStep, 'id' | 'recipeId' | 'order' | 'fields' | 'ingredients'>> & { stepTemplateId: number }, template?: StepTemplate) => void;
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
  stepTypes: [], // Initialize as empty
  showAdvanced: false,
  isRecipeDirty: false,
  loading: false,
  error: null,
  fetchRecipe: async (id) => {
    set({ loading: true, error: null });
    try {
      const recipeData = await apiGet<FullRecipe>(`/recipes/${id}`); // Assumes /recipes/:id returns FullRecipe
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
      // Set the fetched recipe as the current recipe in the store
      // This is useful if the page directly uses the store's 'recipe' state after this call
      set({ recipe: recipeData, loading: false }); 
      return recipeData; // Return the fetched recipe so the caller can also use it directly
    } catch (error) {
      const apiError = error as ApiError; // Type assertion
      const errorMessage = apiError.response?.data?.error || apiError.response?.data?.message || apiError.message || `Failed to fetch predefined recipe by name: ${name}`;
      console.error(`Error fetching predefined recipe by name "${name}":`, error);
      set({ error: errorMessage, loading: false, recipe: null });
      return null; // Indicate failure
    }
  },
  fetchAllMetaData: async () => {
    set({ loading: true, error: null });
    try {
      const [
        ingredientsResponse, // Changed to avoid conflict with state key
        ingredientCategoriesResponse,
        fieldsResponse,
        stepTemplatesResponse,
        // stepTypesResponse, // This was causing the tuple error, removed from destructuring
      ] = await Promise.all([
        apiGet<{ingredients: RecipeIngredientMeta[]}>('/meta/ingredients'), // Fetches richer recipe.ts#IngredientMeta
        apiGet<{categories: RecipeIngredientCategory[]}>('/meta/ingredient-categories'), // Fetches richer recipe.ts#IngredientCategory
        apiGet<{fields: RecipeFieldMeta[]}>('/meta/fields'), // Fetches richer recipe.ts#FieldMeta
        apiGet<{templates: StepTemplate[]}>('/meta/step-templates'), // Backend returns { templates: StepTemplate[] }
        // apiGet<StepType[]>('/meta/step-types'), // This endpoint is not defined in backend context - COMMENTED OUT
      ]);
      // For stepTypes, if the endpoint doesn't exist, provide a default or handle gracefully
      const fetchedStepTypes: StepType[] = []; // Default to empty array if not fetching

      // Transform fetched data (recipe.ts types) to RecipeLayout types for the store
      const layoutIngredients: RecipeLayoutIngredientMeta[] = ingredientsResponse.ingredients.map(ing => ({
        id: ing.id,
        name: ing.name,
        ingredientCategoryId: ing.ingredientCategoryId,
        // description is omitted as it's not in RecipeLayoutIngredientMeta
      }));

      const layoutIngredientCategories: IngredientCategoryMeta[] = ingredientCategoriesResponse.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        // description is omitted if not in IngredientCategoryMeta, or map if it is
        // Assuming IngredientCategoryMeta from recipeLayout.ts might be simpler
      }));

      const layoutFields: RecipeLayoutFieldMeta[] = fieldsResponse.fields.map(field => ({
        id: field.id,
        name: field.name,
        description: field.description,
        type: field.type,
        // stepTypeId and isMandatory are omitted as they are not in RecipeLayoutFieldMeta
      }));

      set({
        ingredientsMeta: layoutIngredients,
        ingredientCategoriesMeta: layoutIngredientCategories,
        fieldsMeta: layoutFields,
        stepTemplates: stepTemplatesResponse.templates,
        stepTypes: fetchedStepTypes, 
        loading: false,
        error: null, // Clear error on successful fetch
      });
    } catch (err) {
    console.error("Failed to fetch metadata:", err);
    set({ error: 'Failed to fetch metadata', loading: false });
    }
  },

  // Client-side setters and actions
  setRecipe: (recipe) => set({ recipe, isRecipeDirty: false }),
  setStepTemplates: (templates) => set({ stepTemplates: templates }),
  setIngredientsMeta: (ingredients) => set({ ingredientsMeta: ingredients }),
  setFieldsMeta: (fields) => set({ fieldsMeta: fields }),
  setIngredientCategoriesMeta: (categories) => set({ ingredientCategoriesMeta: categories }),
  setShowAdvanced: (show) => set({ showAdvanced: show }),
  setIsRecipeDirty: (isDirty) => set({ isRecipeDirty: isDirty }),

  updateRecipeDetails: (details) => set(state => {
    if (!state.recipe) return { error: "No active recipe to update details." };
    const updatedRecipe = { ...state.recipe, ...details } as FullRecipe;
    return { recipe: updatedRecipe, error: null, isRecipeDirty: true };
  }),

  addStep: (newStepData, template) => set(state => {
    if (!state.recipe) return { error: "No active recipe to add a step to." };
    const newStep: RecipeStep = {
      id: -(state.recipe.steps.length + 1 + Date.now()), // Unique temporary ID
      recipeId: state.recipe.id || 0, 
      order: state.recipe.steps.length + 1,
      stepTemplateId: newStepData.stepTemplateId,
      notes: newStepData.notes ?? null,
      description: newStepData.description ?? template?.description ?? null, // Use template description if available
      fields: template?.fields.map(f => ({ 
        id: -(Date.now() + f.id + Math.random()), // Ensure unique temp ID for field
        recipeStepId: 0, // Will be set upon saving the step to a real recipe step
        fieldId: f.id, 
        value: f.defaultValue ?? (f.field.type === 'number' ? 0 : ''), // Corrected: Access type from f.field.type
        notes: null 
      })) || [],
      ingredients: template?.ingredientRules?.map(ir => ({ // Use ingredientRules from recipeLayout.StepTemplate
        id: -(Date.now() + ir.ingredientCategoryId + Math.random()), // Ensure unique temp ID for ingredient
        recipeStepId: 0, // Will be set upon saving
        ingredientId: 0, // Default to "select ingredient" or handle based on ir
        amount: 0,
        calculationMode: ir.defaultCalculationMode || 'PERCENTAGE', // Corrected: Property will be added to StepTemplateIngredientRuleMeta
        ingredientCategoryId: ir.ingredientCategoryId, 
        preparation: null, 
        notes: null,
      } as RecipeStepIngredient)) || [],
    };
    return { 
      recipe: { ...state.recipe, steps: [...state.recipe.steps, newStep].sort((a, b) => a.order - b.order) }, 
      error: null, 
      isRecipeDirty: true 
    };
  }),

  updateStep: (updatedStep) => set(state => {
    if (!state.recipe) return {};
    const stepExists = state.recipe.steps.some(s => s.id === updatedStep.id);
    let newSteps: RecipeStep[];
    if (stepExists) {
      newSteps = state.recipe.steps.map(s => s.id === updatedStep.id ? updatedStep : s);
    } else {
      // This assumes new steps might come with a temp ID or 0, and adds them.
      // If ID is 0, assign a temporary negative ID.
      const stepToAdd = updatedStep.id === 0 ? { ...updatedStep, id: -(Date.now() + Math.random()) } : updatedStep;
      newSteps = [...state.recipe.steps, stepToAdd];
    }
    return { recipe: { ...state.recipe, steps: newSteps.sort((a, b) => a.order - b.order) }, isRecipeDirty: true };
  }),

  removeStep: (stepId) => set(state => ({
    recipe: state.recipe ? { ...state.recipe, steps: state.recipe.steps.filter(s => s.id !== stepId).map((step, index) => ({ ...step, order: index + 1 })) } : null,
    isRecipeDirty: true,
  })),

  reorderSteps: (newStepsArray) => set((state) => {
    if (state.recipe) {
      return { recipe: { ...state.recipe, steps: newStepsArray }, isRecipeDirty: true };
    }
    return {};
  }),
}));
