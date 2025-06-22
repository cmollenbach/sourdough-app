import React from 'react';
import { Controller } from "react-hook-form";
import type { Control, FieldArrayWithId, Path, UseFormSetValue } from "react-hook-form";
import type { IngredientMeta } from "../../types/recipeLayout";
import { IngredientCalculationMode, type IngredientCategory } from "../../types/recipe";
import type { StepFormValues } from "./StepCard";

// Type for elements in categoryIngredientFields (after mapping idx from RHF's useFieldArray)
type MappedCategoryIngredientField = FieldArrayWithId<StepFormValues, "ingredients", "id"> & { idx: number };

interface StepIngredientRowProps {
  ingredientFieldData: MappedCategoryIngredientField;
  categoryIngredients: IngredientMeta[]; // Ingredients specific to this category
  ingredientsMeta: IngredientMeta[]; // All ingredients meta (needed for 'Other' check)
  ingredientCategoriesMeta: IngredientCategory[]; 
  isFlourCategoryRule: boolean; 
  remove: (index: number) => void; // Use the remove function from useFieldArray
  control: Control<StepFormValues>;
  setValue: UseFormSetValue<StepFormValues>;
  onFocusNotesRequested?: () => void;
}

export function StepIngredientRow({
  ingredientFieldData,
  categoryIngredients,
  ingredientsMeta,
  ingredientCategoriesMeta,
  isFlourCategoryRule,
  remove,
  control,
  setValue,
  onFocusNotesRequested,
}: StepIngredientRowProps) {
  const INCLUSIONS_CATEGORY_NAME = "Inclusions";

  const currentCalcMode = ingredientFieldData.calculationMode;
  const typedIngredientFieldData = ingredientFieldData;
  const inputDisabled = false; // All inputs are enabled now

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
          <input type="hidden" {...field} value={ingredientFieldData.ingredientCategoryId} />
        )}
      />
      <Controller
        name={`ingredients.${typedIngredientFieldData.idx}.ingredientId` as Path<StepFormValues>}
        control={control}
        render={({ field }) => (
          <div className="w-full md:min-w-[150px] md:w-auto">
            <select
              {...field}
              value={typeof field.value === "number" ? field.value : 0}
              onChange={e => {
                const selectedIngredientId = Number(e.target.value);
                field.onChange(selectedIngredientId);

                if (selectedIngredientId > 0) {
                  const selectedIngredientMeta = ingredientsMeta.find(meta => meta.id === selectedIngredientId);
                  
                  let isSelectedIngredientInInclusionsCategory = false;
                  if (selectedIngredientMeta && selectedIngredientMeta.ingredientCategoryId) {
                      const categoryObject = ingredientCategoriesMeta.find(cat => cat.id === selectedIngredientMeta.ingredientCategoryId);
                      if (categoryObject && categoryObject.name === INCLUSIONS_CATEGORY_NAME) {
                          isSelectedIngredientInInclusionsCategory = true;
                      }
                  }

                  const newMode = isSelectedIngredientInInclusionsCategory
                    ? IngredientCalculationMode.FIXED_WEIGHT
                    : IngredientCalculationMode.PERCENTAGE;

                  setValue(`ingredients.${typedIngredientFieldData.idx}.calculationMode`, newMode);
                  setValue(`ingredients.${typedIngredientFieldData.idx}.amount`, 0);
                } else {
                  setValue(`ingredients.${typedIngredientFieldData.idx}.calculationMode`, IngredientCalculationMode.PERCENTAGE);
                  setValue(`ingredients.${typedIngredientFieldData.idx}.amount`, 0);
                }

                const selectedMetaForNotes = ingredientsMeta.find(meta => meta.id === selectedIngredientId);
                if (selectedMetaForNotes && selectedMetaForNotes.name.toLowerCase().includes('other (see note)') && onFocusNotesRequested) {
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
          const processNewAmountValue = (newValueString: string): number | string => {
            let rawValue = Number(newValueString);
            const isClearingInput = newValueString === "";
            if (!isClearingInput && isNaN(rawValue)) rawValue = 0;

            let valueToSet: number | string;

            if (isClearingInput) {
              valueToSet = "";
            } else {
              if (isFlourCategoryRule && currentCalcMode === IngredientCalculationMode.PERCENTAGE) {
                valueToSet = Math.min(100, Math.max(0, rawValue));
              } else {
                valueToSet = Math.max(0, Math.min(10000, rawValue));
              }
            }
            return valueToSet;
          };

          const handleDirectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const valueToSet = processNewAmountValue(e.target.value);
            field.onChange(valueToSet);
          };

          const getStepValue = () => {
            const numValue = Number(field.value) || 0;
            if (currentCalcMode === IngredientCalculationMode.PERCENTAGE) {
              return (numValue < 10 && numValue > 0 && numValue % 1 !== 0) ? 0.1 : 1;
            }
            return 1;
          };

          const handleIncrement = () => {
            const currentValue = Number(field.value) || 0;
            const step = getStepValue();
            const newValueString = String(currentValue + step);
            const valueToSet = processNewAmountValue(newValueString);
            field.onChange(valueToSet);
          };

          const handleDecrement = () => {
            const currentValue = Number(field.value) || 0;
            const step = getStepValue();
            const newValueString = String(Math.max(0, currentValue - step));
            const valueToSet = processNewAmountValue(newValueString);
            field.onChange(valueToSet);
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
                {...field}
                type="number"
                inputMode="numeric"
                step={currentCalcMode === IngredientCalculationMode.PERCENTAGE ? "0.1" : "1"}
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
