import type { FullRecipe, RecipeStep } from "./recipe";

export interface FieldMeta {
  id: number;
  name: string;
  label?: string;
  type?: string;
  visible?: boolean;
  visibleInList?: boolean; // <-- Add this
  // ...other meta fields
}

export interface IngredientMeta {
  id: number;
  name: string;
  // Add any other meta properties you use
}

export interface RecipeLayoutProps {
  recipe: FullRecipe;
  fieldsMeta: FieldMeta[];
  steps: RecipeStep[];
  stepFieldsMeta: FieldMeta[];
  ingredientsMeta: IngredientMeta[];
  onRecipeChange: (changes: Partial<FullRecipe>) => void;
  onRecipeSave: () => void;
  onStepDuplicate: (step: RecipeStep) => void;
  onStepRemove: (stepId: number) => void;
  onStepSave: (step: RecipeStep, isNew: boolean) => void;
}

export interface RecipeStepEditorProps {
  step: RecipeStep;
  fieldsMeta: FieldMeta[];
  ingredientsMeta: IngredientMeta[];
  onSave: (step: RecipeStep) => void;
  onCancel: () => void;
}