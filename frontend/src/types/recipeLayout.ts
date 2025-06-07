import type { FullRecipe, RecipeStep } from "./recipe";

export interface FieldMeta {
  id: number;
  name: string;
  label?: string;
  type: string;
  order?: number;
  helpText?: string;
  description?: string;
  visible?: boolean;
  advanced?: boolean;
  defaultValue?: string | number | null; // <-- Use a union type instead of any
  // Add any other fields your backend returns
}

export interface IngredientMeta {
  id: number;
  name: string;
  ingredientCategoryId: number;
  // ...other properties...
}

export interface RecipeLayoutProps {
  recipe: FullRecipe;
  fieldsMeta: FieldMeta[];
  steps: RecipeStep[];
  ingredientsMeta: IngredientMeta[];
  stepTemplates: StepTemplate[]; // <-- Add this
  showAdvanced: boolean;         // <-- Add this
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

export interface StepTemplateFieldMeta {
  id: number;
  fieldId: number;
  stepTemplateId: number;
  order?: number;
  advanced?: boolean;
  visible?: boolean;
  description?: string;
  helpText?: string;
  defaultValue?: string;
  // Add more as needed
  field: FieldMeta; // The actual field meta
}

export interface StepTemplateIngredientRuleMeta {
  id: number;
  stepTemplateId: number;
  ingredientCategoryId: number;
  required?: boolean;
  visible?: boolean;
  advanced?: boolean;
  description?: string;
  helpText?: string;
  defaultValue?: string;
  // Add more as needed
  ingredientCategory: IngredientCategoryMeta;
}

export interface IngredientCategoryMeta {
  id: number;
  name: string;
  description?: string;
  order?: number;
}

export interface StepTemplate {
  id: number;
  name: string;
  stepTypeId: number;
  advanced?: boolean;
  description?: string;
  active?: boolean;
  order?: number;
  fields: StepTemplateFieldMeta[];
  ingredientRules: StepTemplateIngredientRuleMeta[];
}