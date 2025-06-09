// This should align with Prisma's StepExecutionStatus enum
export type StepExecutionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';

// Mirroring Prisma's Ingredient model for BakeStepIngredient context
export interface Ingredient {
  id: number;
  name: string;
  // Add other fields from your Ingredient model if needed by frontend
  // e.g., ingredientCategoryId: number; description?: string | null;
}

export interface BakeStepIngredient {
  id: number;
  bakeStepId: number;
  ingredientId: number;
  ingredient: Ingredient; // Embedded ingredient details
  plannedPercentage: number;
  plannedPreparation?: string | null;
  notes?: string | null;
  // No createdAt/updatedAt in your BakeStepIngredient schema
}

// Mirroring Prisma's StepParameter model
export interface StepParameter {
  id: number;
  name: string;
  type: string; // ParameterDataType enum as string
  // Add other fields from StepParameter if needed
  // e.g., description?: string | null; defaultValue?: string | null;
}

export interface BakeStepParameterValue {
  id: number;
  bakeStepId: number;
  parameterId: number;
  parameter: StepParameter; // Embedded parameter details
  plannedValue: unknown; // Json from Prisma, prefer unknown over any
  actualValue?: unknown | null; // Json from Prisma, prefer unknown over any
  notes?: string | null;
  // No createdAt/updatedAt in your BakeStepParameterValue schema
}

// For details from the original RecipeStep, if included in API response
export interface RecipeStepInfo {
  name: string;
  description?: string | null;
  stepTemplate?: { name: string };
}

export interface BakeStep {
  id: number;
  bakeId: number;
  recipeStepId: number;
  recipeStep?: RecipeStepInfo; // Details from the original RecipeStep
  order: number;
  status: StepExecutionStatus;
  startTimestamp?: string | null; // ISO date string
  finishTimestamp?: string | null; // ISO date string
  deviations?: unknown | null; // Json from Prisma, prefer unknown over any
  notes?: string | null;
  parameterValues: BakeStepParameterValue[]; // Renamed from 'parameters' to match Prisma schema and backend response
  ingredients: BakeStepIngredient[];
  // No direct name/instruction, these come from linked recipeStep
  // No createdAt/updatedAt in your BakeStep schema
}

export interface Bake {
  id: number;
  recipeId: number;
  ownerId: number;
  startTimestamp: string; // ISO date string
  finishTimestamp?: string | null; // ISO date string
  active: boolean;
  parentBakeId?: number | null;
  notes?: string | null; // Used for bake name/description
  rating?: number | null; // New field for rating
  recipeTotalWeightSnapshot?: number | null;
  recipeHydrationPctSnapshot?: number | null;
  recipeSaltPctSnapshot?: number | null;
  steps?: BakeStep[]; // 'steps' field in your Bake schema - make optional for list views
  recipe?: { name: string }; // Optional: if recipe name is included
  owner?: { // 'owner' field in your Bake schema
    email?: string | null;
    userProfile?: { displayName?: string | null } | null;
  };
  stepCount?: number; // Added for the all bakes list
}