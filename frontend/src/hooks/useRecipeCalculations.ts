import { useMemo } from "react";
import { IngredientCalculationMode, type FullRecipe, type RecipeStep } from "../types/recipe";
import type { IngredientMeta, IngredientCategoryMeta, FieldMeta, StepTemplate as StepTemplateMeta } from "../types/recipeLayout"; // Corrected IngredientCategory to IngredientCategoryMeta, aliased StepTemplate

const PREFERMENT_CONTRIB_PARAM_NAME = 'Contribution (pct)';
const PREFERMENT_HYDRATION_PARAM_NAME = 'Hydration';

const FLOUR_CATEGORY_NAME = "Flour";
const WATER_CATEGORY_NAME = "Liquid";
const SALT_CATEGORY_NAME = "Salt";

const PREFERMENT_ROLE = 'PREFERMENT';
const MIX_ROLE = 'MIX';
const AUTOLYSE_ROLE = 'AUTOLYSE';

// Define a more specific type for a step template that we expect to be populated
type PopulatedStepTemplate = NonNullable<StepTemplateMeta>;

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
  percentageOfTotal: number; // New field for the percentage
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

// --- Helper Function: Calculate Overall Recipe Targets (Phase 1) ---
interface RecipeTargets {
  overallTargetFlour: number;
  overallTargetWater: number;
  overallTargetSalt: number;
}

function calculateOverallRecipeTargets(recipe: FullRecipe): RecipeTargets {
  let overallTargetFlour = 0;
  let overallTargetWater = 0;
  let overallTargetSalt = 0;

  if (typeof recipe.totalWeight === 'number' && recipe.totalWeight > 0 &&
      recipe.hydrationPct != null && recipe.saltPct != null) {
    const totalPercentage = 1 + (recipe.hydrationPct / 100) + (recipe.saltPct / 100);
    if (totalPercentage > 0) {
      overallTargetFlour = recipe.totalWeight / totalPercentage;
      overallTargetWater = overallTargetFlour * (recipe.hydrationPct / 100);
      overallTargetSalt = overallTargetFlour * (recipe.saltPct / 100);
    }
  }

  return {
    overallTargetFlour: parseFloat(overallTargetFlour.toFixed(2)),
    overallTargetWater: parseFloat(overallTargetWater.toFixed(2)),
    overallTargetSalt: parseFloat(overallTargetSalt.toFixed(2)),
  };
}


export function useRecipeCalculations(
  recipe: FullRecipe | null | undefined,
  steps: RecipeStep[],
  ingredientsMeta: IngredientMeta[] | undefined,
  ingredientCategoriesMeta: IngredientCategoryMeta[] | undefined, // Corrected type here
  fieldsMeta: FieldMeta[] | undefined,
  stepTemplates: StepTemplateMeta[] | undefined
): CalculatedTableData {
  return useMemo((): CalculatedTableData => {
    const emptyData: CalculatedTableData = {
      columns: [],
      totals: { totalFlour: 0, flourDetails: [], water: 0, salt: 0, grandTotal: 0 },
      targetTotalDoughWeight: recipe?.totalWeight ?? 0,
    };

    if (
      !recipe ||
      !recipe.totalWeight ||
      recipe.totalWeight <= 0 ||
      !steps || !steps.length || // Added check for steps itself being defined
      !ingredientsMeta || ingredientsMeta.length === 0 || // Check length
      !ingredientCategoriesMeta || ingredientCategoriesMeta.length === 0 || // Check length
      !fieldsMeta || fieldsMeta.length === 0 || // Check length
      !stepTemplates || stepTemplates.length === 0 // Check length
    ) {
      return emptyData;
    }

    // --- PHASE 1: Calculate Overall Recipe Targets ---
    const flourCategory = ingredientCategoriesMeta.find(cat => cat.name === FLOUR_CATEGORY_NAME);
    const waterCategory = ingredientCategoriesMeta.find(cat => cat.name === WATER_CATEGORY_NAME);
    const saltCategory = ingredientCategoriesMeta.find(cat => cat.name === SALT_CATEGORY_NAME);

    if (!flourCategory || !waterCategory || !saltCategory) {
      console.error("Essential ingredient categories not found in metadata.");
      return emptyData;
    }
    const WATER_CATEGORY_ID = waterCategory.id;
    const SALT_CATEGORY_ID = saltCategory.id;

    // --- PHASE 1: Calculate Overall Recipe Targets ---
    const recipeTargets = calculateOverallRecipeTargets(recipe);
    // --- END OF PHASE 1 ---


    // --- PHASE 2: Allocate Total Ingredients to Each Step ---
    const prefermentContribFieldId = fieldsMeta.find(f => f.name === PREFERMENT_CONTRIB_PARAM_NAME)?.id;
    const prefermentHydrationFieldId = fieldsMeta.find(f => f.name === PREFERMENT_HYDRATION_PARAM_NAME)?.id;
    type StepTotals = {
      step: RecipeStep;
      template: PopulatedStepTemplate;
      isPreferment: boolean;
      isMix: boolean;
      prefermentParams?: { contrib: number | null, hydr: number | null };
      explicitFlourComponents: FlourComponent[];
      // These represent the step's total contribution *before* MIX step absorption
      // For preferments, genericFlourWeight and waterWeight are based on its params.
      // For others, they are sum of their explicit ingredients.
      contributedFlour: number; // Sum of explicitFlourComponents + genericFlourWeight (for preferments)
      contributedWater: number;
      contributedSalt: number;
    };

    // Phase 2, Stage A: Calculate contributions of non-MIX steps
    const nonMixStepContributions: StepTotals[] = [];
    let sumFlourFromPreferments = 0;
    let sumWaterFromPreferments = 0;

    // First, process preferments to know their F/W/S contributions
    for (const step of steps) {
      const template = stepTemplates.find(t => t.id === step.stepTemplateId);
      if (!template || template.role !== PREFERMENT_ROLE) continue;

      const explicitFlourComponents: FlourComponent[] = [];
      let genericFlourWeight = 0;
      let waterFromParams = 0;
      let saltFromIngredients = 0; // Salt in preferment from explicit ingredients
      let prefermentParams: { contrib: number | null, hydr: number | null } | undefined;

      if (prefermentContribFieldId && prefermentHydrationFieldId) {
        const contribField = (step.fields || []).find(f => f.fieldId === prefermentContribFieldId);
        const hydField = (step.fields || []).find(f => f.fieldId === prefermentHydrationFieldId);
        if (contribField?.value != null && hydField?.value != null) {
          const pContrib = Number(contribField.value);
          const pHydr = Number(hydField.value);
          prefermentParams = { contrib: pContrib, hydr: pHydr };

          // Calculate specific flours within this preferment
          for (const ing of step.ingredients) {
            const ingMeta = ingredientsMeta.find(m => m.id === ing.ingredientId);
            if (!ingMeta) continue;
            let weight = 0;
            if (ingMeta.ingredientCategoryId === flourCategory.id) {
              const prefermentTotalFlour = recipeTargets.overallTargetFlour * (pContrib / 100);
              if (ing.calculationMode === IngredientCalculationMode.PERCENTAGE) {
                weight = (ing.amount / 100) * prefermentTotalFlour;
              } else if (ing.calculationMode === IngredientCalculationMode.FIXED_WEIGHT) {
                weight = ing.amount;
              }
              explicitFlourComponents.push({ ingredientId: ing.ingredientId, name: ingMeta.name, weight: parseFloat(weight.toFixed(2)) });
            } else if (ingMeta.ingredientCategoryId === SALT_CATEGORY_ID && ing.calculationMode === IngredientCalculationMode.FIXED_WEIGHT) {
                saltFromIngredients += ing.amount; // Accumulate fixed salt in preferment
            }
          }

          const totalSpecificFlourWeightInPreferment = explicitFlourComponents.reduce((sum, fc) => sum + fc.weight, 0);
          const prefermentTargetFlour = recipeTargets.overallTargetFlour * (pContrib / 100);
          genericFlourWeight = Math.max(0, prefermentTargetFlour - totalSpecificFlourWeightInPreferment);
          const totalFlourInPrefermentStep = totalSpecificFlourWeightInPreferment + genericFlourWeight;
          waterFromParams = totalFlourInPrefermentStep * (pHydr / 100);
        }
      }
      const contributedFlour = explicitFlourComponents.reduce((s,fc) => s + fc.weight, 0) + genericFlourWeight;
      sumFlourFromPreferments += contributedFlour;
      sumWaterFromPreferments += waterFromParams;

      nonMixStepContributions.push({
        step, template, isPreferment: true, isMix: false, prefermentParams,
        explicitFlourComponents, // Specific flours of this preferment
        contributedFlour: parseFloat(contributedFlour.toFixed(2)),
        contributedWater: parseFloat(waterFromParams.toFixed(2)),
        contributedSalt: parseFloat(saltFromIngredients.toFixed(2)),
      });
    }

    // Then, process other non-MIX steps (Autolyse, Enrichments, etc.)
    for (const step of steps) {
      const template = stepTemplates.find(t => t.id === step.stepTemplateId);
      if (!template || template.role === PREFERMENT_ROLE || template.role === MIX_ROLE) continue;

      const explicitFlourComponents: FlourComponent[] = [];
      let stepTotalFlour = 0; // Total flour for this step
      let stepTotalWater = 0; // Total water for this step
      let stepTotalSalt = 0;  // Total salt for this step (typically 0 for autolyse)

      if (template.role === AUTOLYSE_ROLE) {
        // Autolyse step gets (Total Recipe F/W - Preferment F/W)
        stepTotalFlour = Math.max(0, recipeTargets.overallTargetFlour - sumFlourFromPreferments);
        stepTotalWater = Math.max(0, recipeTargets.overallTargetWater - sumWaterFromPreferments);
        // stepTotalSalt = Math.max(0, recipeTargets.overallTargetSalt - sumSaltFromPreferments); // Usually 0

        // If specific ingredients are listed for autolyse, they define the breakdown of stepTotalFlour.
        // If no ingredients are listed, stepTotalFlour will be treated as generic in Phase 3.
        for (const ing of step.ingredients) {
          const ingMeta = ingredientsMeta.find(m => m.id === ing.ingredientId);
          if (!ingMeta) continue;
          let weight = 0;
          if (ingMeta.ingredientCategoryId === flourCategory.id) {
            if (ing.calculationMode === IngredientCalculationMode.PERCENTAGE) {
              // Percentage is of the autolyse step's total allocated flour (stepTotalFlour)
              weight = (ing.amount / 100) * stepTotalFlour;
            } else if (ing.calculationMode === IngredientCalculationMode.FIXED_WEIGHT) {
              weight = ing.amount; // Fixed weight for this specific flour component
            }
            explicitFlourComponents.push({ ingredientId: ing.ingredientId, name: ingMeta.name, weight: parseFloat(weight.toFixed(2)) });
          }
          // Note: Water in autolyse is usually just "Water". If specific water types could be defined
          // as ingredients within autolyse, similar logic would apply here for WATER_CATEGORY_ID.
          // For now, stepTotalWater covers the entire water for autolyse.
        }
      } else {
        // For other non-MIX, non-PREFERMENT, non-AUTOLYSE steps (e.g., Enrich, Inclusion)
        // their contributions are based on summing their explicit ingredients.
        for (const ing of step.ingredients) {
          const ingMeta = ingredientsMeta.find(m => m.id === ing.ingredientId);
          if (!ingMeta) continue;
          let weight = 0;
          if (ing.calculationMode === IngredientCalculationMode.PERCENTAGE) {
            // For these other steps, percentage is of overall recipe targets
            if (ingMeta.ingredientCategoryId === flourCategory.id) {
              weight = (ing.amount / 100) * recipeTargets.overallTargetFlour;
            } else if (ingMeta.ingredientCategoryId === WATER_CATEGORY_ID) {
              weight = (ing.amount / 100) * recipeTargets.overallTargetWater;
            } else if (ingMeta.ingredientCategoryId === SALT_CATEGORY_ID) {
              weight = (ing.amount / 100) * recipeTargets.overallTargetSalt;
            }
          } else if (ing.calculationMode === IngredientCalculationMode.FIXED_WEIGHT) {
            weight = ing.amount;
          }
          weight = parseFloat(weight.toFixed(2));

          if (ingMeta.ingredientCategoryId === flourCategory.id) {
            explicitFlourComponents.push({ ingredientId: ing.ingredientId, name: ingMeta.name, weight });
            stepTotalFlour += weight;
          } else if (ingMeta.ingredientCategoryId === WATER_CATEGORY_ID) {
            stepTotalWater += weight;
          } else if (ingMeta.ingredientCategoryId === SALT_CATEGORY_ID) {
            stepTotalSalt += weight;
          }
        }
      }
      nonMixStepContributions.push({
        step, template, isPreferment: false, isMix: template.role === MIX_ROLE,
        explicitFlourComponents, // Specific flours of this step
        contributedFlour: parseFloat(stepTotalFlour.toFixed(2)),
        contributedWater: parseFloat(stepTotalWater.toFixed(2)),
        contributedSalt: parseFloat(stepTotalSalt.toFixed(2)),
      });
    }

    // Phase 2, Stage B: Determine MIX step's explicit contributions and then total allocated amounts
    const mixStepData = steps.find(s => stepTemplates.find(t => t.id === s.stepTemplateId)?.role === MIX_ROLE);
    const mixStepExplicitFlourComponents: FlourComponent[] = [];

    if (mixStepData) {
      const mixTemplate = stepTemplates.find(t => t.id === mixStepData.stepTemplateId);
      if (mixTemplate) {
        for (const ing of mixStepData.ingredients) {
          const ingMeta = ingredientsMeta.find(m => m.id === ing.ingredientId);
          if (!ingMeta) continue;
          let weight = 0;
          if (ing.calculationMode === IngredientCalculationMode.PERCENTAGE) {
            if (ingMeta.ingredientCategoryId === flourCategory.id) weight = (ing.amount / 100) * recipeTargets.overallTargetFlour;
            // else if (ingMeta.ingredientCategoryId === WATER_CATEGORY_ID) weight = (ing.amount / 100) * recipeTargets.overallTargetWater; // Value assigned to mixStepExplicitWater but not used
            // else if (ingMeta.ingredientCategoryId === SALT_CATEGORY_ID) weight = (ing.amount / 100) * recipeTargets.overallTargetSalt; // Value assigned to mixStepExplicitSalt but not used
          } else if (ing.calculationMode === IngredientCalculationMode.FIXED_WEIGHT) {
            weight = ing.amount;
          }
          weight = parseFloat(weight.toFixed(2));
          if (ingMeta.ingredientCategoryId === flourCategory.id) mixStepExplicitFlourComponents.push({ ingredientId: ing.ingredientId, name: ingMeta.name, weight });
          // else if (ingMeta.ingredientCategoryId === WATER_CATEGORY_ID) mixStepExplicitWater += weight; // mixStepExplicitWater is not used
          // else if (ingMeta.ingredientCategoryId === SALT_CATEGORY_ID) mixStepExplicitSalt += weight;   // mixStepExplicitSalt is not used
        }
      }
    }

    const sumFlourFromNonMix = nonMixStepContributions.reduce((sum, st) => sum + st.contributedFlour, 0);
    const sumWaterFromNonMix = nonMixStepContributions.reduce((sum, st) => sum + st.contributedWater, 0);
    const sumSaltFromNonMix = nonMixStepContributions.reduce((sum, st) => sum + st.contributedSalt, 0);

    const mixStepAllocatedFlour = Math.max(0, recipeTargets.overallTargetFlour - sumFlourFromNonMix);
    const mixStepAllocatedWater = Math.max(0, recipeTargets.overallTargetWater - sumWaterFromNonMix);
    const mixStepAllocatedSalt = Math.max(0, recipeTargets.overallTargetSalt - sumSaltFromNonMix);

    // Phase 2, Stage C: Combine all step allocations
    type AllocatedStep = {
      step: RecipeStep;
      template: PopulatedStepTemplate;
      isPreferment: boolean;
      isMix: boolean;
      prefermentParams?: { contrib: number | null, hydr: number | null };
      // These are the TOTAL amounts allocated to this step
      allocatedFlour: number;
      allocatedWater: number;
      allocatedSalt: number;
      // Store explicit flour components from non-MIX steps (preferments already have them)
      // and MIX step's explicit flours for Phase 3 breakdown
      explicitFlourIngredientsForPhase3: FlourComponent[];
    };

    const finalStepAllocations: AllocatedStep[] = [];
    steps.forEach(step => {
      const template = stepTemplates.find(t => t.id === step.stepTemplateId);
      if (!template) return;

      const nonMixData = nonMixStepContributions.find(nmsc => nmsc.step.id === step.id);
      if (template.role === MIX_ROLE) {
        finalStepAllocations.push({
          step, template, isPreferment: false, isMix: true,
          allocatedFlour: mixStepAllocatedFlour,
          allocatedWater: mixStepAllocatedWater,
          allocatedSalt: mixStepAllocatedSalt,
          explicitFlourIngredientsForPhase3: mixStepExplicitFlourComponents,
        });
      } else if (nonMixData) {
        finalStepAllocations.push({
          step, template, 
          isPreferment: nonMixData.isPreferment, 
          isMix: false, 
          prefermentParams: nonMixData.prefermentParams,
          allocatedFlour: nonMixData.contributedFlour,
          allocatedWater: nonMixData.contributedWater,
          allocatedSalt: nonMixData.contributedSalt,
          explicitFlourIngredientsForPhase3: nonMixData.explicitFlourComponents,
        });
      }
    });
    finalStepAllocations.sort((a,b) => a.step.order - b.step.order);
    // --- END OF PHASE 2 ---

    // --- PHASE 3: Detail Ingredient Breakdown Within Each Step & Final Formatting ---
    let columns: CalculatedStepColumn[] = finalStepAllocations.map(allocatedStep => {
      let specificFlourWeightInStep = 0;
      const flourComponents: FlourComponent[] = [];

      // Use explicit flour ingredients if they were pre-calculated (e.g. for MIX step)
      // or calculate them now based on allocatedFlour for other steps.
      // For preferments, explicitFlourIngredientsForPhase3 already contains its specific flours.
      // For Autolyse/Other, explicitFlourIngredientsForPhase3 contains flours calculated against contextual targets.
      // For MIX, explicitFlourIngredientsForPhase3 contains flours calculated against overallTargetFlour.
      // The goal now is to ensure these specific flours fit within the step's *final* allocatedFlour
      // and determine the generic portion.

      if (allocatedStep.isPreferment) {
        // Preferment's explicitFlourIngredientsForPhase3 are already its specific flours.
        // Its allocatedFlour already accounts for specific + generic.
        allocatedStep.explicitFlourIngredientsForPhase3.forEach(fc => flourComponents.push(fc));
        specificFlourWeightInStep = flourComponents.reduce((sum, fc) => sum + fc.weight, 0);
      } else {
         // For Autolyse, MIX, and other steps, their `explicitFlourIngredientsForPhase3`
         // were calculated based on various targets in Phase 2.
         // Now, we ensure they are scaled or fit within the `allocatedStep.allocatedFlour`.
         // This part needs careful thought: if explicit flours were defined as % of overall,
         // but the step's final allocatedFlour is less, how to reconcile?
         // For now, assume explicitFlourIngredientsForPhase3 are the intended specific flours,
         // and genericFlour is the remainder of allocatedFlour.
         allocatedStep.explicitFlourIngredientsForPhase3.forEach(fc => {
            // This logic might need refinement if explicit flours can exceed allocatedFlour
            flourComponents.push(fc); 
            specificFlourWeightInStep += fc.weight;
         });
         // If specific flours (calculated based on broader targets) exceed the step's final allocation,
         // this implies an issue in recipe definition or earlier calculation.
         // We'll cap specificFlourWeightInStep at allocatedFlour.
         specificFlourWeightInStep = Math.min(specificFlourWeightInStep, allocatedStep.allocatedFlour);
         // Potentially rescale flourComponents if specificFlourWeightInStep was capped. (Skipping for now for simplicity)
      }

      const genericFlourWeight = Math.max(0, allocatedStep.allocatedFlour - specificFlourWeightInStep);
      
      // Clamp all to zero if negative
      const totalFlourInCol = Math.max(0, specificFlourWeightInStep + genericFlourWeight);
      const stepWater = Math.max(0, allocatedStep.allocatedWater);
      const stepSalt = Math.max(0, allocatedStep.allocatedSalt);
      const stepTotalWeight = totalFlourInCol + stepWater + stepSalt;

      return {
        stepId: allocatedStep.step.id,
        name: allocatedStep.template.name,
        isPreferment: allocatedStep.isPreferment,
        prefermentContributionPct: allocatedStep.prefermentParams?.contrib,
        prefermentHydrationPct: allocatedStep.prefermentParams?.hydr,
        flourComponents: flourComponents.map(fc => ({...fc, weight: parseFloat(fc.weight.toFixed(2))})),
        genericFlourWeight: parseFloat(genericFlourWeight.toFixed(2)),
        waterWeight: parseFloat(stepWater.toFixed(2)),
        saltWeight: parseFloat(stepSalt.toFixed(2)),
        totalWeight: parseFloat(stepTotalWeight.toFixed(2)),
        percentageOfTotal: 0, // Initialize, will calculate later
        order: allocatedStep.step.order,
      };
    }).sort((a, b) => a.order - b.order);

    // After calculating all columns and before returning:
    let currentGrandTotal = columns.reduce((sum, col) => sum + col.totalWeight, 0);
    const roundingError = recipe.totalWeight - currentGrandTotal;

    if (Math.abs(roundingError) > 0.001) { // Using a smaller threshold for adjustment
      const mixColIndex = columns.findIndex(col => stepTemplates.find(t => t.id === col.stepId)?.role === MIX_ROLE);
      if (mixColIndex !== -1) {
        const mixCol = columns[mixColIndex];
        // Preferentially add to water, then generic flour, then salt as a last resort
        if (mixCol.waterWeight + roundingError >= 0) { // Check if adding error makes it negative
          mixCol.waterWeight = parseFloat(Math.max(0, mixCol.waterWeight + roundingError).toFixed(2));
        } else if (mixCol.genericFlourWeight + roundingError >= 0) {
          mixCol.genericFlourWeight = parseFloat(Math.max(0, mixCol.genericFlourWeight + roundingError).toFixed(2));
        } // Salt adjustment could be added here if necessary
        mixCol.totalWeight = parseFloat((mixCol.flourComponents.reduce((sum, fc) => sum + fc.weight, 0) + mixCol.genericFlourWeight + mixCol.waterWeight + mixCol.saltWeight).toFixed(2));
        currentGrandTotal = columns.reduce((sum, col) => sum + col.totalWeight, 0); // Recalculate grandTotal
      }
    }

    // After all weight adjustments, calculate percentage of total for each column
    if (recipe.totalWeight > 0) {
      columns = columns.map(col => ({
        ...col,
        percentageOfTotal: parseFloat(((col.totalWeight / recipe.totalWeight!) * 100).toFixed(2))
      }));
    }

    return {
      columns,
      totals: {
        totalFlour: parseFloat(columns.reduce((sum, col) => sum + col.flourComponents.reduce((s, fc) => s + fc.weight, 0) + col.genericFlourWeight, 0).toFixed(2)),
        flourDetails: columns.reduce((acc, col) => {
          col.flourComponents.forEach(fc => {
            const existing = acc.find(afd => afd.ingredientId === fc.ingredientId);
            if (existing) {
              existing.totalWeight += fc.weight;
            } else {
              acc.push({ ingredientId: fc.ingredientId, name: fc.name, totalWeight: fc.weight });
            }
          });
          return acc;
        }, [] as Array<{ ingredientId: number; name: string; totalWeight: number }>)
        .map(fd => ({ ...fd, totalWeight: parseFloat(fd.totalWeight.toFixed(2)) }))
        .sort((a,b) => a.name.localeCompare(b.name)),
        water: parseFloat(columns.reduce((sum, col) => sum + col.waterWeight, 0).toFixed(2)),
        salt: parseFloat(columns.reduce((sum, col) => sum + col.saltWeight, 0).toFixed(2)),
        grandTotal: parseFloat(currentGrandTotal.toFixed(2)),
      },
      targetTotalDoughWeight: recipe.totalWeight,
    };
    // --- END OF PHASE 3 ---
  }, [recipe, steps, ingredientsMeta, ingredientCategoriesMeta, fieldsMeta, stepTemplates]); // Updated dependencies
}