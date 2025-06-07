// RecipeCalculator.tsx
import { useMemo } from "react";
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";

export default function RecipeCalculator() {
  const recipe = useRecipeBuilderStore((state) => state.recipe);
  const steps = useRecipeBuilderStore((state) => state.recipe?.steps ?? []);
  // const ingredientsMeta = useRecipeBuilderStore((state) => state.ingredientsMeta); // If needed for lookups

  const calculatedValues = useMemo(() => {
    if (!recipe || steps.length === 0) {
      return { totalFlour: 0, totalWater: 0, /* ... other calculations */ };
    }

    let totalFlour = 0;
    let totalWater = 0;
    // Example: Iterate through steps and their ingredients
    for (const step of steps) {
      for (const ingredient of step.ingredients) {
        // This is a placeholder. You'll need to identify flour/water
        // possibly by ingredientId or ingredientCategoryId using ingredientsMeta
        if (ingredient.ingredientId === 1 /* Example ID for a flour */) {
          totalFlour += ingredient.percentage; // Assuming percentage is relative to something or needs conversion
        }
        if (ingredient.ingredientId === 2 /* Example ID for water */) {
          totalWater += ingredient.percentage;
        }
      }
    }

    // Incorporate recipe.fieldValues (from TargetEditor) if they are part of calculations
    // const someTargetValue = recipe.fieldValues.find(fv => fv.fieldId === YOUR_TARGET_FIELD_ID)?.value;

    // Perform your complex calculations here
    return {
      totalFlour,
      totalWater,
      // ... other calculated metrics
    };
  }, [recipe, steps /*, ingredientsMeta */]);

  if (!recipe) return <div>Loading recipe data...</div>;

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2">Recipe Calculator (Realtime)</h2>
      <div>Total Flour (Example): {calculatedValues.totalFlour}</div>
      <div>Total Water (Example): {calculatedValues.totalWater}</div>
      {/* Display other calculated values */}
    </div>
  );
}
