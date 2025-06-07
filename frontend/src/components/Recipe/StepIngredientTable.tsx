import { Controller } from "react-hook-form";
import type { Control, FieldArrayWithId, Path } from "react-hook-form";
import type { StepTemplateIngredientRuleMeta, IngredientMeta } from "../../types/recipeLayout";
import type { RecipeStepIngredient } from "../../types/recipe";

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
  flourCategoryName,
  recipeStepId,
}: StepIngredientTableProps) {
  return (
    <div className="flex flex-col gap-6">
      {ingredientRules.map((rule) => {
        const isCurrentCategoryFlour = rule.ingredientCategory.name === flourCategoryName;
        const flourIngredientsInThisCategory = ingredientFields.filter(field => field.ingredientCategoryId === rule.ingredientCategory.id);

        const categoryIngredients = ingredientsMeta.filter(
          (meta) => meta.ingredientCategoryId === rule.ingredientCategory.id
        );
        const categoryIngredientFields = ingredientFields
          .map((field, idx) => ({ ...field, idx }))
          .filter(
            (field) => (field.ingredientCategoryId as number) === rule.ingredientCategory.id
          );

        return (
          <div key={rule.ingredientCategory.id} className="mb-2">
            <label className="font-semibold">
              {rule.ingredientCategory.name}
              {rule.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {categoryIngredientFields.map((ingredient, indexInFilteredArray) => {
              // Determine if this percentage input should be disabled
              // It's disabled if it's a flour category AND it's the last flour in that category AND there's more than one flour.
              // If only one flour, it's not "last" in a way that makes it calculated by others, it's just 100%.
              const isLastFlourInList = isCurrentCategoryFlour && flourIngredientsInThisCategory.length > 1 && indexInFilteredArray === flourIngredientsInThisCategory.length - 1;
              const isPercentageDisabled = isLastFlourInList;

              return (
                <div key={ingredient.id ?? ingredient.idx} className="flex items-center gap-2 mt-1">
                  {/* Register ingredientCategoryId so it's tracked */}
                  <Controller
                    name={`ingredients.${ingredient.idx}.ingredientCategoryId` as Path<{ templateId: number; fields: Record<number, string | number>; ingredients: RecipeStepIngredient[]; }>}
                    control={control}
                    render={({ field }) => (
                      <input type="hidden" {...field} value={rule.ingredientCategory.id} />
                    )}
                  />
                  <Controller
                    name={`ingredients.${ingredient.idx}.ingredientId` as Path<{ templateId: number; fields: Record<number, string | number>; ingredients: RecipeStepIngredient[]; }>}
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        value={typeof field.value === "number" ? field.value : 0}
                        onChange={e => field.onChange(Number(e.target.value))}
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
                    name={`ingredients.${ingredient.idx}.percentage` as Path<{ templateId: number; fields: Record<number, string | number>; ingredients: RecipeStepIngredient[]; }>}
                    control={control}
                    render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min={0}
                      max={100} // Basic browser-level constraint
                      className={`border rounded px-2 py-1 w-24 ${isPercentageDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Percentage"
                      value={typeof field.value === "number" ? field.value : 0}
                      onChange={e => {
                        let val = 0;
                        if (e.target.value !== "") {
                          val = Number(e.target.value);
                          // Further client-side clamping for immediate UX, useEffect in StepCard is the authority
                          if (val < 0) val = 0;
                          if (val > 100) val = 100;
                        }
                        field.onChange(val);
                      }}
                      disabled={isPercentageDisabled}
                    />
                    )}
                  />
                  <span>%</span>
                  <button
                    type="button"
                    onClick={() => remove(ingredient.idx)}
                    aria-label="Remove ingredient"
                    className="text-red-500 px-2"
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
                  percentage: 0,
                  ingredientCategoryId: rule.ingredientCategory.id,
                  recipeStepId: recipeStepId, // Add the recipeStepId here
                })
              }
              className="mt-2 px-3 py-1 bg-blue-100 rounded text-blue-700"
            >
              + Add {rule.ingredientCategory.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}