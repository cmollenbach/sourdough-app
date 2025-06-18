import { useFormContext, Controller } from "react-hook-form";
import type { Control, FieldArrayWithId, Path, UseFormSetValue } from "react-hook-form";
import type { StepTemplateIngredientRuleMeta, IngredientMeta } from "../../types/recipeLayout";
import type { RecipeStepIngredient } from "../../types/recipe";
// import { enforceFlourPercentage } from "../../utils/flourPercentage"; // We'll inline this logic for clarity
import { IngredientCalculationMode } from "../../types/recipe";
import type { StepFormValues } from "./StepCard"; // Import the shared type

// Type for elements in categoryIngredientFields (after mapping idx from RHF's useFieldArray)
type MappedCategoryIngredientField = FieldArrayWithId<StepFormValues, "ingredients", "id"> & { idx: number };

interface StepIngredientTableProps {
  ingredientRules: StepTemplateIngredientRuleMeta[];
  ingredientsMeta: IngredientMeta[];
  ingredientFields: FieldArrayWithId<StepFormValues, "ingredients", "id">[];
  append: (value: RecipeStepIngredient) => void;
  remove: (index: number) => void;
  control: Control<StepFormValues>;
  setValue: UseFormSetValue<StepFormValues>;
  flourCategoryName: string;
  recipeStepId: number;
  onFocusNotesRequested?: () => void; // New prop to request focus on notes
}

// Helper to find the first percentage-based flour in a rule by its original form array index
const findFirstPercentageFlourInRule = (
  percentageBasedFloursInRule: MappedCategoryIngredientField[]
): MappedCategoryIngredientField | undefined => {
  if (!percentageBasedFloursInRule || percentageBasedFloursInRule.length === 0) {
    return undefined;
  }
  // The `idx` is the original index from the main `ingredientFields` array.
  // We need the one with the smallest `idx`.
  return percentageBasedFloursInRule.reduce((first, current) => (current.idx < first.idx ? current : first));
};

export function StepIngredientTable({
  ingredientRules,
  ingredientsMeta,
  ingredientFields,
  append,
  remove,
  control,
  setValue,
  flourCategoryName,
  recipeStepId,
  onFocusNotesRequested,
}: StepIngredientTableProps) {
  const INCLUSIONS_CATEGORY_NAME = "Inclusions";
  const { getValues: getStepCardFormValues } = useFormContext<StepFormValues>();

  const flourCategoryId =
    ingredientsMeta.find(meta => meta.name === flourCategoryName)?.ingredientCategoryId ?? 0;

  // Compute sum of all flour percentages in this table
  const flourPercentageSum = ingredientFields
    .filter(field =>
      field.ingredientCategoryId === flourCategoryId &&
      field.calculationMode === IngredientCalculationMode.PERCENTAGE
    )
    .reduce((sum, field) => sum + (typeof field.amount === "number" ? field.amount : 0), 0);

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
        return ( // Added type assertion for categoryIngredientFields
          <div key={rule.ingredientCategory.id} className="mb-2 flex flex-col">
            <label className="font-semibold mb-1">
              {rule.ingredientCategory.name}
              {rule.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {categoryIngredientFields.map((ingredientFieldData) => {
              const currentCalcMode = ingredientFieldData.calculationMode;
              const typedIngredientFieldData = ingredientFieldData as MappedCategoryIngredientField; // Use typed version
              // Determine if this amount input should be disabled
              let inputDisabled = false;
              if (isFlourCategoryRule && currentCalcMode === IngredientCalculationMode.PERCENTAGE) {
                // Filter for flours in this specific rule that are percentage-based
                const percentageBasedFloursInRule = categoryIngredientFields.filter(
                  ingField => ingField.calculationMode === IngredientCalculationMode.PERCENTAGE
                ) as MappedCategoryIngredientField[];

                const firstFlourInRule = findFirstPercentageFlourInRule(percentageBasedFloursInRule);
                if (firstFlourInRule && typedIngredientFieldData.idx === firstFlourInRule.idx) {
                    inputDisabled = true;
                  }
              }

              return (
                <div
                  key={typedIngredientFieldData.id ?? typedIngredientFieldData.idx}
                  className="ingredient-row flex flex-col items-start md:flex-row md:items-center gap-2 sm:gap-4 mt-1 md:self-center w-full"
                >
                  {/* Register ingredientCategoryId so it's tracked */}
                  <Controller
                    name={`ingredients.${typedIngredientFieldData.idx}.ingredientCategoryId` as Path<StepFormValues>}
                    control={control}
                    render={({ field }) => (
                      // This hidden input doesn't need responsive width adjustments
                      <input type="hidden" {...field} value={rule.ingredientCategory.id} />
                    )}
                  />
                  <Controller
                    name={`ingredients.${typedIngredientFieldData.idx}.ingredientId` as Path<StepFormValues>}
                    control={control}
                    render={({ field }) => (
                      <div className="w-full md:min-w-[150px] md:w-auto"> {/* Full width on mobile, auto/min on desktop */}
                        <select
                          {...field}
                          value={typeof field.value === "number" ? field.value : 0}
                          onChange={e => {
                            const selectedIngredientId = Number(e.target.value);
                            field.onChange(selectedIngredientId);

                            if (selectedIngredientId > 0) {
                              const isSelectedIngredientInInclusionsCategory = rule.ingredientCategory.name === INCLUSIONS_CATEGORY_NAME;
                              const newMode = isSelectedIngredientInInclusionsCategory
                                ? IngredientCalculationMode.FIXED_WEIGHT
                                : IngredientCalculationMode.PERCENTAGE;

                              setValue(`ingredients.${typedIngredientFieldData.idx}.calculationMode`, newMode);
                              setValue(`ingredients.${typedIngredientFieldData.idx}.amount`, 0);
                            } else {
                              setValue(`ingredients.${typedIngredientFieldData.idx}.calculationMode`, IngredientCalculationMode.PERCENTAGE);
                              setValue(`ingredients.${typedIngredientFieldData.idx}.amount`, 0);
                            }

                            // Check if "Other" ingredient was selected and request notes focus
                            const selectedMeta = ingredientsMeta.find(meta => meta.id === selectedIngredientId);
                            if (selectedMeta && selectedMeta.name.toLowerCase().includes('other (see note)') && onFocusNotesRequested) {
                              onFocusNotesRequested();
                            }
                          }}
                          className="w-full border border-border rounded px-2 py-1 bg-surface text-text-primary focus:border-primary-300 focus:ring-1 focus:ring-primary-100"
                        >
                          <option value={0}>Select ingredient</option>
                          {categoryIngredients.length === 0 && (
                            <option disabled>No ingredients available</option>
                          )}
                          {categoryIngredients.map(meta => (
                            <option key={meta.id} value={meta.id}>{meta.name}</option>
                          ))}
                          <option value={-1}>[+ Request new ingredient]</option>
                        </select>
                      </div>
                    )}
                  />
                  <Controller
                    name={`ingredients.${typedIngredientFieldData.idx}.amount` as Path<StepFormValues>}
                    control={control}
                    render={({ field }) => {
                      // Helper function to process new amount value (string from input or buttons)
                      const processNewAmountValue = (newValueString: string): number | string => {
                        let rawValue = Number(newValueString);
                        const isClearingInput = newValueString === "";
                        if (!isClearingInput && isNaN(rawValue)) rawValue = 0; // Default to 0 if invalid and not clearing

                        let valueToSet: number | string;

                        if (isClearingInput) {
                          valueToSet = "";
                        } else {
                          // Input is not being cleared, so it's a number (or will be treated as 0 if NaN)
                          if (isFlourCategoryRule && typedIngredientFieldData.calculationMode === IngredientCalculationMode.PERCENTAGE) {
                            // Enforce that the current input, combined with others in the same main flour category, doesn't exceed 100%
                            const allFormIngredients = getStepCardFormValues("ingredients");
                            let sumOfOtherFlourPercentagesInMainCategory = 0;
                            allFormIngredients.forEach((ing, index) => {
                              if (
                                index !== typedIngredientFieldData.idx && // Exclude current field
                                ing.ingredientCategoryId === flourCategoryId && // Must be in THE main flour category
                                ing.calculationMode === IngredientCalculationMode.PERCENTAGE
                              ) {
                                sumOfOtherFlourPercentagesInMainCategory += (Number(ing.amount) || 0);
                              }
                            });

                            const maxAllowedForCurrentToKeepSum100 = Math.max(0, 100 - sumOfOtherFlourPercentagesInMainCategory);
                            const individuallyClampedRawValue = Math.min(100, Math.max(0, rawValue)); // Clamp 0-100
                            valueToSet = Math.min(individuallyClampedRawValue, maxAllowedForCurrentToKeepSum100);
                          } else {
                            // Default clamping for non-flour-percentage numbers or non-percentage flours
                            valueToSet = Math.max(0, Math.min(10000, rawValue)); // General clamp for grams etc.
                          }
                        }
                        return valueToSet;
                      };

                      // Helper function to trigger updates for dependent fields (e.g., last flour item)
                      // Now targets the *first* flour item in the rule for auto-balancing.
                      const triggerDependentUpdates = (currentFieldIndex: number) => {
                        setTimeout(() => { // Ensure setTimeout is used here
                          if (isFlourCategoryRule && typedIngredientFieldData.calculationMode === IngredientCalculationMode.PERCENTAGE) {
                            const latestAllIngredientsAfterChange = getStepCardFormValues("ingredients");
                            // Get all percentage-based flours within the current rule
                            const percentageFloursInThisRule = categoryIngredientFields.filter(
                              f => f.calculationMode === IngredientCalculationMode.PERCENTAGE
                            ) as MappedCategoryIngredientField[]; // Cast for helper

                            const firstFlourFieldInRule = findFirstPercentageFlourInRule(percentageFloursInThisRule);

                            if (firstFlourFieldInRule && firstFlourFieldInRule.idx !== currentFieldIndex) { // Compare with currentFieldIndex
                              let sumOfAllExceptFirstInRule = 0;
                              percentageFloursInThisRule.forEach(f => {
                                // Sum amounts of all *other* percentage flours in this rule
                                if (f.idx !== firstFlourFieldInRule.idx) {
                                  sumOfAllExceptFirstInRule += (Number(latestAllIngredientsAfterChange[f.idx]?.amount) || 0);
                                }
                              });
                              const amountForFirstFlour = Math.max(0, 100 - sumOfAllExceptFirstInRule);
                              setValue(`ingredients.${firstFlourFieldInRule.idx}.amount`, Math.min(100, amountForFirstFlour), {
                                shouldValidate: true, shouldDirty: true,
                              });
                            }
                          }
                        }, 0);
                      };

                      const handleDirectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const valueToSet = processNewAmountValue(e.target.value);
                        field.onChange(valueToSet); // Update current field immediately
                        triggerDependentUpdates(typedIngredientFieldData.idx); 
                      };
                      const getStepValue = () => {
                        const numValue = Number(field.value) || 0;
                        if (currentCalcMode === IngredientCalculationMode.PERCENTAGE) {
                          return (numValue < 10 && numValue > 0 && numValue % 1 !== 0) ? 0.1 : 1; // Finer steps for small percentages
                        }
                        return 1; // Default step for grams
                      };
                      const handleIncrement = () => {
                        const currentValue = Number(field.value) || 0;
                        const step = getStepValue();
                        const newValueString = String(currentValue + step);
                        const valueToSet = processNewAmountValue(newValueString);
                        field.onChange(valueToSet); // Update current field immediately
                        triggerDependentUpdates(typedIngredientFieldData.idx);
                      };
                      const handleDecrement = () => {
                        const currentValue = Number(field.value) || 0;
                        const step = getStepValue();
                        const newValueString = String(Math.max(0, currentValue - step));
                        const valueToSet = processNewAmountValue(newValueString);
                        field.onChange(valueToSet); // Update current field immediately
                        triggerDependentUpdates(typedIngredientFieldData.idx);
                      };
                      
                      return (
                        <div className="flex items-center gap-1 w-full md:w-auto">
                          <button
                            type="button"
                            onClick={handleDecrement}
                            disabled={inputDisabled || (Number(field.value) || 0) <= 0}
                            className={`p-2 rounded-md border border-border bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${inputDisabled ? 'cursor-not-allowed' : ''}`}
                            aria-label="Decrease amount"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                          </button>
                          <input
                            {...field} // RHF's field props
                            type="number"
                            inputMode="numeric" // Enhances mobile keyboard
                            step={currentCalcMode === IngredientCalculationMode.PERCENTAGE ? "0.1" : "1"} // Semantic step
                            // Ensure the value is either a number or a string for the input.
                            // If TypeScript infers field.value as a wider type (object/array) or it's undefined/null, default to an empty string.
                            value={(typeof field.value === 'number' || typeof field.value === 'string') ? field.value : ""}
                            onChange={handleDirectInputChange}
                            className={`border border-border rounded px-2 py-1 w-full md:w-20 text-center bg-surface text-text-primary focus:border-primary-300 focus:ring-1 focus:ring-primary-100 transition-colors ${inputDisabled ? 'bg-secondary-50 text-text-tertiary cursor-not-allowed dark:bg-secondary-900' : ''}`}
                            placeholder={currentCalcMode === IngredientCalculationMode.PERCENTAGE ? "%" : "g"}
                            disabled={inputDisabled}
                          />
                          <button
                            type="button"
                            onClick={handleIncrement}
                            disabled={inputDisabled || (currentCalcMode === IngredientCalculationMode.PERCENTAGE && (Number(field.value) || 0) >= 100 && isFlourCategoryRule)}
                            className={`p-2 rounded-md border border-border bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${inputDisabled ? 'cursor-not-allowed' : ''}`}
                            aria-label="Increase amount"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                          </button>
                        </div>
                      );
                    }}
                  />
                  <span className="w-full md:w-auto text-left md:text-center"> {/* Unit alignment */}
                    {currentCalcMode === IngredientCalculationMode.PERCENTAGE ? '%' : 'g'}
                  </span>
                  <div className="w-full md:w-auto"> {/* Wrapper for button for full width on mobile */}
                    <button
                      type="button"
                      onClick={() => remove(typedIngredientFieldData.idx)}
                      aria-label="Remove ingredient"
                      className="btn-danger w-full md:w-auto" // Full width on mobile
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
            {/* Show a warning if the sum of flour percentages in this table exceeds 100 */}
            {isFlourCategoryRule && flourPercentageSum > 100 && (
              <div className="text-red-500 text-sm mt-2">
                Warning: Total flour percentage exceeds 100%!
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
