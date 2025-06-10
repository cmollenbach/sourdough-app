export interface FieldMeta {
  id: number;
  name: string;
  description: string;
  type: string;
  stepTypeId: number;
  isMandatory: boolean;
}

export interface IngredientMeta {
  id: number;
  name: string;
  description: string;
  ingredientCategoryId: number;
}

export interface StepTemplate {
  id: number;
  name: string;
  description: string;
  stepTypeId: number;
  isDefault: boolean;
  fields: FieldMeta[];
  ingredients: IngredientMeta[];
  role: string; // <-- Add this line
}

// Added: Basic definition for IngredientCategory.
// You may need to expand this based on your actual data structure.
export interface IngredientCategory {
  id: number;
  name: string;
  description?: string | null;
}

// Added: Basic definition for StepType.
// You may need to expand this based on your actual data structure.
export interface StepType {
  id: number;
  name: string;
  description?: string | null;
}

export const IngredientCalculationMode = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_WEIGHT: 'FIXED_WEIGHT',
} as const;

export type IngredientCalculationMode = typeof IngredientCalculationMode[keyof typeof IngredientCalculationMode];

export interface RecipeFieldValue {
  fieldId: number;
  value: string;
}

export interface Recipe {
  id: number;
  name: string;
  notes?: string;
  createdAt?: string;
  isPredefined?: boolean;
  totalWeight?: number | null;
  hydrationPct?: number | null;
  saltPct?: number | null;
}

export interface RecipeStepField {
  id: number;
  recipeStepId: number;
  fieldId: number;
  value: number | string;
  notes?: string | null;
}

export interface RecipeStepIngredient {
  id: number;
  recipeStepId: number;
  ingredientId: number;
  ingredientCategoryId: number;
  amount: number;
  calculationMode: IngredientCalculationMode;
  preparation?: string | null;
  notes?: string | null;
}

export interface RecipeStep {
  id: number;
  recipeId: number;
  stepTemplateId: number;
  order: number;
  notes?: string | null;
  description?: string | null;
  fields: RecipeStepField[];
  ingredients: RecipeStepIngredient[];
}

export interface FullRecipe extends Recipe {
  fieldValues: RecipeFieldValue[];
  steps: RecipeStep[];
}

export interface RecipeStub {
  id: number;
  name: string;
  // You could add other useful info like createdAt, or a short description if available
}