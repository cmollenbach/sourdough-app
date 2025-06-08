// RecipeCalculator.tsx
import { useMemo } from "react";
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";
import { IngredientCalculationMode } from "../../types/recipe";

// Constants for preferment calculation logic
const PREFERMENT_CONTRIB_PARAM_NAME = 'Contribution (pct)'; 
const PREFERMENT_HYDRATION_PARAM_NAME = 'Hydration';
const PREFERMENT_STEP_TYPE_ID = 6; // ID of the StepType designated for preferments (Matches "Preferment" StepTypeID from logs)

// Constants for Ingredient Categorization
const FLOUR_CATEGORY_NAME = "Flour";
const LIQUID_CATEGORY_NAME = "Liquid"; // Verify this matches your data (e.g., could be "Water")
const SALT_CATEGORY_NAME = "Salt";   // Verify this matches your data

interface CalculatedStepColumn {
  stepId: number;
  order: number;
  name: string;
  isPreferment: boolean;
  prefermentContributionPct?: number;
  prefermentHydrationPct?: number;
  flourWeight: number;
  waterWeight: number;
  saltWeight: number;
  otherIngredients: Array<{ name: string; weight: number; originalAmount: number; unit: string }>;
  totalWeight: number;
}

interface CalculatedTableData {
  columns: CalculatedStepColumn[];
  totals: {
    flour: number;
    water: number;
    salt: number;
    other: number;
    grandTotal: number;
  };
  targetTotalDoughWeight: number;
  targetHydrationPct: number;
  targetSaltPct: number;
  mainMixFlour: number;
  mainMixLiquid: number;
  mainMixSalt: number;
  prefermentTotalFlour: number;
  prefermentTotalWater: number;
}

export default function RecipeCalculator() {
  const recipe = useRecipeBuilderStore((state) => state.recipe);
  const steps = useRecipeBuilderStore((state) => state.recipe?.steps ?? []);
  const ingredientsMeta = useRecipeBuilderStore((state) => state.ingredientsMeta);
  const fieldsMeta = useRecipeBuilderStore((state) => state.fieldsMeta); // For finding field IDs
  const ingredientCategoriesMeta = useRecipeBuilderStore((state) => state.ingredientCategoriesMeta); // Added to get category names
  const stepTemplates = useRecipeBuilderStore((state) => state.stepTemplates); // For finding stepTypeId

  const calculatedValues = useMemo(() => {
    if (!recipe || !recipe.totalWeight || recipe.totalWeight <= 0 || !ingredientsMeta || !ingredientCategoriesMeta) {
      return {
        columns: [],
        totals: { flour: 0, water: 0, salt: 0, other: 0, grandTotal: 0 },
        targetTotalDoughWeight: recipe?.totalWeight ?? 0,
        targetHydrationPct: recipe?.hydrationPct ?? 0,
        targetSaltPct: recipe?.saltPct ?? 0,
        mainMixFlour: 0,
        mainMixLiquid: 0,
        mainMixSalt: 0,
        prefermentTotalFlour: 0,
        prefermentTotalWater: 0,
      } as CalculatedTableData;
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

    // --- Preferment Components Calculation (Revised for per-step and total) ---
    let totalCalculatedPrefermentFlour = 0;
    let totalCalculatedPrefermentWater = 0;
    const prefermentParameterContributions = new Map<number, { flour: number, water: number, contribPct?: number, hydPct?: number }>();

    const prefermentContribFieldMeta = fieldsMeta.find(fm => fm.name === PREFERMENT_CONTRIB_PARAM_NAME);
    const prefermentHydrationFieldMeta = fieldsMeta.find(fm => fm.name === PREFERMENT_HYDRATION_PARAM_NAME);

    if (prefermentContribFieldMeta && prefermentHydrationFieldMeta) {
      for (const step of steps) {
        const currentStepTemplate = stepTemplates.find(st => st.id === step.stepTemplateId);
        if (currentStepTemplate && currentStepTemplate.stepTypeId === PREFERMENT_STEP_TYPE_ID) {
          const contribField = step.fields.find(f => f.fieldId === prefermentContribFieldMeta.id);
          const hydrationField = step.fields.find(f => f.fieldId === prefermentHydrationFieldMeta.id);
          if (contribField && hydrationField && contribField.value != null && hydrationField.value != null) {
            const contribPct = Number(contribField.value);
            const hydrationPct = Number(hydrationField.value);
            if (!isNaN(contribPct) && !isNaN(hydrationPct) && targetFormulaFlourGrams > 0 && contribPct > 0) {
              const flourInThisPrefermentStep = targetFormulaFlourGrams * (contribPct / 100);
              const waterInThisPrefermentStep = flourInThisPrefermentStep * (hydrationPct / 100);
              
              totalCalculatedPrefermentFlour += flourInThisPrefermentStep;
              totalCalculatedPrefermentWater += waterInThisPrefermentStep;
              prefermentParameterContributions.set(step.id, {
                flour: flourInThisPrefermentStep,
                water: waterInThisPrefermentStep,
                contribPct: contribPct,
                hydPct: hydrationPct
              });
            }
          }
        }
      }
    }

    // --- Calculate baseFlourGrams for explicit step ingredient breakdown (based on step.ingredients) ---
    let totalBakerPercentageSum = 0;
    let totalFixedWeightSum = 0;

    for (const step of steps) {
      if (step.ingredients) {
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
      baseFlourGrams = (recipe.totalWeight - totalFixedWeightSum) / (totalBakerPercentageSum / 100);
    } else if (recipe.totalWeight > 0 && totalFixedWeightSum > 0 && recipe.totalWeight === totalFixedWeightSum) {
      // All ingredients are fixed weight, baseFlourGrams remains 0.
    }

    // --- Initialize for new table structure ---
    const tableColumns: CalculatedStepColumn[] = [];
    let overallTotalFlour = 0;
    let overallTotalWater = 0;
    let overallTotalSalt = 0;
    let overallTotalOtherWeight = 0;
    let overallGrandTotalWeight = 0;

    // --- Process each step for the table ---
    for (const step of steps) {
      const currentStepTemplate = stepTemplates.find(st => st.id === step.stepTemplateId);
      const stepName = currentStepTemplate?.name || `Step ${step.order}`;

      let stepFlourWeight = 0;
      let stepWaterWeight = 0;
      let stepSaltWeight = 0;
      const stepOtherIngredients: CalculatedStepColumn['otherIngredients'] = [];
      let stepTotalWeightForColumn = 0;

      let isPrefermentStepForDisplay = false;
      let displayContribPct: number | undefined = undefined;
      let displayHydPct: number | undefined = undefined;

      // Add flour/water from preferment parameters if this step is a preferment
      const pContributions = prefermentParameterContributions.get(step.id);
      if (pContributions) {
        isPrefermentStepForDisplay = true;
        displayContribPct = pContributions.contribPct;
        displayHydPct = pContributions.hydPct;

        stepFlourWeight += pContributions.flour;
        stepWaterWeight += pContributions.water;
        stepTotalWeightForColumn += pContributions.flour + pContributions.water;
      }

      // Process explicitly listed ingredients for this step
      if (step.ingredients && step.ingredients.length > 0) {
        for (const ingredient of step.ingredients) {
          const ingMeta = ingredientsMeta.find(m => m.id === ingredient.ingredientId);
          let ingredientWeight = 0;

          if (ingredient.calculationMode === IngredientCalculationMode.PERCENTAGE) {
            ingredientWeight = baseFlourGrams > 0 ? baseFlourGrams * (ingredient.amount / 100) : 0;
          } else { // FIXED_WEIGHT
            ingredientWeight = ingredient.amount;
          }
          
          stepTotalWeightForColumn += ingredientWeight;

          // Correctly find the category name using ingredientCategoryId
          const ingredientCategory = ingMeta ? ingredientCategoriesMeta.find(cat => cat.id === ingMeta.ingredientCategoryId) : undefined;
          const categoryName = ingredientCategory?.name;

          if (categoryName === FLOUR_CATEGORY_NAME) {
             stepFlourWeight += ingredientWeight;
          } else if (categoryName === LIQUID_CATEGORY_NAME) {
            stepWaterWeight += ingredientWeight;
          } else if (categoryName === SALT_CATEGORY_NAME) {
            stepSaltWeight += ingredientWeight;
          } else {
            if (ingMeta && ingredientWeight > 0) {
              stepOtherIngredients.push({
                name: ingMeta.name,
                weight: parseFloat(ingredientWeight.toFixed(2)),
                originalAmount: ingredient.amount,
                unit: ingredient.calculationMode === IngredientCalculationMode.PERCENTAGE ? '%' : 'g',
              });
            }
          }
        }
      }

      tableColumns.push({
        stepId: step.id,
        order: step.order,
        name: stepName,
        isPreferment: isPrefermentStepForDisplay,
        prefermentContributionPct: displayContribPct,
        prefermentHydrationPct: displayHydPct,
        flourWeight: parseFloat(stepFlourWeight.toFixed(2)),
        waterWeight: parseFloat(stepWaterWeight.toFixed(2)),
        saltWeight: parseFloat(stepSaltWeight.toFixed(2)),
        otherIngredients: stepOtherIngredients,
        totalWeight: parseFloat(stepTotalWeightForColumn.toFixed(2)),
      });

      overallTotalFlour += stepFlourWeight;
      overallTotalWater += stepWaterWeight;
      overallTotalSalt += stepSaltWeight;
      stepOtherIngredients.forEach(ing => overallTotalOtherWeight += ing.weight);
      overallGrandTotalWeight += stepTotalWeightForColumn;
    }

    tableColumns.sort((a, b) => a.order - b.order);

    const calculatedTableData: CalculatedTableData = {
      columns: tableColumns,
      totals: {
        flour: parseFloat(overallTotalFlour.toFixed(2)),
        water: parseFloat(overallTotalWater.toFixed(2)),
        salt: parseFloat(overallTotalSalt.toFixed(2)),
        other: parseFloat(overallTotalOtherWeight.toFixed(2)),
        grandTotal: parseFloat(overallGrandTotalWeight.toFixed(2)),
      },
      targetTotalDoughWeight: recipe.totalWeight,
      targetHydrationPct: recipe.hydrationPct ?? 0,
      targetSaltPct: recipe.saltPct ?? 0,
      mainMixFlour: parseFloat(Math.max(0, targetFormulaFlourGrams - totalCalculatedPrefermentFlour).toFixed(2)),
      mainMixLiquid: parseFloat(Math.max(0, targetFormulaLiquidGrams - totalCalculatedPrefermentWater).toFixed(2)),
      mainMixSalt: parseFloat(targetFormulaSaltGrams.toFixed(2)),
      prefermentTotalFlour: parseFloat(totalCalculatedPrefermentFlour.toFixed(2)),
      prefermentTotalWater: parseFloat(totalCalculatedPrefermentWater.toFixed(2)),
    };
    return calculatedTableData;
  }, [recipe, steps, ingredientsMeta, fieldsMeta, stepTemplates, ingredientCategoriesMeta]);

  if (!recipe) return <div className="p-4 border border-border rounded-lg shadow-card bg-surface-elevated text-text-secondary">Loading recipe data for calculator...</div>;

  return (
    <div className="p-4 border border-border rounded-lg shadow-card bg-surface-elevated mt-4">
      <h2 className="text-lg font-semibold mb-3 text-text-primary">Recipe Calculator</h2>
      
      {/* Main Calculation Table */}
      {(() => {
        const numStepCols = calculatedValues.columns.length;
        let gridColsArbitraryValue: string;

        if (numStepCols > 0) {
          gridColsArbitraryValue = `auto_repeat(${numStepCols},_minmax(100px,_1fr))_auto`;
        } else {
          // Only "Ingredient" and "Totals" columns
          gridColsArbitraryValue = `auto_auto`;
        }
        const dynamicGridClass = `grid-cols-[${gridColsArbitraryValue}]`;

        return (
          <div className={`grid ${dynamicGridClass} gap-x-2 gap-y-1 text-sm mb-4 overflow-x-auto`}>
        {/* Header Row */}
        <div className="font-semibold sticky left-0 bg-surface-elevated z-10 pr-2">Ingredient</div>
        {calculatedValues.columns.map(col => (
          <div key={col.stepId} className="font-semibold text-center break-words">
            {col.name}
            <div className="text-xs text-text-tertiary">(Order: {col.order})</div>
            {col.isPreferment && col.prefermentContributionPct !== undefined && col.prefermentHydrationPct !== undefined && (
               <div className="text-xs text-accent-600">Preferment: {col.prefermentContributionPct.toFixed(0)}% / {col.prefermentHydrationPct.toFixed(0)}%</div>
            )}
          </div>
        ))}
        <div className="font-semibold text-center">Totals</div>

        {/* Flour Row */}
        <div className="sticky left-0 bg-surface-elevated z-10 pr-2">Flour</div>
        {calculatedValues.columns.map(col => <div key={`${col.stepId}-flour`} className="text-center">{col.flourWeight.toFixed(1)} g</div>)}
        <div className="text-center font-semibold">{calculatedValues.totals.flour.toFixed(1)} g</div>

        {/* Water/Liquid Row */}
        <div className="sticky left-0 bg-surface-elevated z-10 pr-2">Liquid</div>
        {calculatedValues.columns.map(col => <div key={`${col.stepId}-water`} className="text-center">{col.waterWeight.toFixed(1)} g</div>)}
        <div className="text-center font-semibold">{calculatedValues.totals.water.toFixed(1)} g</div>

        {/* Salt Row */}
        <div className="sticky left-0 bg-surface-elevated z-10 pr-2">Salt</div>
        {calculatedValues.columns.map(col => <div key={`${col.stepId}-salt`} className="text-center">{col.saltWeight.toFixed(1)} g</div>)}
        <div className="text-center font-semibold">{calculatedValues.totals.salt.toFixed(1)} g</div>

        {/* Step Total Row */}
        <div className="font-semibold sticky left-0 bg-surface-elevated z-10 pr-2">Step Total</div>
        {calculatedValues.columns.map(col => <div key={`${col.stepId}-total`} className="text-center font-medium">{col.totalWeight.toFixed(1)} g</div>)}
        <div className="text-center font-bold">{calculatedValues.totals.grandTotal.toFixed(1)} g</div>
          </div>
        );
      })()}

      {/* Display "Main Mix" components */}
      <div className="mt-4">
        <h3 className="text-md font-semibold mb-2 text-text-primary">Main Mix Components (To Add):</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="font-medium text-text-secondary">Flour:</div>
          <div className="text-text-primary">{calculatedValues.mainMixFlour.toFixed(1)} g</div>
          <div className="font-medium text-text-secondary">Liquid:</div>
          <div className="text-text-primary">{calculatedValues.mainMixLiquid.toFixed(1)} g</div>
          <div className="font-medium text-text-secondary">Salt:</div>
          <div className="text-text-primary">{calculatedValues.mainMixSalt.toFixed(1)} g</div>
        </div>
      </div>
      
      {/* Display "Preferment Summary" if any preferments */}
      {(calculatedValues.prefermentTotalFlour > 0 || calculatedValues.prefermentTotalWater > 0) && (
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2 text-text-primary">Preferment Summary (Calculated from Parameters):</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="font-medium text-text-secondary">Total Preferment Flour:</div>
              <div className="text-text-primary">{calculatedValues.prefermentTotalFlour.toFixed(1)} g</div>
              <div className="font-medium text-text-secondary">Total Preferment Water:</div>
              <div className="text-text-primary">{calculatedValues.prefermentTotalWater.toFixed(1)} g</div>
              <div className="font-medium text-text-secondary">Total Preferment Weight:</div>
              <div className="text-text-primary">{(calculatedValues.prefermentTotalFlour + calculatedValues.prefermentTotalWater).toFixed(1)} g</div>
          </div>
        </div>
      )}

      {/* Display "Other Ingredients" per step if any */}
      {calculatedValues.columns.some(col => col.otherIngredients.length > 0) && (
          <div className="mt-4">
              <h3 className="text-md font-semibold mb-2 text-text-primary">Other Ingredients by Step:</h3>
              {calculatedValues.columns.map(col => col.otherIngredients.length > 0 && (
                  <div key={`${col.stepId}-others`} className="mb-2 p-2 border border-border-subtle rounded-md bg-surface">
                      <h4 className="font-medium text-text-secondary">{col.name} (Order: {col.order})</h4>
                      <ul className="list-disc list-inside pl-2 text-sm text-text-primary">
                          {col.otherIngredients.map(ing => (
                              <li key={`${col.stepId}-${ing.name}`}>
                                  {ing.name}: {ing.weight.toFixed(1)} g
                                  {/* <span className="text-xs text-text-tertiary ml-1">({ing.originalAmount}{ing.unit})</span> */}
                              </li>
                          ))}
                      </ul>
                  </div>
              ))}
          </div>
      )}

      {/* Final Sanity Check: Target vs Calculated Total */}
      <div className="mt-4">
          <h3 className="text-md font-semibold mb-2 text-text-primary">Overall Totals Comparison:</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="font-medium text-text-secondary">Target Dough Weight:</div>
              <div className="text-text-primary">{calculatedValues.targetTotalDoughWeight.toFixed(1)} g</div>
              <div className="font-medium text-text-secondary">Calculated Dough Weight (from table):</div>
              <div className={`font-semibold ${
                  Math.abs(calculatedValues.targetTotalDoughWeight - calculatedValues.totals.grandTotal) > 1 
                  ? 'text-orange-600' 
                  : 'text-success-700'
                }`}>
                {calculatedValues.totals.grandTotal.toFixed(1)} g
              </div>
          </div>
      </div>

      {/* Debug Info if no steps or ingredients lead to calculations */}
      {recipe && recipe.totalWeight && recipe.totalWeight > 0 && steps.length > 0 && calculatedValues.columns.length === 0 && (
        <div className="mt-4 p-3 border border-yellow-400 bg-yellow-50 text-yellow-700 rounded-md text-sm">
          <p className="font-semibold">Note:</p>
          <p>The calculation table is empty. This might be because no ingredients are defined in the steps, or their amounts are zero.</p>
        </div>
      )}
      {recipe && calculatedValues.columns.length > 0 && calculatedValues.totals.grandTotal === 0 && (
        <div className="mt-4 p-3 border border-yellow-400 bg-yellow-50 text-yellow-700 rounded-md text-sm">
          <p className="font-semibold">Note:</p>
          <p>Calculated weights are all zero. Ensure recipe targets (total weight) and ingredient amounts/percentages are set.</p>
        </div>
      )}
    </div>
  );
}
