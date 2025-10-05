/**
 * Shared constants used across web and mobile applications
 */

// Ingredient Categories
export const FLOUR_CATEGORY_NAME = "Flour";
export const WATER_CATEGORY_NAME = "Water";
export const SALT_CATEGORY_NAME = "Salt";
export const BREAD_FLOUR_NAME = "Bread Flour";

// Step Roles
export const STEP_ROLE_PREFERMENT = "Preferment";
export const STEP_ROLE_MAIN_DOUGH = "Main Dough";
export const STEP_ROLE_BULK_FERMENTATION = "Bulk Fermentation";
export const STEP_ROLE_SHAPING = "Shaping";
export const STEP_ROLE_FINAL_PROOF = "Final Proof";
export const STEP_ROLE_BAKING = "Baking";

// Default Values
export const DEFAULT_FLOUR_PERCENTAGE = 100;
export const DEFAULT_HYDRATION = 75;
export const DEFAULT_SALT_PERCENTAGE = 2;
export const DEFAULT_BREAD_FLOUR_AMOUNT = 100;

// Timing
export const DEFAULT_BULK_FERMENTATION_HOURS = 4;
export const DEFAULT_FINAL_PROOF_HOURS = 2;

// Calculation Modes (re-export from types for convenience)
export { IngredientCalculationMode } from '../types/recipe';

// Field Names (for conditional logic)
export const FIELD_SF_METHOD = 'S&F Method';
export const FIELD_TIMING_PLAN = 'Timing Plan';
export const FIELD_CUSTOM_FOLD_SCHEDULE = 'Custom Fold Schedule';
export const FIELD_FIRST_FOLD_AFTER = 'First Fold After (minutes)';
export const FIELD_INTERVAL_BETWEEN_FOLDS = 'Interval Between Folds (minutes)';
export const FIELD_FOLD_STRENGTH = 'Fold Strength';

// S&F Method Values
export const SF_METHOD_NONE = 'None';
export const SF_METHOD_BASIC = 'Basic';
export const SF_METHOD_CUSTOM = 'Custom';

// Bake Status
export const BAKE_STATUS_NOT_STARTED = 'not-started';
export const BAKE_STATUS_IN_PROGRESS = 'in-progress';
export const BAKE_STATUS_COMPLETED = 'completed';
export const BAKE_STATUS_ABANDONED = 'abandoned';

// Step Execution Status (re-export from types for convenience)
export type { StepExecutionStatus } from '../types/bake';

// UI Constants
export const MAX_RECIPE_NAME_LENGTH = 100;
export const MAX_STEP_DESCRIPTION_LENGTH = 500;
export const MAX_NOTES_LENGTH = 1000;

// Validation
export const MIN_FLOUR_WEIGHT = 100; // grams
export const MAX_FLOUR_WEIGHT = 10000; // grams
export const MIN_HYDRATION = 50; // %
export const MAX_HYDRATION = 150; // %
export const MIN_SALT_PERCENTAGE = 0; // %
export const MAX_SALT_PERCENTAGE = 5; // %

// Timing Patterns (for timing parser)
export const TIMING_PATTERN_SF = /S&F\s+at\s+([\d,\s]+)\s*(?:minutes?)?/i;
export const TIMING_PATTERN_EVERY = /every\s+(\d+)\s*(?:minutes?|min|m)/i;
export const TIMING_PATTERN_FOLD = /fold\s+(?:at\s+)?(\d+)/i;
