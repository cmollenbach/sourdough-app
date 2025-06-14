import { useFormContext, Controller } from "react-hook-form";
import type { Control, FieldArrayWithId, Path, UseFormSetValue } from "react-hook-form";
import type { StepTemplateIngredientRuleMeta, IngredientMeta } from "../../types/recipeLayout";
import type { RecipeStepIngredient } from "../../types/recipe";
// import { enforceFlourPercentage } from "../../utils/flourPercentage"; // We'll inline this logic for clarity
import { IngredientCalculationMode } from "../../types/recipe";

interface StepIngredientTableProps {
  ingredientRules: StepTemplateIngredientRuleMeta[];
  ingredientsMeta: IngredientMeta[];
  ingredientFields: FieldArrayWithId<{
    templateId: number;
    fields: Record<number, string | number>;
    ingredients: RecipeStepIngredient[];
  }, "ingredients", "id">[];
  append: (value: RecipeStepIngredient) => void;
  remove: (index: number) => void;
  control: Control<{
    templateId: number;
    fields: Record<number, string | number>;
    ingredients: RecipeStepIngredient[];
  }>;
  setValue: UseFormSetValue<{
    templateId: number;
    fields: Record<number, string | number>;
    ingredients: RecipeStepIngredient[]; // Ensure this matches the form values type
  }>;
  flourCategoryName: string;
  recipeStepId: number;
  onFocusNotesRequested?: () => void; // New prop to request focus on notes
}


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
  const { getValues: getStepCardFormValues } = useFormContext<{ templateId: number; fields: Record<number, string | number>; ingredients: RecipeStepIngredient[]; }>();

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
        return (
          <div key={rule.ingredientCategory.id} className="mb-2 flex flex-col">
            <label className="font-semibold mb-1">
              {rule.ingredientCategory.name}
              {rule.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {categoryIngredientFields.map((ingredientFieldData) => {
              const currentCalcMode = ingredientFieldData.calculationMode;

              // Determine if this amount input should be disabled
              let inputDisabled = false;
              if (isFlourCategoryRule && currentCalcMode === IngredientCalculationMode.PERCENTAGE) {
                const percentageBasedFloursInRule = categoryIngredientFields.filter(
                  ingField => ingField.ingredientCategoryId === rule.ingredientCategory.id &&
                              ingField.calculationMode === IngredientCalculationMode.PERCENTAGE
                );
                if (percentageBasedFloursInRule.length > 1) {
                  const lastPercentageFlourInRule = percentageBasedFloursInRule[percentageBasedFloursInRule.length - 1];
                  if (lastPercentageFlourInRule.idx === ingredientFieldData.idx) {
                    inputDisabled = true;
                  }
                }
              }

              return (
                <div
                  key={ingredientFieldData.id ?? ingredientFieldData.idx}
                  className="ingredient-row flex flex-col md:flex-row md:items-center gap-2 mt-1 md:self-center w-full"
                >
                  {/* Register ingredientCategoryId so it's tracked */}
                  <Controller
                    name={`ingredients.${ingredientFieldData.idx}.ingredientCategoryId` as Path<{ templateId: number; fields: Record<number, string | number>; ingredients: RecipeStepIngredient[]; }>}
                    control={control}
                    render={({ field }) => (
                      // This hidden input doesn't need responsive width adjustments
                      <input type="hidden" {...field} value={rule.ingredientCategory.id} />
                    )}
                  />
                  <Controller
                    name={`ingredients.${ingredientFieldData.idx}.ingredientId` as Path<{ templateId: number; fields: Record<number, string | number>; ingredients: RecipeStepIngredient[]; }>}
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

                              setValue(`ingredients.${ingredientFieldData.idx}.calculationMode`, newMode);
                              setValue(`ingredients.${ingredientFieldData.idx}.amount`, 0);
                            } else {
                              setValue(`ingredients.${ingredientFieldData.idx}.calculationMode`, IngredientCalculationMode.PERCENTAGE);
                              setValue(`ingredients.${ingredientFieldData.idx}.amount`, 0);
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
                    name={`ingredients.${ingredientFieldData.idx}.amount` as Path<{ templateId: number; fields: Record<number, string | number>; ingredients: RecipeStepIngredient[]; }>}
                    control={control}
                    render={({ field }) => {
                      // Wrap input and unit in a flex container for better alignment on mobile when stacked
                      return (
                        <input
                          type="number"
                          value={typeof field.value === "number" || typeof field.value === "string" ? field.value : 0}
                          onChange={e => {
                            // Determine raw value, allowing empty string for clearing
                            let rawValue = Number(e.target.value);
                            const isClearingInput = e.target.value === "";
                            if (!isClearingInput && isNaN(rawValue)) rawValue = 0; // Default to 0 if invalid and not clearing

                            let valueToSet: number | string = isClearingInput ? "" : rawValue;

                            if (!isClearingInput && isFlourCategoryRule && ingredientFieldData.calculationMode === IngredientCalculationMode.PERCENTAGE) {
                              // Enforce that the current input, combined with others in the same main flour category, doesn't exceed 100%
                              const allFormIngredients = getStepCardFormValues("ingredients");
                              let sumOfOtherFlourPercentagesInMainCategory = 0;
                              allFormIngredients.forEach((ing, index) => {
                                if (
                                  index !== ingredientFieldData.idx && // Exclude current field
                                  ing.ingredientCategoryId === flourCategoryId && // Must be in THE main flour category
                                  ing.calculationMode === IngredientCalculationMode.PERCENTAGE
                                ) {
                                  sumOfOtherFlourPercentagesInMainCategory += (Number(ing.amount) || 0);
                                }
                              });

                              const maxAllowedForCurrentToKeepSum100 = Math.max(0, 100 - sumOfOtherFlourPercentagesInMainCategory);
                              const individuallyClampedRawValue = Math.min(100, Math.max(0, rawValue)); // Clamp 0-100
                              valueToSet = Math.min(individuallyClampedRawValue, maxAllowedForCurrentToKeepSum100);

                            } else if (isFlourCategoryRule && ingredientFieldData.calculationMode === IngredientCalculationMode.PERCENTAGE) {
                              // This case is now covered above. If not clearing, it's a number.
                            } else if (!isClearingInput) {
                              // Default clamping for non-flour-percentage numbers
                              valueToSet = Math.max(0, Math.min(10000, rawValue)); // General clamp for grams etc.
                            }

                            field.onChange(valueToSet); // Let RHF handle the update

                            // After updating the current field, if it was a flour percentage,
                            // adjust the 'last' (disabled) flour percentage input in the same category rule.
                            if (isFlourCategoryRule && ingredientFieldData.calculationMode === IngredientCalculationMode.PERCENTAGE) {
                              const latestAllIngredientsAfterChange = getStepCardFormValues("ingredients");
                              const percentageFloursInThisRule = categoryIngredientFields.filter(
                                f => f.calculationMode === IngredientCalculationMode.PERCENTAGE
                              );

                              if (percentageFloursInThisRule.length > 1) {
                                const lastFlourFieldInRule = percentageFloursInThisRule[percentageFloursInThisRule.length - 1];
                                let sumOfAllExceptLastInRule = 0;
                                percentageFloursInThisRule.forEach(f => {
                                  if (f.idx !== lastFlourFieldInRule.idx) { // Sum all *except* the last one
                                    sumOfAllExceptLastInRule += (Number(latestAllIngredientsAfterChange[f.idx]?.amount) || 0);
                                  }
                                });
                                const amountForLastFlour = Math.max(0, 100 - sumOfAllExceptLastInRule);
                                setValue(`ingredients.${lastFlourFieldInRule.idx}.amount`, Math.min(100, amountForLastFlour), {
                                  shouldValidate: true, shouldDirty: true,
                                });
                              }
                            }
                          }}
                          className={`border border-border rounded px-2 py-1 w-full md:w-24 text-center bg-surface text-text-primary focus:border-primary-300 focus:ring-1 focus:ring-primary-100 transition-colors ${inputDisabled ? 'bg-secondary-50 text-text-tertiary cursor-not-allowed dark:bg-secondary-900' : ''}`}
                          placeholder={currentCalcMode === IngredientCalculationMode.PERCENTAGE ? "Percentage" : "Grams"}
                          disabled={inputDisabled}
                        />
                      );
                    }}
                  />
                  <span className="w-full md:w-auto text-left md:text-center"> {/* Unit alignment */}
                    {currentCalcMode === IngredientCalculationMode.PERCENTAGE ? '%' : 'g'}
                  </span>
                  <div className="w-full md:w-auto"> {/* Wrapper for button for full width on mobile */}
                    <button
                      type="button"
                      onClick={() => remove(ingredientFieldData.idx)}
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
