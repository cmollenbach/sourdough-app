// --- Recipe Field Value (for dynamic recipe fields) ---
export interface RecipeFieldValue {
  fieldId: number;
  value: string;
}

// --- Recipe Meta Table (minimal static fields) ---
export interface Recipe {
  id: number;
  name: string;
  notes?: string;
  createdAt?: string;
  isPredefined?: boolean;
  // ...other fields
  [key: string]: unknown; // <-- Add this for meta-driven dynamic access
}

// --- Step Field Value (for dynamic step fields) ---
export interface RecipeStepField {
  id: number;
  recipeStepId: number;
  fieldId: number;
  value: number | string;
  notes?: string | null;
}

// --- Step Ingredient Value (matches Prisma schema, but optional for form) ---
export interface RecipeStepIngredient {
  id: number;
  recipeStepId: number; // Added: An ingredient in a step should know its step's ID
  ingredientId: number;
  percentage: number;
  ingredientCategoryId: number;
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