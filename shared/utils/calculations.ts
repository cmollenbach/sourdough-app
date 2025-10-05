/**
 * Shared calculation utilities for baker's percentages and recipe calculations
 */

import { IngredientCalculationMode } from '../types/recipe';
import { DEFAULT_FLOUR_PERCENTAGE } from '../constants';

/**
 * Ensures that the sum of all flour percentages does not exceed 100%.
 * If the changed ingredient is the last flour, it auto-fills to the remaining percentage.
 */
export function enforceFlourPercentage(
  ingredients: { amount: number; ingredientCategoryId: number; calculationMode: string }[],
  flourCategoryId: number,
  changedIndex: number,
  newValue: number
): number {
  // Find all flour percentage ingredients and their indices
  const allFlours = ingredients
    .map((ing, idx) => ({ ...ing, idx }))
    .filter(
      (ing) =>
        ing.ingredientCategoryId === flourCategoryId &&
        ing.calculationMode === IngredientCalculationMode.PERCENTAGE
    );

  // Calculate the sum of all other flour percentages
  const sumOthers = allFlours
    .filter((ing) => ing.idx !== changedIndex)
    .reduce((sum, ing) => sum + (Number(ing.amount) || 0), 0);

  let val = isNaN(newValue) ? 0 : newValue;
  if (val < 0) val = 0;
  if (val + sumOthers > 100) {
    val = Math.max(0, 100 - sumOthers);
  }

  // If this is the last flour, auto-fill to 100%
  if (
    allFlours.length > 1 &&
    changedIndex === allFlours[allFlours.length - 1].idx
  ) {
    val = Math.max(0, 100 - sumOthers);
  }

  return val;
}

/**
 * Calculate total flour weight from ingredients
 */
export function calculateTotalFlourWeight(
  ingredients: { amount: number; ingredientCategoryId: number; calculationMode: string }[],
  flourCategoryId: number
): number {
  return ingredients
    .filter(
      (ing) =>
        ing.ingredientCategoryId === flourCategoryId &&
        ing.calculationMode === IngredientCalculationMode.PERCENTAGE
    )
    .reduce((sum, ing) => sum + (Number(ing.amount) || 0), 0);
}

/**
 * Calculate hydration percentage from flour and water weights
 */
export function calculateHydration(flourWeight: number, waterWeight: number): number {
  if (flourWeight <= 0) return 0;
  return Math.round((waterWeight / flourWeight) * 10000) / 100; // Round to 2 decimal places
}

/**
 * Calculate water weight needed for target hydration
 */
export function calculateWaterForHydration(flourWeight: number, hydrationPercent: number): number {
  return Math.round((flourWeight * hydrationPercent) / 100);
}

/**
 * Calculate baker's percentage (ingredient weight / flour weight * 100)
 */
export function calculateBakersPercentage(ingredientWeight: number, flourWeight: number): number {
  if (flourWeight <= 0) return 0;
  return Math.round((ingredientWeight / flourWeight) * 10000) / 100;
}

/**
 * Calculate ingredient weight from baker's percentage
 */
export function calculateWeightFromPercentage(percentage: number, flourWeight: number): number {
  return Math.round((percentage * flourWeight) / 100);
}

/**
 * Calculate total dough weight
 */
export function calculateTotalDoughWeight(
  ingredients: { amount: number; calculationMode: string }[],
  flourWeight: number
): number {
  return ingredients.reduce((total, ing) => {
    if (ing.calculationMode === IngredientCalculationMode.PERCENTAGE) {
      return total + calculateWeightFromPercentage(ing.amount, flourWeight);
    } else {
      return total + ing.amount;
    }
  }, 0);
}

/**
 * Validate flour percentage total
 */
export function isValidFlourPercentageTotal(
  ingredients: { amount: number; ingredientCategoryId: number; calculationMode: string }[],
  flourCategoryId: number
): boolean {
  const total = calculateTotalFlourWeight(ingredients, flourCategoryId);
  return Math.abs(total - DEFAULT_FLOUR_PERCENTAGE) < 0.01; // Allow small floating point differences
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Format weight with unit (grams)
 */
export function formatWeight(weight: number): string {
  return `${Math.round(weight)}g`;
}

/**
 * Format percentage
 */
export function formatPercentage(percentage: number, decimals: number = 1): string {
  return `${roundTo(percentage, decimals)}%`;
}

/**
 * Parse number from string, handling invalid inputs
 */
export function parseNumber(value: string | number, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
