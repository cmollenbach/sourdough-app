/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useEffect } from "react";
import { useForm, Controller, useFieldArray, type UseFormSetValue } from "react-hook-form";
import type { RecipeStep, RecipeStepIngredient, RecipeStepField } from "../../types/recipe";
import { IngredientCalculationMode } from "../../types/recipe"; // Import the enum
import type { StepTemplate, IngredientMeta } from "../../types/recipeLayout";
import { StepIngredientTable } from "./StepIngredientTable";

export interface StepCardProps {
  step: RecipeStep;
  stepTemplates: StepTemplate[];
  ingredientsMeta: IngredientMeta[] | undefined;
  showAdvanced: boolean;
  onChange: (updated: RecipeStep) => void;
  onDuplicate: (step: RecipeStep) => void;
  onRemove: (stepId: number) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

function getDefaultFields(template: StepTemplate) {
  const fields: Record<number, string | number> = {};
  for (const f of template.fields) {
    if (f.defaultValue !== undefined) {
      fields[f.fieldId] = f.defaultValue;
    } else if (f.field?.type === "number") {
      fields[f.fieldId] = 0;
    } else {
      fields[f.fieldId] = "";
    }
  }
  return fields;
}

export default function StepCard({
  step,
  stepTemplates,
  ingredientsMeta,
  showAdvanced,
  onChange,
  onDuplicate,
  onRemove,
  dragHandleProps,
}: StepCardProps) {
  // Defensive: always use an array for ingredientsMeta
  const safeIngredientsMeta = useMemo(
    () =>
      Array.isArray(ingredientsMeta)
        ? ingredientsMeta
        : Array.isArray((ingredientsMeta as any)?.ingredients)
        ? (ingredientsMeta as any).ingredients
        : [],
    [ingredientsMeta]
  );
  const memoizedStepTemplates = useMemo(
    () => stepTemplates,
    [stepTemplates]
  );

  type StepFormValues = {
    templateId: number;
    fields: Record<number, string | number>;
    ingredients: RecipeStepIngredient[];
  };



  // Watch for templateId changes and ensure it's a number
  const { watch, control, reset, setValue, getValues, formState } = useForm<StepFormValues>({
    mode: "onChange", // Make RHF more responsive to input changes
    defaultValues: {
      templateId: step.stepTemplateId,
      fields: (() => {
        const template = stepTemplates.find((t) => t.id === step.stepTemplateId);
        const defaultFields = template ? getDefaultFields(template) : {};
        return {
          ...defaultFields,
          ...(step.fields ? Object.fromEntries(step.fields.map(f => [f.fieldId, f.value])) : {})
        };
      })(),
      ingredients: step.ingredients.map(ing => {
        const meta = safeIngredientsMeta.find((m: IngredientMeta) => m.id === ing.ingredientId);
        return {
          ...ing,
          ingredientCategoryId: meta ? meta.ingredientCategoryId : 0,
        };
      }),
    },
  });

  const selectedTemplateId = Number(watch("templateId"));
  const watchedFields = watch("fields"); // Watch fields for the useEffect dependency
  const watchedIngredients = watch('ingredients'); // For exhaustive-deps and useEffect dependency

  const template = stepTemplates.find((t) => t.id === selectedTemplateId);



  // For dynamic ingredient lines
  const { fields: ingredientFields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  // --- START Flour Logic Constants ---
  const FLOUR_CATEGORY_NAME = "Flour"; // Confirmed category name
  const BREAD_FLOUR_NAME = "Bread Flour"; // Confirmed default flour name
  // --- END Flour Logic Constants ---
  // Keep form in sync if step prop changes (e.g. duplicate/reorder)
  useEffect(() => {
    const template = memoizedStepTemplates.find((t) => t.id === step.stepTemplateId);
    const defaultFields = template ? getDefaultFields(template) : {};
    reset({
      templateId: step.stepTemplateId,
      fields: {
        ...defaultFields,
        ...(step.fields ? Object.fromEntries(step.fields.map(f => [f.fieldId, f.value])) : {})
      },
      ingredients: step.ingredients.map(ing => {
        // For newly added rows (ingredientId is 0), ing.ingredientCategoryId is already correctly set
        // by the append action. We should preserve it.
        // If an ingredient is selected (ingredientId > 0), then derive its categoryId from meta.
        // If selected but not found in meta (data issue), default to 0.
        const meta = ing.ingredientId && ing.ingredientId !== 0
          ? safeIngredientsMeta.find((m: IngredientMeta) => m.id === ing.ingredientId)
          : undefined;

        const finalIngredientCategoryId = meta
          ? meta.ingredientCategoryId
          : (ing.ingredientId === 0 ? ing.ingredientCategoryId : 0);
        return {
          ...ing,
          ingredientCategoryId: finalIngredientCategoryId,
        };
      }),
    });
  }, [step, reset, memoizedStepTemplates, safeIngredientsMeta]);

  // Effect to manage flour percentages summing to 100%
  useEffect(() => {
    if (!template || !watchedIngredients || watchedIngredients.length === 0) return;

    const flourCategoryRule = template.ingredientRules.find(
      (r) => r.ingredientCategory.name === FLOUR_CATEGORY_NAME
    );
    if (!flourCategoryRule) return; // Not a template with flours or flour category not found

    const flourCategoryId = flourCategoryRule.ingredientCategory.id;

    const flourIngredientsInForm = watchedIngredients
      .map((ing, index) => ({ ...ing, originalIndex: index })) // Keep original index
      .filter((ing) => ing.ingredientCategoryId === flourCategoryId);
      // Filter further for ingredients that are meant to be percentages
    const flourPercentageIngredientsInForm = flourIngredientsInForm.filter( // Use enum member
      (ing) => ing.calculationMode === IngredientCalculationMode.PERCENTAGE
    );

    if (flourPercentageIngredientsInForm.length === 0) return; // No percentage-based flours in this step yet

    if (flourPercentageIngredientsInForm.length === 1) {
      const firstFlour = flourPercentageIngredientsInForm[0];
      if (firstFlour.amount !== 100) {
        setValue(`ingredients.${firstFlour.originalIndex}.amount`, 100, { shouldDirty: true, shouldValidate: true });
      }
    } else {
      let sumOfEditableFlours = 0;
      const lastFlourIndexInFilteredArray = flourPercentageIngredientsInForm.length - 1;
      for (let i = 0; i < lastFlourIndexInFilteredArray; i++) { // Iterate all but the last percentage-based flour
        const flour = flourPercentageIngredientsInForm[i];
        let currentPercentage = Number(flour.amount);

        // Clamp individual editable flour percentage
        if (isNaN(currentPercentage) || currentPercentage < 0) currentPercentage = 0;
        if (currentPercentage > 100) currentPercentage = 100;

        // Ensure the sum of *this and previous* editable flours doesn't exceed 100
        // If it does, cap the current flour's percentage.
        if (sumOfEditableFlours + currentPercentage > 100) {
          currentPercentage = 100 - sumOfEditableFlours;
        }
        
        sumOfEditableFlours += currentPercentage;

        // Update the value in the form if it was clamped or changed
        if (Number(flour.amount) !== currentPercentage) {
            setValue(`ingredients.${flour.originalIndex}.amount`, currentPercentage, { shouldDirty: true, shouldValidate: true });
        }
      }

      const lastFlour = flourPercentageIngredientsInForm[lastFlourIndexInFilteredArray];
      // The last flour's percentage is 100 minus the sum of (clamped) editable flours.
      // It should naturally be >= 0 because sumOfEditableFlours is capped at 100.
      const lastFlourPercentage = Math.max(0, 100 - sumOfEditableFlours); 
      
      if (Number(lastFlour.amount) !== lastFlourPercentage) {
        setValue(`ingredients.${lastFlour.originalIndex}.amount`, lastFlourPercentage, { shouldDirty: true, shouldValidate: true });
      }
    }
  }, [watchedIngredients, template, setValue, FLOUR_CATEGORY_NAME]); // Removed getValues as it wasn't used

  // Effect to call onChange prop when form data changes and is dirty (user-driven change)
  useEffect(() => {
    if (formState.isDirty) {
      const currentFormData = getValues();
      const newFieldsArray: RecipeStepField[] = [];
      if (currentFormData.fields) {
        for (const fieldIdStr in currentFormData.fields) {
          const fieldId = Number(fieldIdStr);
          const value = currentFormData.fields[fieldId];
          const existingStepField = step.fields.find(f => f.fieldId === fieldId);
          newFieldsArray.push({
            id: existingStepField?.id || 0,
            recipeStepId: step.id,
            fieldId: fieldId,
            value: value,
            notes: existingStepField?.notes || null,
          });
        }
      }

      onChange({
        ...step,
        stepTemplateId: Number(currentFormData.templateId),
        fields: newFieldsArray,
        ingredients: currentFormData.ingredients.map(ing => ({
          ...ing,
          recipeStepId: step.id,
        })),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.isDirty, selectedTemplateId, watchedFields, watchedIngredients, onChange, step.id]); // getValues and step are not needed as direct deps here

  const visibleFields = (template?.fields || []).filter(
    (f) => showAdvanced || !f.advanced
  );

  if (!template) {
    return <div className="text-red-500">Template not found.</div>;
  }

  return (
    <form
      className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex flex-col gap-4 border border-gray-100 max-w-3xl mx-auto"
      // onBlur removed to favor useEffect-based onChange
      tabIndex={0}
      aria-label={`Step ${step.order}`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span {...dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600 text-2xl" aria-label="Reorder step">
            ☰
          </span>
          <span className="font-bold text-xl">{step.order}.</span>
          <Controller
            name="templateId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value}
                onChange={e => field.onChange(Number(e.target.value))}
                className="px-3 py-2 text-base border border-gray-300 rounded-md min-w-[180px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {stepTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                <option value="">[+ Request new template]</option>
              </select>
            )}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onDuplicate(step)}
            aria-label="Duplicate"
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >Duplicate</button>
          <button type="button"
            onClick={() => onRemove(step.id)}
            aria-label="Delete"
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >Delete</button>
        </div>
      </div>

      {/* Fields Grid */}
      <div className="flex flex-col gap-3">
        {visibleFields.map((meta) => {
          const inputId = `step-${step.id}-field-${meta.fieldId}`;
          return (
            <Controller
              key={meta.fieldId}
              name={`fields.${meta.fieldId}` as any}
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col sm:flex-row sm:items-center w-full gap-1 sm:gap-2">
                  <label
                    htmlFor={inputId}
                    className="block font-medium text-sm sm:min-w-[160px] sm:mb-0 mb-1 pr-2"
                  >
                    {meta.field.label || meta.field.name}
                  </label>
                  <div className="flex-1">
                    <input
                      {...field}
                      id={inputId}
                      value={typeof field.value === "string" || typeof field.value === "number" ? field.value : ""}
                      type={meta.field.type === "number" ? "number" : "text"}
                      className={`border rounded px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                        fieldState.invalid ? "border-red-500" : ""
                      } ${meta.field.type.toUpperCase() === "NUMBER" ? "text-center" : ""}`}
                      aria-label={meta.field.label || meta.field.name}
                    />
                    {(meta.helpText || meta.field.helpText) && (
                      <div className="text-xs text-gray-500 mt-1">{meta.helpText || meta.field.helpText}</div>
                    )}
                    {fieldState.error && (
                      <div className="text-xs text-red-500 mt-1">{fieldState.error.message}</div>
                    )}
                  </div>
                </div>
              )}
            />
          );
        })}
      </div>

      {/* Ingredients Section */}
      {template.ingredientRules.length > 0 && (
        <StepIngredientTable
          ingredientRules={template.ingredientRules}
          ingredientsMeta={safeIngredientsMeta}
          ingredientFields={ingredientFields}
          append={(newIngredientData) => {
            let finalIngredientToAdd = { ...newIngredientData };
            const flourCategoryRule = template.ingredientRules.find(r => r.ingredientCategory.name === FLOUR_CATEGORY_NAME);
            
            if (flourCategoryRule && newIngredientData.ingredientCategoryId === flourCategoryRule.ingredientCategory.id) {
              const breadFlourMeta = safeIngredientsMeta.find((m: IngredientMeta) => m.name === BREAD_FLOUR_NAME && m.ingredientCategoryId === flourCategoryRule.ingredientCategory.id);
              const currentFormIngredients = getValues("ingredients");
              const flourIngredientsInStep = currentFormIngredients.filter(ing => ing.ingredientCategoryId === flourCategoryRule.ingredientCategory.id);
              
              const isBreadFlourPresent = flourIngredientsInStep.some(ing => ing.ingredientId === breadFlourMeta?.id);

              // If adding the first flour to this category, and Bread Flour exists in meta, and it's not already present
              if (breadFlourMeta && !isBreadFlourPresent && flourIngredientsInStep.length === 0) {
                finalIngredientToAdd = {
                  ...newIngredientData,
                  ingredientId: breadFlourMeta.id,
                  // Percentage will be set to 100 by the useEffect
                };
              }
              // Otherwise, it's a subsequent flour, or Bread Flour is already there, or Bread Flour not found in meta.
              // Add as a generic new flour (ingredientId: 0, or as passed in).
              // The useEffect will adjust percentages.
            }
            append(finalIngredientToAdd);
            // The main useEffect watching formState.isDirty will handle calling onChange
          }}
          remove={(idx) => {
            remove(idx);
            // The main useEffect watching formState.isDirty will handle calling onChange
          }}
          control={control}
          setValue={setValue as UseFormSetValue<StepFormValues>} // Pass setValue down
          // Pass down information needed for disabling/calculating flour percentages
          flourCategoryName={FLOUR_CATEGORY_NAME}
          recipeStepId={step.id}
        />
      )}
    </form>
  );
}

/* When preparing step.ingredients for the form:
const enrichedIngredients = step.ingredients.map(ing => {
  const meta = ingredientsMeta.find(m => m.id === ing.ingredientId);
  return {
    ...ing,
    ingredientCategoryId: meta ? meta.ingredientCategoryId : 0,
  };
});
*/