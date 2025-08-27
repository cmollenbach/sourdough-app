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
  recipeStepId: number;
  flourCategoryName: string;
  showAdvanced: boolean; // Add advanced toggle prop
  stepRole?: string; // Add step role for contextual filtering
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
  recipeStepId,
  flourCategoryName,
  showAdvanced,
  stepRole,
  // Destructure the props from useFieldArray
  ingredientFields,
  append,
  remove,
  update,
  onIngredientBlur,
}: StepIngredientTableProps) {
  // Filter categories and ingredients based on step role and advanced settings
  const getRelevantCategories = useMemo(() => {
    // Define which categories are relevant for each step role
    const categoryRelevance: Record<string, string[]> = {
      'PREFERMENT': ['Flour', 'Preferment'], // Preferments can use flour
      'AUTOLYSE': ['Flour'], // Autolyse only uses flour
      'MIX': ['Flour', 'Liquid', 'Inclusions'], // MIX steps: Flour, Liquid, and Inclusions (Preferment and Salt calculated automatically)
      'ENRICH': ['Enrichments'], // Only enrichments
      'INCLUSION': ['Inclusions'], // Only inclusions
      // Steps without ingredients (no ingredients shown)
      'BULK': [],
      'SHAPE': [],
      'PROOF': [],
      'BAKE': [],
      'REST': []
    };

    const relevantCategoryNames = categoryRelevance[stepRole || ''] || [];
    
    return ingredientCategoriesMeta.filter(category => {
      // Only show categories relevant to the current step role
      if (relevantCategoryNames.length > 0 && !relevantCategoryNames.includes(category.name)) {
        return false;
      }
      
      // Hide advanced categories when showAdvanced is false
      const isAdvancedCategory = ['Enrichments', 'Inclusions'].includes(category.name);
      if (isAdvancedCategory && !showAdvanced) {
        return false;
      }
      
      return true;
    });
  }, [ingredientCategoriesMeta, stepRole, showAdvanced]);

  // Filter ingredients based on advanced settings
  const getFilteredIngredients = useMemo(() => {
    return (categoryId: number) => {
      return ingredientsMeta.filter(ingredient => {
        if (ingredient.ingredientCategoryId !== categoryId) return false;
        
        // Hide advanced ingredients when showAdvanced is false
        if (ingredient.advanced && !showAdvanced) {
          return false;
        }
        
        return true;
      });
    };
  }, [ingredientsMeta, showAdvanced]);

  const groupedIngredients = useMemo(() => {
    const categoryMap = new Map<number, { category: IngredientCategory; ingredients: (FieldArrayWithId<StepFormValues, "ingredients", "rhfId"> & { idx: number })[] }>();

    // Only use relevant categories
    getRelevantCategories.forEach(cat => {
      categoryMap.set(cat.id, { category: cat, ingredients: [] });
    });

    ingredientFields.forEach((field, idx) => {
      const group = categoryMap.get(field.ingredientCategoryId);
      if (group) {
        group.ingredients.push({ ...field, idx });
      }
    });

    return Array.from(categoryMap.values());
  }, [ingredientFields, getRelevantCategories]);

  return (
    <div>
      {groupedIngredients.length === 0 ? (
        <div className="text-text-secondary text-sm italic">
          {stepRole && ['BULK', 'SHAPE', 'PROOF', 'BAKE', 'REST'].includes(stepRole) 
            ? "This step doesn't typically require ingredients." 
            : "No ingredient categories available for this step."}
        </div>
      ) : (
        groupedIngredients.map(({ category, ingredients: categoryIngredientFields }) => {
          const isFlourCategoryRule = category.name === flourCategoryName;
          const categoryIngredients = getFilteredIngredients(category.id);

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
        })
      )}
    </div>
  );
}
