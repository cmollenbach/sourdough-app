import { useMemo } from "react";
import { useRecipeBuilderStore } from "../store/recipeBuilderStore";
import { IngredientCalculationMode, type FullRecipe, type RecipeStep } from "../types/recipe";

const PREFERMENT_CONTRIB_PARAM_NAME = 'Contribution (pct)';
const PREFERMENT_HYDRATION_PARAM_NAME = 'Hydration';

const FLOUR_CATEGORY_NAME = "Flour";
const WATER_CATEGORY_NAME = "Liquid";
const SALT_CATEGORY_NAME = "Salt";

const PREFERMENT_ROLE = 'PREFERMENT';
const MIX_ROLE = 'MIX';

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
  prefermentContributionPct?: number | null;
  prefermentHydrationPct?: number | null;
  flourComponents: FlourComponent[];
  genericFlourWeight: number;
  waterWeight: number;
  saltWeight: number;
  totalWeight: number;
}

export interface CalculatedTableData {
  columns: CalculatedStepColumn[];
  totals: {
    totalFlour: number;
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
      totals: { totalFlour: 0, flourDetails: [], water: 0, salt: 0, grandTotal: 0 },
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

    // Calculate total formula flour and targets
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

    // Pass 1: Calculate each step's explicit and param-driven contributions
    const prefermentContribFieldId = fieldsMeta.find(f => f.name === PREFERMENT_CONTRIB_PARAM_NAME)?.id;
    const prefermentHydrationFieldId = fieldsMeta.find(f => f.name === PREFERMENT_HYDRATION_PARAM_NAME)?.id;

    type StepTotals = {
      step: RecipeStep;
      template: NonNullable<typeof stepTemplates[0]>;
      isPreferment: boolean;
      isMix: boolean;
      prefermentParams?: { contrib: number | null, hydr: number | null };
      explicitFlourComponents: FlourComponent[];
      explicitWaterWeight: number;
      explicitSaltWeight: number;
      genericFlourWeight: number;
      waterWeight: number;
      saltWeight: number;
    };

    const stepTotals: StepTotals[] = [];

    // First pass: calculate all steps (no step absorbs pending except MIX)
    for (const step of steps) {
      const template = stepTemplates.find(t => t.id === step.stepTemplateId);
      if (!template) continue;

      const isPreferment = template.role === PREFERMENT_ROLE;
      const isMix = template.role === MIX_ROLE;

      const explicitFlourComponents: FlourComponent[] = [];
      let explicitWaterWeight = 0;
      let explicitSaltWeight = 0;
      let genericFlourWeight = 0;
      let waterWeight = 0;
      let saltWeight = 0;
      let prefermentParams: { contrib: number | null, hydr: number | null } | undefined;

      let isParamDrivenPreferment = false;
      let pContrib: number | null = null;
      let pHydr: number | null = null;

      if (isPreferment && prefermentContribFieldId && prefermentHydrationFieldId) {
        const contribField = step.fields.find(f => f.fieldId === prefermentContribFieldId);
        const hydField = step.fields.find(f => f.fieldId === prefermentHydrationFieldId);
        if (contribField?.value != null && hydField?.value != null) {
          isParamDrivenPreferment = true;
          pContrib = Number(contribField.value);
          pHydr = Number(hydField.value);
          prefermentParams = { contrib: pContrib, hydr: pHydr };
        }
      }

      for (const ing of step.ingredients) {
        const ingMeta = ingredientsMeta.find(m => m.id === ing.ingredientId);
        if (!ingMeta) continue;
        let weight = 0;
        if (ing.calculationMode === IngredientCalculationMode.PERCENTAGE) {
          if (isParamDrivenPreferment && pContrib != null && ingMeta.ingredientCategoryId === FLOUR_CATEGORY_ID) {
            const prefermentStepTargetFlour = overallTargetFlour * (pContrib / 100);
            weight = (ing.amount / 100) * prefermentStepTargetFlour;
          } else {
            weight = (ing.amount / 100) * overallTargetFlour;
          }
        } else if (ing.calculationMode === IngredientCalculationMode.FIXED_WEIGHT) {
          weight = ing.amount;
        }

        if (ingMeta.ingredientCategoryId === FLOUR_CATEGORY_ID) {
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

      // Only parameter-driven preferment gets generic flour/water
      if (isParamDrivenPreferment && pContrib != null && pHydr != null) {
        if (explicitFlourComponents.length === 0) {
          genericFlourWeight = overallTargetFlour * (pContrib / 100);
        }
        if (explicitWaterWeight === 0) {
          waterWeight = (explicitFlourComponents.reduce((sum, fc) => sum + fc.weight, 0) + genericFlourWeight) * (pHydr / 100);
        } else {
          waterWeight = explicitWaterWeight;
        }
      } else {
        genericFlourWeight = 0;
        waterWeight = explicitWaterWeight;
      }
      saltWeight = explicitSaltWeight;

      stepTotals.push({
        step,
        template,
        isPreferment,
        isMix,
        prefermentParams,
        explicitFlourComponents,
        explicitWaterWeight,
        explicitSaltWeight,
        genericFlourWeight,
        waterWeight,
        saltWeight,
      });
    }

    // Sum all non-mix steps' flour, water, salt (including AUTOLYSE, PREFERMENT, etc.)
    let sumFlourOtherSteps = 0;
    let sumWaterOtherSteps = 0;
    let sumSaltOtherSteps = 0;
    stepTotals.forEach(st => {
      if (!st.isMix) {
        sumFlourOtherSteps += st.explicitFlourComponents.reduce((sum, fc) => sum + fc.weight, 0) + st.genericFlourWeight;
        sumWaterOtherSteps += st.waterWeight;
        sumSaltOtherSteps += st.saltWeight;
      }
    });

    // Second pass: set MIX step to absorb the remainder
    const columns: CalculatedStepColumn[] = stepTotals.map(st => {
      let genericFlourWeight = st.genericFlourWeight;
      let waterWeight = st.waterWeight;
      let saltWeight = st.saltWeight;

      if (st.isMix) {
        genericFlourWeight = Math.max(0, overallTargetFlour - sumFlourOtherSteps);
        waterWeight = Math.max(0, overallTargetWater - sumWaterOtherSteps);
        saltWeight = Math.max(0, overallTargetSalt - sumSaltOtherSteps);
      }

      // Clamp all to zero if negative
      const totalFlourInCol = Math.max(0, st.explicitFlourComponents.reduce((sum, fc) => sum + fc.weight, 0) + genericFlourWeight);
      const stepWater = Math.max(0, waterWeight);
      const stepSalt = Math.max(0, saltWeight);
      const stepTotalWeight = totalFlourInCol + stepWater + stepSalt;

      return {
        stepId: st.step.id,
        order: st.step.order,
        name: st.template.name,
        isPreferment: st.isPreferment,
        prefermentContributionPct: st.prefermentParams?.contrib,
        prefermentHydrationPct: st.prefermentParams?.hydr,
        flourComponents: st.explicitFlourComponents,
        genericFlourWeight: parseFloat(genericFlourWeight.toFixed(2)),
        waterWeight: parseFloat(stepWater.toFixed(2)),
        saltWeight: parseFloat(stepSalt.toFixed(2)),
        totalWeight: parseFloat(stepTotalWeight.toFixed(2)),
      };
    }).sort((a, b) => a.order - b.order);

    // Calculate final totals
    const finalTotals = columns.reduce((acc, col) => {
      acc.totalFlour += col.genericFlourWeight;
      col.flourComponents.forEach(fc => {
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
    }, { totalFlour: 0, flourDetails: [] as Array<{ ingredientId: number; name: string; totalWeight: number }>, water: 0, salt: 0, grandTotal: 0 });

    // After calculating all columns and before returning:
    const roundingError = recipe.totalWeight - finalTotals.grandTotal;
    if (Math.abs(roundingError) > 0.01) {
      // Add the rounding error to the Mix step's totalWeight
      const mixCol = columns.find(col => col.name.toLowerCase().includes("mix"));
      if (mixCol) {
        mixCol.totalWeight += roundingError;
        finalTotals.grandTotal += roundingError;
      }
    }

    return {
      columns,
      totals: {
        totalFlour: parseFloat(finalTotals.totalFlour.toFixed(2)),
        flourDetails: finalTotals.flourDetails.map(fd => ({ ...fd, totalWeight: parseFloat(fd.totalWeight.toFixed(2)) })).sort((a, b) => a.name.localeCompare(b.name)),
        water: parseFloat(finalTotals.water.toFixed(2)),
        salt: parseFloat(finalTotals.salt.toFixed(2)),
        grandTotal: parseFloat(finalTotals.grandTotal.toFixed(2)),
      },
      targetTotalDoughWeight: recipe.totalWeight,
    };
  }, [recipe, steps, ingredientsMeta, ingredientCategoriesMeta, fieldsMeta, stepTemplates]);
}