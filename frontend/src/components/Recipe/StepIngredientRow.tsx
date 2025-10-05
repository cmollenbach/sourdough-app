import React, { useState, useEffect } from 'react';
import { Controller, useFormContext, type Control, type FieldArrayWithId, type UseFormSetValue, type UseFieldArrayUpdate } from "react-hook-form";
import type { IngredientMeta } from '@sourdough/shared';
import { IngredientCalculationMode, type IngredientCategory } from '@sourdough/shared';
import type { StepFormValues } from "./StepCard";
import { useRecipeBuilderStore } from '../../store/recipeBuilderStore';

// Type for elements in categoryIngredientFields (after mapping idx from RHF's useFieldArray)
type MappedCategoryIngredientField = FieldArrayWithId<StepFormValues, "ingredients", "rhfId"> & { idx: number };

interface StepIngredientRowProps {
  ingredientFieldData: MappedCategoryIngredientField;
  categoryIngredients: IngredientMeta[]; // Ingredients specific to this category
  ingredientsMeta: IngredientMeta[]; // All ingredients meta (needed for 'Other' check)
  ingredientCategoriesMeta: IngredientCategory[]; 
  isFlourCategoryRule: boolean; 
  remove: (index: number) => void;
  update: UseFieldArrayUpdate<StepFormValues, "ingredients">;
  control: Control<StepFormValues>;
  setValue: UseFormSetValue<StepFormValues>;
  onFocusNotesRequested?: () => void;
  recipeStepId: number;
  onIngredientBlur: () => void;
}

export function StepIngredientRow({
  ingredientFieldData,
  categoryIngredients,
  ingredientsMeta,
  ingredientCategoriesMeta,
  isFlourCategoryRule,
  remove,
  update,
  control,
  setValue,
  onFocusNotesRequested,
  recipeStepId,
  onIngredientBlur,
}: StepIngredientRowProps) {
  const INCLUSIONS_CATEGORY_NAME = "Inclusions";
  const { updateIngredientPercentage } = useRecipeBuilderStore();
  const { getValues } = useFormContext<StepFormValues>(); // FIX: getValues comes from useFormContext, not the store.
  const typedIngredientFieldData = ingredientFieldData as MappedCategoryIngredientField;

  const currentCalcMode = ingredientFieldData.calculationMode;
  const inputDisabled = false;

  return (
    <div
      key={typedIngredientFieldData.rhfId} // FIX: Use the RHF-specific keyName for the React key.
      className="ingredient-row flex flex-col items-start md:flex-row md:items-center gap-2 sm:gap-4 mt-1 md:self-center w-full"
    >
      {/* Register ingredientCategoryId so it's tracked */}
      <Controller
        name={`ingredients.${typedIngredientFieldData.idx}.ingredientCategoryId`}
        control={control}
        render={({ field }) => (
          <input type="hidden" {...field} value={ingredientFieldData.ingredientCategoryId} />
        )}
      />
      <Controller
        name={`ingredients.${typedIngredientFieldData.idx}.ingredientId`}
        control={control}
        render={({ field }) => (
          <select
            {...field}
            value={field.value || ''}
            onChange={(e) => {
              const newIngredientId = Number(e.target.value);
              const newMeta = ingredientsMeta.find(m => m.id === newIngredientId);

              // FIX: Instead of calling setValue on a nested field, which causes issues with
              // immutable state, get the whole ingredient object, update it, and then use
              // the `update` function from `useFieldArray` to replace the item at its index.
              const currentIngredient = getValues(`ingredients.${typedIngredientFieldData.idx}`);
              const newIngredient = {
                ...currentIngredient,
                ingredientId: newIngredientId,
                ingredientCategoryId: newMeta ? newMeta.ingredientCategoryId : currentIngredient.ingredientCategoryId,
              };
              update(typedIngredientFieldData.idx, newIngredient);
            }}
            className="border border-border rounded px-2 py-1 w-full bg-surface text-text-primary focus:border-primary-300 focus:ring-1 focus:ring-primary-100 transition-colors"
          >
            <option value="" disabled>Select Ingredient...</option>
            {categoryIngredients.map((ing) => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
            <option value={-1}>[+ Request new ingredient]</option>
          </select>
        )}
      />
      <Controller
        name={`ingredients.${typedIngredientFieldData.idx}.amount` as any}
        control={control}
        render={({ field }) => {
          const [localValue, setLocalValue] = useState(field.value?.toString() ?? "");

          useEffect(() => {
            const formValueString = field.value?.toString() ?? "";
            if (parseFloat(localValue) !== parseFloat(formValueString)) {
              setLocalValue(formValueString);
            }
          }, [field.value]);

          const handleBlur = () => {
            onIngredientBlur(); // Cancel any pending form-wide updates
            const numericValue = parseFloat(localValue);
            if (!isNaN(numericValue)) {
              // This call is now correct because `typedIngredientFieldData.id` refers to the database ID.
              updateIngredientPercentage(recipeStepId, typedIngredientFieldData.id, numericValue);
            } else {
              setLocalValue(field.value?.toString() ?? "");
            }
          };

          const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalValue(e.target.value);
          };
          
          const processNewAmountValue = (amount: number) => {
            const currentValue = parseFloat(localValue) || 0;
            const newValue = currentValue + amount;
            setLocalValue(newValue.toFixed(2).replace(/\.00$/, ''));
          };

          return (
            <div className="flex items-center gap-1 w-full md:w-auto">
              <button type="button" onClick={() => processNewAmountValue(-1)} className="btn-secondary">-</button>
              <input
                {...field}
                type="number"
                inputMode="numeric"
                value={localValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`border border-border rounded px-2 py-1 w-full md:w-20 text-center bg-surface text-text-primary focus:border-primary-300 focus:ring-1 focus:ring-primary-100 transition-colors`}
                placeholder={"%"}
              />
              <button type="button" onClick={() => processNewAmountValue(1)} className="btn-secondary">+</button>
            </div>
          );
        }}
      />
      <span className="w-full md:w-auto text-left md:text-center">
        {currentCalcMode === IngredientCalculationMode.PERCENTAGE ? '%' : 'g'}
      </span>
      <div className="w-full md:w-auto">
        <button
          type="button"
          onClick={() => remove(typedIngredientFieldData.idx)}
          aria-label="Remove ingredient"
          className="btn-danger w-full md:w-auto"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
