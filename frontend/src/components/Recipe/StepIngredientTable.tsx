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
}

export function StepIngredientTable({
  ingredientRules,
  ingredientsMeta,
  ingredientFields,
  append,
  remove,
  control,
}: StepIngredientTableProps) {
  return (
    <div className="flex flex-col gap-6">
      {ingredientRules.map((rule) => {
        const categoryIngredients = ingredientsMeta.filter(
          (meta) => meta.ingredientCategoryId === rule.ingredientCategory.id
        );
        const categoryIngredientFields = ingredientFields.filter(
          (field) => (field.ingredientCategoryId as number) === rule.ingredientCategory.id
        );
        return (
          <div key={rule.ingredientCategory.id} className="mb-2">
            <label className="font-semibold">
              {rule.ingredientCategory.name}
              {rule.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {categoryIngredientFields.map((ingredient) => {
              const fieldIdx = ingredientFields.findIndex(
                (f) => f.id === ingredient.id
              );
              return (
                <div key={ingredient.id ?? fieldIdx} className="flex items-center gap-2 mt-1">
                  <Controller
                    name={`ingredients.${fieldIdx}.ingredientId` as Path<{
                      templateId: number;
                      fields: Record<number, string | number>;
                      ingredients: RecipeStepIngredient[];
                    }>}
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
                    name={`ingredients.${fieldIdx}.percentage` as Path<{
                      templateId: number;
                      fields: Record<number, string | number>;
                      ingredients: RecipeStepIngredient[];
                    }>}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min={0}
                        className="border rounded px-2 py-1 w-24"
                        placeholder="Percentage"
                        value={typeof field.value === "number" ? field.value : 0}
                        onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      />
                    )}
                  />
                  <span>%</span>
                  <button
                    type="button"
                    onClick={() => remove(fieldIdx)}
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
                  ingredientId: 0,
                  percentage: 0,
                  ingredientCategoryId: rule.ingredientCategory.id,
                  id: Math.random(),
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