// RecipeCalculator.tsx
import { useMemo } from "react";
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";
import { IngredientCalculationMode } from "../../types/recipe";
import type { IngredientCategoryMeta } from "../../types/recipeLayout"; // For category mapping

// Define category names, ensure these match what's used elsewhere (e.g., seed data, StepCard)
const FLOUR_CATEGORY_NAME = "Flour";
const LIQUID_CATEGORY_NAME = "Liquid";
const SALT_CATEGORY_NAME = "Salt";
const PREFERMENT_CATEGORY_NAME = "Preferment";
const INCLUSIONS_CATEGORY_NAME = "Inclusions";
// Add other category names if needed, e.g., ENRICHMENTS_CATEGORY_NAME

export default function RecipeCalculator() {
  const recipe = useRecipeBuilderStore((state) => state.recipe);
  const steps = useRecipeBuilderStore((state) => state.recipe?.steps ?? []);
  const ingredientsMeta = useRecipeBuilderStore((state) => state.ingredientsMeta);
  // Assumes ingredientCategoriesMeta is fetched and available in the store
  // Example: const ingredientCategoriesMeta = useRecipeBuilderStore((state) => state.ingredientCategoriesMeta);
  // For now, let's simulate it if not available, replace with actual store access later.
  const ingredientCategoriesMeta = useRecipeBuilderStore((state) => state.ingredientCategoriesMeta || [
    { id: 1, name: "Flour" }, { id: 2, name: "Liquid" }, { id: 3, name: "Salt" },
    { id: 4, name: "Preferment" }, { id: 5, name: "Inclusions" }, { id: 6, name: "Enrichments" }
  ] as IngredientCategoryMeta[]);

  const calculatedValues = useMemo(() => {
    if (!recipe || !recipe.totalWeight || recipe.totalWeight <= 0 || !ingredientsMeta) {
      return {
        targetTotalDoughWeight: recipe?.totalWeight ?? 0,
        targetHydrationPct: recipe?.hydrationPct ?? 0,
        targetSaltPct: recipe?.saltPct ?? 0,
        targetFormulaFlourGrams: 0,
        targetFormulaLiquidGrams: 0,
        targetFormulaSaltGrams: 0,
        actualTotalFlourGrams: 0,
        actualTotalLiquidGrams: 0,
        actualTotalSaltGrams: 0,
        actualTotalPrefermentGrams: 0,
        actualTotalInclusionsGrams: 0,
        calculatedTotalDoughWeightFromInputs: 0,
        effectiveHydrationPct: 0,
        effectiveSaltPct: 0,
        effectivePrefermentPct: 0,
        stepIngredientBreakdown: {}, // Changed to object for grouping by step
      };
    }

    // --- Calculate Target Formula Weights (based on overall targets, ignoring preferments for this part) ---
    let targetFormulaFlourGrams = 0;
    let targetFormulaLiquidGrams = 0;
    let targetFormulaSaltGrams = 0;

    if (recipe.totalWeight && recipe.hydrationPct != null && recipe.saltPct != null) {
      const totalTargetPercentageSumDecimal = 1 + (recipe.hydrationPct / 100) + (recipe.saltPct / 100);
      if (totalTargetPercentageSumDecimal > 0) {
        targetFormulaFlourGrams = recipe.totalWeight / totalTargetPercentageSumDecimal;
        targetFormulaLiquidGrams = targetFormulaFlourGrams * (recipe.hydrationPct / 100);
        targetFormulaSaltGrams = targetFormulaFlourGrams * (recipe.saltPct / 100);
      }
    }
    // --- End Target Formula Weights Calculation ---

    let totalBakerPercentageSum = 0;
    let totalFixedWeightSum = 0;

    for (const step of steps) {
      if (step.ingredients) { // Ensure ingredients array exists
        for (const ingredient of step.ingredients) {
          if (ingredient.calculationMode === IngredientCalculationMode.PERCENTAGE) {
            totalBakerPercentageSum += ingredient.amount;
          } else if (ingredient.calculationMode === IngredientCalculationMode.FIXED_WEIGHT) {
            totalFixedWeightSum += ingredient.amount;
          }
        }
      }
    }

    let baseFlourGrams = 0;
    if (totalBakerPercentageSum > 0) {
      // This baseFlourGrams is the effective weight that 100% baker's percentage refers to,
      // derived from the user's target total weight and their entered percentages.
      baseFlourGrams = (recipe.totalWeight - totalFixedWeightSum) / (totalBakerPercentageSum / 100);
    } else if (recipe.totalWeight > 0 && totalFixedWeightSum > 0 && recipe.totalWeight === totalFixedWeightSum) {
      // All ingredients are fixed weight and they sum up to the target.
      // In this case, percentage calculations are not directly applicable unless we infer a flour amount.
      // For now, baseFlourGrams remains 0, and percentage-based ingredients will calculate to 0 weight.
    } else if (recipe.totalWeight > 0 && totalFixedWeightSum > 0 && recipe.totalWeight !== totalFixedWeightSum) {
      // All fixed weights, but they don't sum to target. This is an inconsistency.
      // For now, we can't calculate percentages.
      // Or, if totalBakerPercentageSum is 0, it implies all flour is fixed weight, which is unusual for this model.
    }

    let actualTotalFlourGrams = 0;
    let actualTotalLiquidGrams = 0;
    let actualTotalSaltGrams = 0;
    let actualTotalPrefermentGrams = 0;
    let actualTotalInclusionsGrams = 0; // Specifically for "Inclusions" category with fixed weight
    let calculatedTotalDoughWeightFromInputs = 0;

    const stepIngredientBreakdown: Record<string, Array<{ stepName: string, ingredientName: string; weight: number; originalAmount: number; calculationMode: IngredientCalculationMode, unit: string }>> = {};

    for (const step of steps) {
      const stepName = `Step ${step.order}`; // Or use step.description if available and preferred
      stepIngredientBreakdown[stepName] = [];

      if (step.ingredients) { // Ensure ingredients array exists
        for (const ingredient of step.ingredients) {
          const ingMeta = ingredientsMeta.find(m => m.id === ingredient.ingredientId);
          
          let ingredientWeight = 0;
          let unit = "";

          if (ingredient.calculationMode === IngredientCalculationMode.PERCENTAGE) {
            // Percentage ingredients are relative to the calculated baseFlourGrams
            ingredientWeight = baseFlourGrams > 0 ? baseFlourGrams * (ingredient.amount / 100) : 0;
            unit = "%"; // Original unit was percentage
          } else { // FIXED_WEIGHT
            ingredientWeight = ingredient.amount;
            unit = "g"; // Original unit was grams
          }

          stepIngredientBreakdown[stepName].push({
            stepName: stepName,
            ingredientName: ingMeta?.name ?? "Unknown Ingredient",
            weight: parseFloat(ingredientWeight.toFixed(2)),
            originalAmount: ingredient.amount,
            calculationMode: ingredient.calculationMode,
            unit,
          });
          calculatedTotalDoughWeightFromInputs += ingredientWeight;

          // Summing by category using ingredientCategoryId
          if (ingMeta && ingredientCategoriesMeta) {
            const category = ingredientCategoriesMeta.find((cat: IngredientCategoryMeta) => cat.id === ingMeta.ingredientCategoryId);
            // DEBUGGING LOGS START
            console.log(`Processing Ingredient: ${ingMeta.name}, Ing ID: ${ingredient.id}, IngMeta CatID: ${ingMeta.ingredientCategoryId}, CalcMode: ${ingredient.calculationMode}, Amount: ${ingredient.amount}`);
            console.log(`BaseFlourGrams: ${baseFlourGrams}, IngredientWeight: ${ingredientWeight}`);
            if (category) console.log(`Matched Category: ${category.name} (ID: ${category.id})`);
            else console.log(`No category match for CatID: ${ingMeta.ingredientCategoryId}`);
            // DEBUGGING LOGS END
            if (category) {
              switch (category.name) {
                case FLOUR_CATEGORY_NAME:
                  actualTotalFlourGrams += ingredientWeight;
                  break;
                case LIQUID_CATEGORY_NAME:
                  actualTotalLiquidGrams += ingredientWeight;
                  break;
                case SALT_CATEGORY_NAME:
                  actualTotalSaltGrams += ingredientWeight;
                  break;
                case PREFERMENT_CATEGORY_NAME:
                  { // Add block scope for lexical declarations
                    actualTotalPrefermentGrams += ingredientWeight;
                    // Assuming 100% hydration for preferments for now.
                    // This means half its weight is flour, half is water.
                    // These contributions should be added to the overall flour and liquid totals.
                    const prefermentFlour = ingredientWeight / 2;
                    const prefermentWater = ingredientWeight / 2;
                    actualTotalFlourGrams += prefermentFlour;
                    actualTotalLiquidGrams += prefermentWater;
                    // DEBUGGING LOGS START
                    console.log(`PREFERMENT: ${ingMeta.name} - Added Flour: ${prefermentFlour}, Added Water: ${prefermentWater}. Totals now - Flour: ${actualTotalFlourGrams}, Liquid: ${actualTotalLiquidGrams}`);
                    // DEBUGGING LOGS END
                  }
                  break;
                case INCLUSIONS_CATEGORY_NAME:
                  actualTotalInclusionsGrams += ingredientWeight;
                  break;
                // Add other categories like Enrichments if needed
              }
            }
          }
        }
      }
    }

    const effectiveHydrationPct = actualTotalFlourGrams > 0 ? (actualTotalLiquidGrams / actualTotalFlourGrams) * 100 : 0;
    const effectiveSaltPct = actualTotalFlourGrams > 0 ? (actualTotalSaltGrams / actualTotalFlourGrams) * 100 : 0;
    const effectivePrefermentPct = actualTotalFlourGrams > 0 ? (actualTotalPrefermentGrams / actualTotalFlourGrams) * 100 : 0;

    return {
      targetTotalDoughWeight: recipe.totalWeight,
      targetHydrationPct: recipe.hydrationPct ?? 0,
      targetSaltPct: recipe.saltPct ?? 0,
      targetFormulaFlourGrams: parseFloat(targetFormulaFlourGrams.toFixed(2)),
      targetFormulaLiquidGrams: parseFloat(targetFormulaLiquidGrams.toFixed(2)),
      targetFormulaSaltGrams: parseFloat(targetFormulaSaltGrams.toFixed(2)),
      actualTotalFlourGrams: parseFloat(actualTotalFlourGrams.toFixed(2)),
      actualTotalLiquidGrams: parseFloat(actualTotalLiquidGrams.toFixed(2)),
      actualTotalSaltGrams: parseFloat(actualTotalSaltGrams.toFixed(2)),
      actualTotalPrefermentGrams: parseFloat(actualTotalPrefermentGrams.toFixed(2)),
      actualTotalInclusionsGrams: parseFloat(actualTotalInclusionsGrams.toFixed(2)),
      calculatedTotalDoughWeightFromInputs: parseFloat(calculatedTotalDoughWeightFromInputs.toFixed(2)),
      effectiveHydrationPct: parseFloat(effectiveHydrationPct.toFixed(1)),
      effectiveSaltPct: parseFloat(effectiveSaltPct.toFixed(1)),
      effectivePrefermentPct: parseFloat(effectivePrefermentPct.toFixed(1)),
      stepIngredientBreakdown,
    };
  }, [recipe, steps, ingredientsMeta, ingredientCategoriesMeta]);

  if (!recipe) return <div className="p-4 border rounded-lg shadow">Loading recipe data for calculator...</div>;

  return (
    <div className="p-4 border rounded-lg shadow bg-gray-50 mt-4">
      <h2 className="text-lg font-semibold mb-3 text-gray-700">Recipe Calculator</h2>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="font-medium text-gray-600">Target Total Weight:</div>
        <div className="text-gray-800">{calculatedValues.targetTotalDoughWeight?.toFixed(0) ?? 'N/A'} g</div>

        <div className="font-medium text-gray-600">Target Hydration:</div>
        <div className="text-gray-800">{calculatedValues.targetHydrationPct?.toFixed(1) ?? 'N/A'} %</div>

        <div className="font-medium text-gray-600">Target Salt:</div>
        <div className="text-gray-800">{calculatedValues.targetSaltPct?.toFixed(1) ?? 'N/A'} %</div>
        
        <hr className="col-span-2 my-1 border-gray-300"/>
        
        <div className="col-span-2 font-semibold text-gray-700 mb-1 mt-2">Target Formula Breakdown (Simple):</div>

        <div className="font-medium text-gray-600">Formula Flour:</div>
        <div className="text-gray-800">{calculatedValues.targetFormulaFlourGrams.toFixed(1)} g</div>
        
        <div className="font-medium text-gray-600">Formula Liquid:</div>
        <div className="text-gray-800">{calculatedValues.targetFormulaLiquidGrams.toFixed(1)} g</div>

        <div className="font-medium text-gray-600">Formula Salt:</div>
        <div className="text-gray-800">{calculatedValues.targetFormulaSaltGrams.toFixed(1)} g</div>

        <hr className="col-span-2 my-1 border-gray-300"/>

        <div className="font-medium text-gray-600">Actual Total Flour:</div>
        <div className="text-gray-800">{calculatedValues.actualTotalFlourGrams.toFixed(1)} g</div>

        <div className="font-medium text-gray-600">Actual Total Liquid:</div>
        <div className="text-gray-800">{calculatedValues.actualTotalLiquidGrams.toFixed(1)} g ({calculatedValues.effectiveHydrationPct.toFixed(1)}%)</div>

        <div className="font-medium text-gray-600">Actual Total Salt:</div>
        <div className="text-gray-800">{calculatedValues.actualTotalSaltGrams.toFixed(1)} g ({calculatedValues.effectiveSaltPct.toFixed(1)}%)</div>
        
        <div className="font-medium text-gray-600">Actual Total Preferment:</div>
        <div className="text-gray-800">{calculatedValues.actualTotalPrefermentGrams.toFixed(1)} g ({calculatedValues.effectivePrefermentPct.toFixed(1)}%)</div>

        <div className="font-medium text-gray-600">Actual Total Inclusions:</div>
        <div className="text-gray-800">{calculatedValues.actualTotalInclusionsGrams.toFixed(1)} g</div>
        
        <hr className="col-span-2 my-1 border-gray-300"/>

        <div className="font-medium text-gray-600">Calculated Dough Weight:</div>
        <div className={`text-gray-800 font-semibold ${
            Math.abs((calculatedValues.targetTotalDoughWeight ?? 0) - calculatedValues.calculatedTotalDoughWeightFromInputs) > 1 
            ? 'text-orange-600' 
            : 'text-green-700'
          }`}>
          {calculatedValues.calculatedTotalDoughWeightFromInputs.toFixed(1)} g
        </div>
      </div>

      {Object.keys(calculatedValues.stepIngredientBreakdown).length > 0 && (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">Show Ingredient Breakdown</summary>
          {Object.entries(calculatedValues.stepIngredientBreakdown).map(([stepName, ingredients]) => {
            if (ingredients.length === 0) return null;
            return (
              <div key={stepName} className="mt-2">
                <h4 className="font-semibold text-gray-600">{stepName}</h4>
                <ul className="list-disc pl-5 text-gray-700">
                  {ingredients.map((item, index) => (
                    <li key={index}>
                      {item.ingredientName}: {item.weight.toFixed(1)}g
                      {item.calculationMode === IngredientCalculationMode.PERCENTAGE && ` (from ${item.originalAmount}${item.unit})`}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </details>
      )}
    </div>
  );
}
