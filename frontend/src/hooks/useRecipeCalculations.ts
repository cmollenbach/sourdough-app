// useRecipeCalculations.ts
import { useMemo } from "react";
import { useRecipeBuilderStore } from "../store/recipeBuilderStore";
import { IngredientCalculationMode, type FullRecipe, type RecipeStep } from "../types/recipe";

// --- CONSTANTS ---
const PREFERMENT_CONTRIB_PARAM_NAME = 'Contribution (pct)'; 
const PREFERMENT_HYDRATION_PARAM_NAME = 'Hydration';
const PREFERMENT_STEP_TYPE_ID = 6;
// const MIX_STEP_TEMPLATE_NAME = "Final Mix"; // No longer auto-calculating a mix step

const FLOUR_CATEGORY_NAME = "Flour"; // Ensure this matches your category name
const WATER_CATEGORY_NAME = "Liquid";  // Ensure this matches your category name (e.g., "Water" or "Liquid")
const SALT_CATEGORY_NAME = "Salt";    // Ensure this matches your category name

// --- INTERFACES ---
export interface FlourComponent {
  ingredientId: number;
  name: string;
  weight: number;
}

export interface CalculatedStepColumn {
  stepId: number;
  order: number;
  name: string;
  isPreferment: boolean;
  prefermentContributionPct?: number | null; // From step fields
  prefermentHydrationPct?: number | null;    // From step fields
  flourComponents: FlourComponent[];
  genericFlourWeight: number; // Weight of generic flour if no specific components
  waterWeight: number;
  saltWeight: number;
  totalWeight: number; // Sum of all ingredient weights in this step
}

export interface CalculatedTableData {
  columns: CalculatedStepColumn[];
  totals: {
    totalFlour: number; // Sum of all flour types
    flourDetails: Array<{ ingredientId: number; name: string; totalWeight: number }>;
    water: number;
    salt: number;
    grandTotal: number;
  };
  targetTotalDoughWeight: number;
}

export function useRecipeCalculations(
  recipe: FullRecipe | null | undefined,
  steps: RecipeStep[]
): CalculatedTableData {
  const ingredientsMeta = useRecipeBuilderStore((state) => state.ingredientsMeta);
  const ingredientCategoriesMeta = useRecipeBuilderStore((state) => state.ingredientCategoriesMeta);
  const fieldsMeta = useRecipeBuilderStore((state) => state.fieldsMeta);
  const stepTemplates = useRecipeBuilderStore((state) => state.stepTemplates);

  return useMemo((): CalculatedTableData => {
    const emptyData: CalculatedTableData = {
      columns: [],
      totals: { totalFlour: 0, flourDetails: [], water: 0, salt: 0, grandTotal: 0},
      targetTotalDoughWeight: recipe?.totalWeight ?? 0,
    };

    if (!recipe || !recipe.totalWeight || recipe.totalWeight <= 0 || !steps.length || 
        !ingredientsMeta || !ingredientCategoriesMeta || !fieldsMeta || !stepTemplates) {
      return emptyData;
    }

    const flourCategory = ingredientCategoriesMeta.find(cat => cat.name === FLOUR_CATEGORY_NAME);
    const waterCategory = ingredientCategoriesMeta.find(cat => cat.name === WATER_CATEGORY_NAME);
    const saltCategory = ingredientCategoriesMeta.find(cat => cat.name === SALT_CATEGORY_NAME);

    if (!flourCategory || !waterCategory || !saltCategory) {
      console.error("Essential ingredient categories (Flour, Water/Liquid, Salt) not found in metadata.");
      return emptyData;
    }
    const FLOUR_CATEGORY_ID = flourCategory.id;
    const WATER_CATEGORY_ID = waterCategory.id;
    const SALT_CATEGORY_ID = saltCategory.id;

    // Calculate total formula flour (used if ingredients are percentage-based)
    // And overall targets for water and salt based on percentages
    let overallTargetFlour = 0;
    let overallTargetWater = 0;
    let overallTargetSalt = 0;

    if (recipe.hydrationPct != null && recipe.saltPct != null) {
      const totalPercentage = 1 + (recipe.hydrationPct / 100) + (recipe.saltPct / 100);
      if (totalPercentage > 0) {
        overallTargetFlour = recipe.totalWeight / totalPercentage;
        overallTargetWater = overallTargetFlour * (recipe.hydrationPct / 100);
        overallTargetSalt = overallTargetFlour * (recipe.saltPct / 100);
      }
    }

    let pendingOverallFlour = overallTargetFlour;
    let pendingOverallWater = overallTargetWater;
    let pendingOverallSalt = overallTargetSalt;

    const tempStepDetails: Array<{
      step: RecipeStep;
      template: NonNullable<typeof stepTemplates[0]>;
      explicitFlourComponents: FlourComponent[];
      explicitWaterWeight: number;
      explicitSaltWeight: number;
      isParamDrivenPreferment: boolean;
      prefermentParams?: { contrib: number | null, hydr: number | null };
      calculatedFlourForStep: number; // Can be from explicit or generic param-driven preferment
      calculatedWaterForStep: number; // Can be from explicit or generic param-driven preferment
      calculatedSaltForStep: number;  // From explicit
    }> = [];

    const prefermentContribFieldId = fieldsMeta.find(f => f.name === PREFERMENT_CONTRIB_PARAM_NAME)?.id;
    const prefermentHydrationFieldId = fieldsMeta.find(f => f.name === PREFERMENT_HYDRATION_PARAM_NAME)?.id;

    // Pass 1: Process explicit ingredients and parameter-driven preferments
    for (const step of steps) {
      const template = stepTemplates.find(t => t.id === step.stepTemplateId);
      if (!template) continue;

      const explicitFlourComponents: FlourComponent[] = [];
      let explicitWaterWeight = 0;
      let explicitSaltWeight = 0;
      let stepCalculatedFlour = 0;
      let stepCalculatedWater = 0;

      let isParamDrivenPreferment = false;
      let pContrib: number | null = null;
      let pHydr: number | null = null;

      if (template.stepTypeId === PREFERMENT_STEP_TYPE_ID && prefermentContribFieldId && prefermentHydrationFieldId) {
          const contribField = step.fields.find(f => f.fieldId === prefermentContribFieldId);
          const hydField = step.fields.find(f => f.fieldId === prefermentHydrationFieldId);
          if (contribField?.value != null && hydField?.value != null) {
            isParamDrivenPreferment = true;
            pContrib = Number(contribField.value);
            pHydr = Number(hydField.value);
          }
      }

      for (const ing of step.ingredients) {
        const ingMeta = ingredientsMeta.find(m => m.id === ing.ingredientId);
        if (!ingMeta) continue;
        let weight = 0;
        if (ing.calculationMode === IngredientCalculationMode.PERCENTAGE) {
          // If this is a param-driven preferment, and the ingredient is flour,
          // the percentage should be of the flour allocated to THIS preferment step.
          if (isParamDrivenPreferment && pContrib != null && ingMeta.ingredientCategoryId === FLOUR_CATEGORY_ID) {
            // Calculate flour for this preferment step first based on its contribution %
            const prefermentStepTargetFlour = overallTargetFlour * (pContrib / 100);
            weight = (ing.amount / 100) * prefermentStepTargetFlour;
          } else {
            // Otherwise, percentage is of the overall target flour (e.g., for ingredients in a main mix step)
            weight = (ing.amount / 100) * overallTargetFlour;
          }
        } else if (ing.calculationMode === IngredientCalculationMode.FIXED_WEIGHT) {
          weight = ing.amount;
        }

        if (ingMeta.ingredientCategoryId === FLOUR_CATEGORY_ID) {
          // This component's weight is already calculated correctly above
          explicitFlourComponents.push({
            ingredientId: ing.ingredientId,
            name: ingMeta.name,
            weight: parseFloat(weight.toFixed(2)),
          });
        } else if (ingMeta.ingredientCategoryId === WATER_CATEGORY_ID) {
          explicitWaterWeight += weight;
        } else if (ingMeta.ingredientCategoryId === SALT_CATEGORY_ID) {
          explicitSaltWeight += weight;
        }
      }

      stepCalculatedFlour = explicitFlourComponents.reduce((sum, fc) => sum + fc.weight, 0);
      stepCalculatedWater = explicitWaterWeight;

      if (isParamDrivenPreferment && pContrib != null && pHydr != null) {
        // If explicit flour components were added, stepCalculatedFlour is their sum.
        // If NO explicit flour components were added, then the flour for this preferment is generic,
        // calculated from its contribution percentage.
        if (explicitFlourComponents.length === 0) { 
          stepCalculatedFlour = overallTargetFlour * (pContrib / 100);
        }
        if (explicitWaterWeight === 0) { // If no explicit water, calculate water based on preferment's flour and its hydration param
          stepCalculatedWater = stepCalculatedFlour * (pHydr / 100);
        }
      }
      
      pendingOverallFlour -= stepCalculatedFlour;
      pendingOverallWater -= stepCalculatedWater;
      pendingOverallSalt -= explicitSaltWeight; // Salt is only from explicit ingredients

      tempStepDetails.push({
        step, template, explicitFlourComponents, explicitWaterWeight, explicitSaltWeight,
        isParamDrivenPreferment, 
        prefermentParams: isParamDrivenPreferment ? { contrib: pContrib, hydr: pHydr } : undefined,
        calculatedFlourForStep: stepCalculatedFlour,
        calculatedWaterForStep: stepCalculatedWater,
        calculatedSaltForStep: explicitSaltWeight,
      });
    }

    // Pass 2: Build final table columns, distributing pending amounts
    const tableColumns: CalculatedStepColumn[] = tempStepDetails.map(tsd => {
      const colFlourComponents = tsd.explicitFlourComponents;
      let colGenericFlourWeight = 0;
      let colWaterWeight = tsd.calculatedWaterForStep;
      let colSaltWeight = tsd.calculatedSaltForStep;

      if (tsd.explicitFlourComponents.length === 0 && !tsd.isParamDrivenPreferment) {
        // This step has no explicit flour and is not a param-driven preferment
        // It's a candidate to absorb pending flour
        if (pendingOverallFlour > 0.001) { // Use a small threshold for floating point
          colGenericFlourWeight = Math.max(0, pendingOverallFlour);
          pendingOverallFlour = 0; // Absorbed
        }
        if (tsd.explicitWaterWeight === 0 && pendingOverallWater > 0.001) {
          colWaterWeight = Math.max(0, pendingOverallWater);
          pendingOverallWater = 0; // Absorbed
        }
        if (tsd.explicitSaltWeight === 0 && pendingOverallSalt > 0.001) {
          colSaltWeight = Math.max(0, pendingOverallSalt);
          pendingOverallSalt = 0; // Absorbed
        }
      } else if (tsd.explicitFlourComponents.length === 0 && tsd.isParamDrivenPreferment) {
        // Param-driven preferment with no explicit flour items; its flour is generic
        colGenericFlourWeight = tsd.calculatedFlourForStep;
      }

      const totalFlourInCol = colFlourComponents.reduce((sum, fc) => sum + fc.weight, 0) + colGenericFlourWeight;
      // For totalWeight, sum all ingredients including 'others' if they were tracked.
      // For simplicity here, we'll sum knowns. A more robust sum would require tracking all ingredient weights.
      const stepTotalWeight = totalFlourInCol + colWaterWeight + colSaltWeight; // Simplified

      return {
        stepId: tsd.step.id,
        order: tsd.step.order,
        name: tsd.template.name,
        isPreferment: tsd.template.stepTypeId === PREFERMENT_STEP_TYPE_ID, // General preferment type
        prefermentContributionPct: tsd.prefermentParams?.contrib,
        prefermentHydrationPct: tsd.prefermentParams?.hydr,
        flourComponents: colFlourComponents,
        genericFlourWeight: parseFloat(colGenericFlourWeight.toFixed(2)),
        waterWeight: parseFloat(colWaterWeight.toFixed(2)),
        saltWeight: parseFloat(colSaltWeight.toFixed(2)),
        totalWeight: parseFloat(stepTotalWeight.toFixed(2)), // This needs to be more accurate if 'other' ingredients exist
      };
    }).sort((a, b) => a.order - b.order);

    // Calculate final totals
    const finalTotals = tableColumns.reduce((acc, col) => {
        acc.totalFlour += col.genericFlourWeight;
        col.flourComponents.forEach(fc => { // Specific flours
            acc.totalFlour += fc.weight;
            const existingFlourDetail = acc.flourDetails.find(fd => fd.ingredientId === fc.ingredientId);
            if (existingFlourDetail) {
                existingFlourDetail.totalWeight += fc.weight;
            } else {
                acc.flourDetails.push({ ingredientId: fc.ingredientId, name: fc.name, totalWeight: fc.weight });
            }
        });
        acc.water += col.waterWeight;
        acc.salt += col.saltWeight;
        acc.grandTotal += col.totalWeight;
        return acc;
    }, { totalFlour: 0, flourDetails: [] as Array<{ ingredientId: number; name: string; totalWeight: number }>, water: 0, salt: 0, grandTotal: 0});
    
    return {
      columns: tableColumns,
      totals: {
        totalFlour: parseFloat(finalTotals.totalFlour.toFixed(2)),
        flourDetails: finalTotals.flourDetails.map(fd => ({...fd, totalWeight: parseFloat(fd.totalWeight.toFixed(2))})).sort((a,b) => a.name.localeCompare(b.name)),
        water: parseFloat(finalTotals.water.toFixed(2)),
        salt: parseFloat(finalTotals.salt.toFixed(2)),
        grandTotal: parseFloat(finalTotals.grandTotal.toFixed(2)),
      },
      targetTotalDoughWeight: recipe.totalWeight,
    };

  }, [recipe, steps, ingredientsMeta, ingredientCategoriesMeta, fieldsMeta, stepTemplates]);
}
