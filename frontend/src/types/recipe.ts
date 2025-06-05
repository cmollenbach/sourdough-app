// filepath: c:\Sourdough-app\sourdough-app\frontend\src\types\recipe.ts
// --- Recipe Field Value (for dynamic recipe fields) ---
export interface RecipeFieldValue {
  fieldId: number;
  value: string;
}

// --- Recipe Meta Table (minimal static fields) ---
export interface Recipe {
  id: number;
  ownerId: number;
  active: boolean;
  parentRecipeId: number | null;
  createdAt: string;
  updatedAt: string;
  isPredefined: boolean;
  // Removed: name, totalWeight, hydrationPct, saltPct, notes
}

// --- Step Field Value (for dynamic step fields) ---
export interface RecipeStepField {
  id: number;
  recipeStepId: number;
  fieldId: number;
  value: number | string;
  notes?: string | null;
}

// --- Step Ingredient Value ---
export interface RecipeStepIngredient {
  id: number;
  recipeStepId: number;
  ingredientId: number;
  percentage: number;
  preparation?: string | null;
  notes?: string | null;
}

// --- Step (with dynamic fields and ingredients) ---
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

// --- FullRecipe: Meta + Dynamic Content ---
export interface FullRecipe extends Recipe {
  fieldValues: RecipeFieldValue[]; // Dynamic recipe fields
  steps: RecipeStep[];
}