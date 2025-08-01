import React, { useMemo } from 'react'; // Added React import for JSX
/* Controller and Path were unused after refactoring to StepIngredientRow */
import type { Control, FieldArrayWithId, UseFormSetValue, UseFieldArrayUpdate } from "react-hook-form";
import type { StepTemplateIngredientRuleMeta, IngredientMeta } from "../../types/recipeLayout";
import type { RecipeStepIngredient, IngredientCategory } from "../../types/recipe";
// import { enforceFlourPercentage } from "../../utils/flourPercentage"; // We'll inline this logic for clarity
import { StepIngredientRow } from "./StepIngredientRow"; // Import the new component
import { IngredientCalculationMode } from "../../types/recipe";
import type { StepFormValues } from "./StepCard"; // Import the shared type

// Type for elements in categoryIngredientFields (after mapping idx from RHF's useFieldArray)
type MappedCategoryIngredientField = FieldArrayWithId<StepFormValues, "ingredients", "rhfId"> & { idx: number };

interface StepIngredientTableProps {
  control: Control<StepFormValues>;
  setValue: UseFormSetValue<StepFormValues>;
  ingredientsMeta: IngredientMeta[];
  ingredientCategoriesMeta: IngredientCategory[];
  onFocusNotesRequested?: () => void;
  recipeStepId: number; // Add this prop
  flourCategoryName: string;
  // Add props to receive from useFieldArray in parent
  ingredientFields: FieldArrayWithId<StepFormValues, "ingredients", "rhfId">[];
  append: (newIngredientData: Partial<RecipeStepIngredient>) => void;
  remove: (index: number) => void;
  update: UseFieldArrayUpdate<StepFormValues, "ingredients">;
  onIngredientBlur: () => void;
}

export function StepIngredientTable({
  control,
  setValue,
  ingredientsMeta,
  ingredientCategoriesMeta,
  onFocusNotesRequested,
  recipeStepId, // Destructure this prop
  flourCategoryName,
  // Destructure the props from useFieldArray
  ingredientFields,
  append,
  remove,
  update,
  onIngredientBlur,
}: StepIngredientTableProps) {
  const groupedIngredients = useMemo(() => {
    const categoryMap = new Map<number, { category: IngredientCategory; ingredients: (FieldArrayWithId<StepFormValues, "ingredients", "rhfId"> & { idx: number })[] }>();

    ingredientCategoriesMeta.forEach(cat => {
      categoryMap.set(cat.id, { category: cat, ingredients: [] });
    });

    ingredientFields.forEach((field, idx) => {
      const group = categoryMap.get(field.ingredientCategoryId);
      if (group) {
        group.ingredients.push({ ...field, idx });
      }
    });

    return Array.from(categoryMap.values());
  }, [ingredientFields, ingredientCategoriesMeta]);

  return (
    <div>
      {groupedIngredients.map(({ category, ingredients: categoryIngredientFields }) => {
        const isFlourCategoryRule = category.name === flourCategoryName;
        const categoryIngredients = ingredientsMeta.filter(
          (ing) => ing.ingredientCategoryId === category.id
        );

        return (
          <div key={category.id} className="ingredient-category-group mb-6">
            <h4 className="text-lg font-semibold mb-2 text-text-secondary">{category.name}</h4>
            {categoryIngredientFields.map((ingredientFieldData) => (
              <StepIngredientRow
                key={ingredientFieldData.rhfId}
                ingredientFieldData={ingredientFieldData}
                categoryIngredients={categoryIngredients}
                ingredientsMeta={ingredientsMeta}
                ingredientCategoriesMeta={ingredientCategoriesMeta}
                isFlourCategoryRule={isFlourCategoryRule}
                remove={remove}
                update={update}
                control={control}
                setValue={setValue}
                onFocusNotesRequested={onFocusNotesRequested}
                recipeStepId={recipeStepId}
                onIngredientBlur={onIngredientBlur}
              />
            ))}
            <button
              type="button"
              onClick={() => append({ ingredientCategoryId: category.id })}
              className="btn-secondary mt-2"
            >
              + Add {category.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}
