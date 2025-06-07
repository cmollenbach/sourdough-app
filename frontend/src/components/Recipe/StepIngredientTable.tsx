import { Controller } from "react-hook-form";
import type { Control, FieldArrayWithId, Path, UseFormSetValue } from "react-hook-form";
import type { StepTemplateIngredientRuleMeta, IngredientMeta } from "../../types/recipeLayout";
import type { RecipeStepIngredient } from "../../types/recipe";
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
    // Define the full form shape for better type safety with setValue
    templateId: number;
    fields: Record<number, string | number>;
    ingredients: RecipeStepIngredient[];
  }>;
  setValue: UseFormSetValue<{
    templateId: number;
    fields: Record<number, string | number>;
    ingredients: RecipeStepIngredient[];
  }>;
  flourCategoryName: string; // To identify the flour category
  recipeStepId: number; // ID of the current step
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
}: StepIngredientTableProps) {
  const INCLUSIONS_CATEGORY_NAME = "Inclusions"; // Define category name for fixed weights

  return (
    <div className="flex flex-col gap-6">
      {ingredientRules.map((rule) => {
        const isFlourCategoryRule = rule.ingredientCategory.name === flourCategoryName;
        // const flourIngredientsInThisCategory = ingredientFields.filter(field => field.ingredientCategoryId === rule.ingredientCategory.id);

        const categoryIngredients = ingredientsMeta.filter(
          (meta) => meta.ingredientCategoryId === rule.ingredientCategory.id
        );
        const categoryIngredientFields = ingredientFields
          .map((field, idx) => ({ ...field, idx }))
          .filter(
            (field) => (field.ingredientCategoryId as number) === rule.ingredientCategory.id
          );
        return (
          <div key={rule.ingredientCategory.id} className="mb-2 flex flex-col"> {/* Make this a flex column */}
            <label className="font-semibold mb-1"> {/* Ensure label has some bottom margin */}
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
                <div key={ingredientFieldData.id ?? ingredientFieldData.idx} className="flex items-center gap-2 mt-1 self-center"> {/* Center the ingredient row */}
                  {/* Register ingredientCategoryId so it's tracked */}
                  <Controller
                    name={`ingredients.${ingredientFieldData.idx}.ingredientCategoryId` as Path<{ templateId: number; fields: Record<number, string | number>; ingredients: RecipeStepIngredient[]; }>}
                    control={control}
                    render={({ field }) => (
                      <input type="hidden" {...field} value={rule.ingredientCategory.id} />
                    )}
                  />
                  <Controller
                    name={`ingredients.${ingredientFieldData.idx}.ingredientId` as Path<{ templateId: number; fields: Record<number, string | number>; ingredients: RecipeStepIngredient[]; }>}
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        value={typeof field.value === "number" ? field.value : 0}
                        onChange={e => {
                          const selectedIngredientId = Number(e.target.value);
                          field.onChange(selectedIngredientId); // Update ingredientId

                          if (selectedIngredientId > 0) {
                            // The category of the selected ingredient is known from the current 'rule'
                            const isSelectedIngredientInInclusionsCategory = rule.ingredientCategory.name === INCLUSIONS_CATEGORY_NAME;
                            
                            const newMode = isSelectedIngredientInInclusionsCategory
                              ? IngredientCalculationMode.FIXED_WEIGHT
                              : IngredientCalculationMode.PERCENTAGE;
                            
                            setValue(`ingredients.${ingredientFieldData.idx}.calculationMode`, newMode);
                            setValue(`ingredients.${ingredientFieldData.idx}.amount`, 0); // Reset amount
                          } else {
                            // Ingredient deselected or "request new"
                            // Default to PERCENTAGE and reset amount.
                            // The append function already defaults to PERCENTAGE, so this handles changes.
                            setValue(`ingredients.${ingredientFieldData.idx}.calculationMode`, IngredientCalculationMode.PERCENTAGE);
                            setValue(`ingredients.${ingredientFieldData.idx}.amount`, 0);
                          }
                        }}
                        className="border rounded px-2 py-1 min-w-[120px]"
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
                    )}
                  />
                  <Controller
                    name={`ingredients.${ingredientFieldData.idx}.amount` as Path<{ templateId: number; fields: Record<number, string | number>; ingredients: RecipeStepIngredient[]; }>}
                    control={control}
                    render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min={0}
                      max={currentCalcMode === IngredientCalculationMode.PERCENTAGE ? 100 : undefined}
                      className={`border rounded px-2 py-1 w-24 text-center ${inputDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder={currentCalcMode === IngredientCalculationMode.PERCENTAGE ? "Percentage" : "Grams"}
                      value={typeof field.value === "number" ? field.value : 0}
                      onChange={e => {
                        let val = 0;
                        if (e.target.value !== "") {
                          val = Number(e.target.value);
                          // Client-side clamping for immediate UX
                          if (val < 0) val = 0;
                          if (currentCalcMode === IngredientCalculationMode.PERCENTAGE && val > 100) {
                            val = 100;
                          }
                        }
                        field.onChange(val);
                      }}
                      disabled={inputDisabled}
                    />
                    )}
                  />
                  <span>
                    {currentCalcMode === IngredientCalculationMode.PERCENTAGE ? '%' : 'g'}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(ingredientFieldData.idx)}
                    aria-label="Remove ingredient"
                    className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() =>
                append({
                  id: 0,
                  ingredientId: 0,
                  amount: 0, // Changed from percentage
                  ingredientCategoryId: rule.ingredientCategory.id,
                  calculationMode: IngredientCalculationMode.PERCENTAGE, // Default for a new ingredient row
                  recipeStepId: recipeStepId, // Add the recipeStepId here
                })
              }
              className="mt-2 px-3 py-1 bg-blue-100 rounded text-blue-700 self-center" // Center the "Add" button
            >
              + Add {rule.ingredientCategory.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}