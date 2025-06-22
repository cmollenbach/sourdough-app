import React from 'react'; // Added React import for JSX
/* Controller and Path were unused after refactoring to StepIngredientRow */
import type { Control, FieldArrayWithId, UseFormSetValue } from "react-hook-form";
import type { StepTemplateIngredientRuleMeta, IngredientMeta } from "../../types/recipeLayout";
import type { RecipeStepIngredient, IngredientCategory } from "../../types/recipe";
// import { enforceFlourPercentage } from "../../utils/flourPercentage"; // We'll inline this logic for clarity
import { StepIngredientRow } from "./StepIngredientRow"; // Import the new component
import { IngredientCalculationMode } from "../../types/recipe";
import type { StepFormValues } from "./StepCard"; // Import the shared type

// Type for elements in categoryIngredientFields (after mapping idx from RHF's useFieldArray)
type MappedCategoryIngredientField = FieldArrayWithId<StepFormValues, "ingredients", "id"> & { idx: number };

interface StepIngredientTableProps {
  ingredientRules: StepTemplateIngredientRuleMeta[];
  ingredientsMeta: IngredientMeta[];
  ingredientCategoriesMeta: IngredientCategory[]; // Added
  ingredientFields: FieldArrayWithId<StepFormValues, "ingredients", "id">[];
  append: (value: RecipeStepIngredient) => void;
  remove: (index: number) => void;
  control: Control<StepFormValues>;
  setValue: UseFormSetValue<StepFormValues>;
  flourCategoryName: string;
  recipeStepId: number;
  onFocusNotesRequested?: () => void; // New prop to request focus on notes
}
export function StepIngredientTable({ ingredientRules, ingredientsMeta, ingredientCategoriesMeta, ingredientFields, append, remove, control, setValue, flourCategoryName, recipeStepId, onFocusNotesRequested, }: StepIngredientTableProps) {
  // const INCLUSIONS_CATEGORY_NAME = "Inclusions"; // This was unused after refactoring logic to StepIngredientRow
  // const { getValues: getStepCardFormValues } = useFormContext<StepFormValues>(); // Removed as it's not used


  return (
    <div className="flex flex-col gap-6">
      {ingredientRules.map((rule) => {
        const isFlourCategoryRule = rule.ingredientCategory.name === flourCategoryName;

        const categoryIngredients = ingredientsMeta.filter(
          (meta) => meta.ingredientCategoryId === rule.ingredientCategory.id
        );
        const categoryIngredientFields = ingredientFields
          .map((field, idx) => ({ ...field, idx }))
          .filter(
            (field) => (field.ingredientCategoryId as number) === rule.ingredientCategory.id
          );

        // Calculate sum of percentages for the current flour rule
        let currentRuleFlourPercentageSum = 0;
        let hasPercentageFlourInRule = false;
        if (isFlourCategoryRule) {
          categoryIngredientFields.forEach(field => { // Corrected: Iterate over categoryIngredientFields
            if (field.calculationMode === IngredientCalculationMode.PERCENTAGE) {
              currentRuleFlourPercentageSum += (Number(field.amount) || 0);
              hasPercentageFlourInRule = true;
            }
          });
        }

        return (
          <div key={rule.ingredientCategory.id} className="mb-2 flex flex-col">
            <label className="font-semibold mb-1">
              {rule.ingredientCategory.name}
              {rule.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {categoryIngredientFields.map((ingredientFieldData: MappedCategoryIngredientField) => { // Added type for ingredientFieldData
              return (
                <StepIngredientRow
                  key={ingredientFieldData.id ?? ingredientFieldData.idx}
                  ingredientFieldData={ingredientFieldData}
                  categoryIngredients={categoryIngredients}
                  ingredientsMeta={ingredientsMeta}
                  ingredientCategoriesMeta={ingredientCategoriesMeta} // Pass down
                  isFlourCategoryRule={isFlourCategoryRule}
                  remove={remove}
                  control={control}
                  setValue={setValue}
                  // recipeStepId={recipeStepId} // recipeStepId is not a prop of StepIngredientRow
                  onFocusNotesRequested={onFocusNotesRequested}
                />
              );
            })}
            {/* Show a warning if the sum of flour percentages in this rule is not 100 */}
            {isFlourCategoryRule && hasPercentageFlourInRule && Math.abs(currentRuleFlourPercentageSum - 100) > 0.01 && ( // Check if sum is not 100
              <div className="text-red-500 text-sm mt-2">
                Warning: Flour percentages in this section should sum to 100%. Current sum: {currentRuleFlourPercentageSum.toFixed(1)}%
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                append({
                  id: 0,
                  ingredientId: 0,
                  amount: 0,
                  ingredientCategoryId: rule.ingredientCategory.id,
                  calculationMode: IngredientCalculationMode.PERCENTAGE,
                  recipeStepId: recipeStepId,
                })
              }
              className="btn-primary"
            >
              + Add {rule.ingredientCategory.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}
