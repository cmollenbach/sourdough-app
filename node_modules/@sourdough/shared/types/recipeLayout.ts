import type { 
  FullRecipe, 
  RecipeStep, 
  IngredientCalculationMode, 
  FieldMeta, 
  IngredientMeta, 
  StepTemplate 
} from "./recipe";

export interface IngredientCategoryMeta {
  id: number;
  name: string;
  description?: string | null;
}

export interface RecipeLayoutProps {
  recipe: FullRecipe;
  steps: RecipeStep[];
  ingredientsMeta: IngredientMeta[];
  ingredientCategoriesMeta: IngredientCategoryMeta[];
  fieldsMeta: FieldMeta[];
  stepTemplates: StepTemplate[];
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  onRecipeChange: (updatedRecipe: FullRecipe) => void;
  onStepRemove: (stepId: number) => void;
  onStepSave: (step: RecipeStep, isNew: boolean) => void;
  onStepAddHandler: () => void;
  onStepsReorderHandler: (reorderedSteps: RecipeStep[]) => void;
  newlyAddedStepId?: number | null;
  onNewlyAddedStepHandled?: () => void;
}

export interface RecipeStepEditorProps {
  step: RecipeStep;
  fieldsMeta: FieldMeta[];
  ingredientsMeta: IngredientMeta[];
  onSave: (step: RecipeStep) => void;
  onCancel: () => void;
}
