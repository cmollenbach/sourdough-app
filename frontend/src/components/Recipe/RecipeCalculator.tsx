// RecipeCalculator.tsx
import { useMemo } from "react";
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";
import { IngredientCalculationMode } from "../../types/recipe";
// import type { IngredientCategoryMeta } from "../../types/recipeLayout"; // No longer needed here
// import type { FieldMeta } from "../../types/recipeLayout"; // No longer needed for looking up field IDs here

// Constants for preferment calculation logic
const PREFERMENT_CONTRIB_PARAM_NAME = 'Preferment Contribution %';
const PREFERMENT_HYDRATION_PARAM_NAME = 'Preferment Hydration %';
const PREFERMENT_STEP_TYPE_ID = 1; // ID of the StepType designated for preferments (e.g., "Preparation" which has ID 1 in your seed)

export default function RecipeCalculator() {
  const recipe = useRecipeBuilderStore((state) => state.recipe);
  const steps = useRecipeBuilderStore((state) => state.recipe?.steps ?? []);
  const ingredientsMeta = useRecipeBuilderStore((state) => state.ingredientsMeta);
  const fieldsMeta = useRecipeBuilderStore((state) => state.fieldsMeta); // For finding field IDs
  const stepTemplates = useRecipeBuilderStore((state) => state.stepTemplates); // For finding stepTypeId

  const calculatedValues = useMemo(() => {
    if (!recipe || !recipe.totalWeight || recipe.totalWeight <= 0 || !ingredientsMeta) {
      return {
        targetTotalDoughWeight: recipe?.totalWeight ?? 0,
        targetHydrationPct: recipe?.hydrationPct ?? 0,
        targetSaltPct: recipe?.saltPct ?? 0,
        targetFormulaFlourGrams: 0,
        targetFormulaLiquidGrams: 0,
        targetFormulaSaltGrams: 0,
        calculatedPrefermentFlour: 0,
        calculatedPrefermentWater: 0,
        calculatedPrefermentTotal: 0,
        calculatedTotalDoughWeightFromInputs: 0,
        // stepIngredientBreakdown: {}, // No longer needed
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

    // --- Calculate Preferment Components ---
    let calculatedPrefermentFlour = 0;
    let calculatedPrefermentWater = 0;
    let calculatedPrefermentTotal = 0;

    const prefermentContribFieldMeta = fieldsMeta.find(fm => fm.name === PREFERMENT_CONTRIB_PARAM_NAME);
    const prefermentHydrationFieldMeta = fieldsMeta.find(fm => fm.name === PREFERMENT_HYDRATION_PARAM_NAME);

    if (prefermentContribFieldMeta && prefermentHydrationFieldMeta) {
      for (const step of steps) {
        console.log(`[Calculator] Processing Step ID: ${step.id}, Order: ${step.order}, Template ID: ${step.stepTemplateId}`);
        const currentStepTemplate = stepTemplates.find(st => st.id === step.stepTemplateId);
        if (currentStepTemplate) {
          console.log(`[Calculator]   Step Template Name: ${currentStepTemplate.name}, StepTypeID: ${currentStepTemplate.stepTypeId}`);
        } else {
          console.log(`[Calculator]   Step Template ID ${step.stepTemplateId} not found in stepTemplates list.`);
        }

        if (currentStepTemplate && currentStepTemplate.stepTypeId === PREFERMENT_STEP_TYPE_ID) {
          console.log(`[Calculator]   Identified as Preferment Step (StepTypeID: ${PREFERMENT_STEP_TYPE_ID})`);
          const contribField = step.fields.find(f => f.fieldId === prefermentContribFieldMeta.id); // Parameter for Contribution %
          const hydrationField = step.fields.find(f => f.fieldId === prefermentHydrationFieldMeta.id); // Parameter for Hydration %

          console.log(`[Calculator]     Preferment Contrib Param Meta ID: ${prefermentContribFieldMeta.id}, Hydration Param Meta ID: ${prefermentHydrationFieldMeta.id}`);
          console.log(`[Calculator]     Step Fields:`, step.fields);
          console.log(`[Calculator]     Found Contrib Field:`, contribField);
          console.log(`[Calculator]     Found Hydration Field:`, hydrationField);

          if (contribField && hydrationField) {
            const contribPct = Number(contribField.value);
            const hydrationPct = Number(hydrationField.value);
            console.log(`[Calculator]       Contrib Pct: ${contribPct}, Hydration Pct: ${hydrationPct}, TargetFormulaFlourGrams: ${targetFormulaFlourGrams}`);
            if (!isNaN(contribPct) && !isNaN(hydrationPct) && targetFormulaFlourGrams > 0) {
              // Calculate preferment components based on the main formula's flour weight
              const prefermentStepTotalWeight = targetFormulaFlourGrams * (contribPct / 100);
              const prefermentStepFlour = prefermentStepTotalWeight / (1 + (hydrationPct / 100));
              const prefermentStepWater = prefermentStepFlour * (hydrationPct / 100);
              
              calculatedPrefermentFlour += prefermentStepFlour;
              calculatedPrefermentWater += prefermentStepWater;
              calculatedPrefermentTotal += prefermentStepTotalWeight;
              console.log(`[Calculator]         Calculated - Preferment Step Total: ${prefermentStepTotalWeight.toFixed(2)}, Flour: ${prefermentStepFlour.toFixed(2)}, Water: ${prefermentStepWater.toFixed(2)}`);
              console.log(`[Calculator]         Cumulative Preferment - Flour: ${calculatedPrefermentFlour.toFixed(2)}, Water: ${calculatedPrefermentWater.toFixed(2)}, Total: ${calculatedPrefermentTotal.toFixed(2)}`);
            }
          } else {
            console.log(`[Calculator]       Missing preferment contribution or hydration fields for this step.`);
          }
        }
      }
    }
    // --- End Preferment Components Calculation ---


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

    // These actual totals are no longer displayed directly but are used for effective percentages if needed elsewhere.
    // For now, the primary sum is calculatedTotalDoughWeightFromInputs.
    let calculatedTotalDoughWeightFromInputs = 0;

    // const stepIngredientBreakdown: Record<string, Array<{ stepName: string, ingredientName: string; weight: number; originalAmount: number; calculationMode: IngredientCalculationMode, unit: string }>> = {}; // No longer needed

    for (const step of steps) {
      // const stepName = `Step ${step.order}`; // No longer needed for breakdown
      // stepIngredientBreakdown[stepName] = []; // No longer needed

      if (step.ingredients) { // Ensure ingredients array exists
        for (const ingredient of step.ingredients) {
          // const ingMeta = ingredientsMeta.find(m => m.id === ingredient.ingredientId); // Still needed if we were to sum by category, but not for current display
          
          let ingredientWeight = 0;
          // let unit = ""; // No longer needed for breakdown display

          if (ingredient.calculationMode === IngredientCalculationMode.PERCENTAGE) {
            // Percentage ingredients are relative to the calculated baseFlourGrams
            ingredientWeight = baseFlourGrams > 0 ? baseFlourGrams * (ingredient.amount / 100) : 0;
            // unit = "%"; // No longer needed
          } else { // FIXED_WEIGHT
            ingredientWeight = ingredient.amount;
            // unit = "g"; // No longer needed
          }

          // stepIngredientBreakdown[stepName].push({ // No longer needed
          //   stepName: stepName,
          //   ingredientName: ingMeta?.name ?? "Unknown Ingredient",
          //   weight: parseFloat(ingredientWeight.toFixed(2)),
          //   originalAmount: ingredient.amount,
          //   calculationMode: ingredient.calculationMode,
          //   unit,
          // });
          calculatedTotalDoughWeightFromInputs += ingredientWeight;

          // The summing logic for actualTotalFlourGrams, actualTotalLiquidGrams, etc.,
          // has been removed as per the request to delete that display section.
          // If these sums were needed for other calculations (e.g., very precise effective percentages
          // that consider preferment breakdown), that logic would need to be re-evaluated or kept
          // separate from the display. For now, we only need calculatedTotalDoughWeightFromInputs.
        }
      }
    }

    return {
      targetTotalDoughWeight: recipe.totalWeight,
      targetHydrationPct: recipe.hydrationPct ?? 0,
      targetSaltPct: recipe.saltPct ?? 0,
      targetFormulaFlourGrams: parseFloat(targetFormulaFlourGrams.toFixed(2)),
      targetFormulaLiquidGrams: parseFloat(targetFormulaLiquidGrams.toFixed(2)),
      targetFormulaSaltGrams: parseFloat(targetFormulaSaltGrams.toFixed(2)),
      calculatedPrefermentFlour: parseFloat(calculatedPrefermentFlour.toFixed(2)),
      calculatedPrefermentWater: parseFloat(calculatedPrefermentWater.toFixed(2)),
      calculatedPrefermentTotal: parseFloat(calculatedPrefermentTotal.toFixed(2)),
      calculatedTotalDoughWeightFromInputs: parseFloat(calculatedTotalDoughWeightFromInputs.toFixed(2)),
      // stepIngredientBreakdown, // No longer needed
    };
  }, [recipe, steps, ingredientsMeta, fieldsMeta, stepTemplates]);

  if (!recipe) return <div className="p-4 border rounded-lg shadow">Loading recipe data for calculator...</div>;

  return (
    <div className="p-4 border rounded-lg shadow bg-gray-50 mt-4">
      <h2 className="text-lg font-semibold mb-3 text-gray-700">Recipe Calculator</h2>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {/* Section 1 (Target repetition) - REMOVED */}

        {/* Section 2 (Renamed to "Recipe") */}
        {/* <div className="col-span-2 font-semibold text-gray-700 mb-1 mt-0">Recipe</div> REMOVED */}

        <div className="font-medium text-gray-600">Flour (Main Mix):</div>
        <div className="text-gray-800">{calculatedValues.targetFormulaFlourGrams.toFixed(1)} g</div>
        
        <div className="font-medium text-gray-600">Liquid (Main Mix):</div>
        <div className="text-gray-800">{calculatedValues.targetFormulaLiquidGrams.toFixed(1)} g</div>
        
        <div className="font-medium text-gray-600">Salt (Main Mix):</div>
        <div className="text-gray-800">{calculatedValues.targetFormulaSaltGrams.toFixed(1)} g</div>

        {calculatedValues.calculatedPrefermentTotal > 0 && (
          <>
            <div className="font-medium text-gray-600">Preferment Flour:</div>
            <div className="text-gray-800">{calculatedValues.calculatedPrefermentFlour.toFixed(1)} g</div>

            <div className="font-medium text-gray-600">Preferment Water:</div>
            <div className="text-gray-800">{calculatedValues.calculatedPrefermentWater.toFixed(1)} g</div>
            
            <div className="font-medium text-gray-600">Preferment Total:</div>
            <div className="text-gray-800">{calculatedValues.calculatedPrefermentTotal.toFixed(1)} g</div>
          </>
        )}

        {/* Section 3 (Actual Totals) - REMOVED */}

        {/* Section 4 (Calculated Dough Weight, moved and renamed to "Total") */}
        <hr className="col-span-2 my-1 border-gray-300"/> {/* Optional: Keep a divider before the total */}
        <div className="font-medium text-gray-600">Total (Formula):</div>
        <div className={`text-gray-800 font-semibold ${
            Math.abs((calculatedValues.targetTotalDoughWeight ?? 0) - calculatedValues.calculatedTotalDoughWeightFromInputs) > 1 
            ? 'text-orange-600' 
            : 'text-green-700'
          }`}>
          {calculatedValues.calculatedTotalDoughWeightFromInputs.toFixed(1)} g
        </div>
        {/* Displaying the sum of the formula components for clarity */}
        <div className="font-medium text-gray-600">Total (Calculated Formula):</div>
        <div className="text-gray-800 font-semibold">
          {(
            calculatedValues.targetFormulaFlourGrams +
            calculatedValues.targetFormulaLiquidGrams +
            calculatedValues.targetFormulaSaltGrams +
            calculatedValues.calculatedPrefermentTotal
          ).toFixed(1)} g
        </div>
      </div>

      {/* "Show Ingredient Breakdown by Step" section REMOVED */}
    </div>
  );
}
