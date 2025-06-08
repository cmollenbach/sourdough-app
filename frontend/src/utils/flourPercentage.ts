/**
 * Ensures that the sum of all flour percentages does not exceed 100%.
 * If the changed ingredient is the last flour, it auto-fills to the remaining percentage.
 */
export function enforceFlourPercentage(
  ingredients: { amount: number; ingredientCategoryId: number; calculationMode: string }[],
  flourCategoryId: number,
  changedIndex: number,
  newValue: number
) {
  // Find all flour percentage ingredients and their indices
  const allFlours = ingredients
    .map((ing, idx) => ({ ...ing, idx }))
    .filter(
      (ing) =>
        ing.ingredientCategoryId === flourCategoryId &&
        ing.calculationMode === "PERCENTAGE"
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