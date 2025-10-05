// This should align with Prisma's StepExecutionStatus enum
export type StepExecutionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';

export interface Ingredient {
  id: number;
  name: string;
}

export interface BakeStepIngredient {
  id: number;
  bakeStepId: number;
  ingredientId: number;
  ingredient: Ingredient;
  plannedPercentage: number;
  plannedPreparation?: string | null;
  notes?: string | null;
}

export interface StepParameter {
  id: number;
  name: string;
  type: string; // ParameterDataType enum as string
}

export interface BakeStepParameterValue {
  id: number;
  bakeStepId: number;
  parameterId: number;
  parameter: StepParameter;
  plannedValue: unknown; // Json from Prisma, prefer unknown over any
  actualValue?: unknown | null;
  notes?: string | null;
}

export interface RecipeStepInfo {
  name: string;
  description?: string | null;
  stepTemplate?: { name: string };
}

export interface BakeStep {
  id: number;
  bakeId: number;
  recipeStepId: number;
  recipeStep?: RecipeStepInfo;
  order: number;
  status: StepExecutionStatus;
  startTimestamp?: string | null; // ISO date string
  finishTimestamp?: string | null;
  deviations?: unknown | null;
  notes?: string | null;
  parameterValues: BakeStepParameterValue[];
  ingredients: BakeStepIngredient[];
}

export interface Bake {
  id: number;
  recipeId: number;
  ownerId: number;
  startTimestamp: string; // ISO date string
  finishTimestamp?: string | null;
  active: boolean;
  parentBakeId?: number | null;
  notes?: string | null;
  rating?: number | null;
  recipeTotalWeightSnapshot?: number | null;
  recipeHydrationPctSnapshot?: number | null;
  recipeSaltPctSnapshot?: number | null;
  steps?: BakeStep[];
  recipe?: { name: string };
  owner?: {
    email?: string | null;
    userProfile?: { displayName?: string | null } | null;
  };
  stepCount?: number;
}
