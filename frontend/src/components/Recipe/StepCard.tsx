/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useEffect, useRef } from "react";
import debounce from 'lodash.debounce';
import { useForm, Controller, useFieldArray, type UseFormSetValue, FormProvider } from "react-hook-form";
import type { RecipeStep, RecipeStepIngredient, RecipeStepField } from "../../types/recipe";
import { IngredientCalculationMode } from "../../types/recipe";
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
    if (f.defaultValue !== undefined && f.defaultValue !== null) {
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

  const formMethods = useForm<StepFormValues>({
    mode: "onChange", // Important for formState.isDirty to update on changes
    defaultValues: useMemo(() => {
      const template = memoizedStepTemplates.find((t) => t.id === step.stepTemplateId);
      const defaultStepFields = template ? getDefaultFields(template) : {};
      const initialFields = {
        ...defaultStepFields,
        ...(step.fields ? Object.fromEntries(step.fields.map(f => [f.fieldId, f.value])) : {})
      };
      const initialIngredients = step.ingredients.map(ing => {
        const meta = safeIngredientsMeta.find((m: IngredientMeta) => m.id === ing.ingredientId);
        return {
          ...ing,
          ingredientCategoryId: meta ? meta.ingredientCategoryId : ing.ingredientCategoryId || 0,
        };
      });
      return {
        templateId: step.stepTemplateId,
        fields: initialFields,
        ingredients: initialIngredients,
      };
    }, [step.stepTemplateId, step.fields, step.ingredients, memoizedStepTemplates, safeIngredientsMeta]),
  });

  const { watch, control, reset, setValue, getValues, formState } = formMethods;

  const selectedTemplateId = Number(watch("templateId"));
  const template = memoizedStepTemplates.find((t) => t.id === selectedTemplateId);

  const { fields: ingredientFields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const FLOUR_CATEGORY_NAME = "Flour";
  const BREAD_FLOUR_NAME = "Bread Flour";

  // Memoize stringified versions of critical step content from props
  // This helps in reliably detecting if the incoming prop content has actually changed.
  const stringifiedStepContentFromProps = useMemo(() => JSON.stringify({
    templateId: step.stepTemplateId,
    fields: step.fields,
    ingredients: step.ingredients,
  }), [step.stepTemplateId, step.fields, step.ingredients]);

  const prevStringifiedStepRef = useRef<string | null>(null);

  // Effect to reset the form when the step prop changes significantly from an external source
  useEffect(() => {
    // Get the stringified version of the current incoming props
    const currentPropContent = stringifiedStepContentFromProps;

    // If the current prop content is different from what we last knew (or submitted)
    if (prevStringifiedStepRef.current !== currentPropContent) {
      // This indicates either an initial load or a genuine external change.
      // console.log(`StepCard (${step.id}) Prop Sync: External/Initial change detected. Resetting form. Prev: ${prevStringifiedStepRef.current}, New: ${currentPropContent}`);
      
      const currentTemplate = memoizedStepTemplates.find((t) => t.id === step.stepTemplateId);
      const defaultStepFields = currentTemplate ? getDefaultFields(currentTemplate) : {};

      const newFormValues = {
        templateId: step.stepTemplateId,
        fields: {
          ...defaultStepFields,
          ...(step.fields ? Object.fromEntries(step.fields.map(f => [f.fieldId, f.value])) : {})
        },
        ingredients: step.ingredients.map(ing => {
          const meta = ing.ingredientId && ing.ingredientId !== 0
            ? safeIngredientsMeta.find((m: IngredientMeta) => m.id === ing.ingredientId)
            : undefined;
          const finalIngredientCategoryId = meta
            ? meta.ingredientCategoryId
            : (ing.ingredientId === 0 ? ing.ingredientCategoryId : 0); // Preserve category if ingredientId is 0 (newly added)
          return {
            ...ing,
            ingredientCategoryId: finalIngredientCategoryId,
          };
        }),
      };
      reset(newFormValues, { keepDirty: false }); // Reset the form to be clean against new props
      // Update the ref to reflect this newly set state from props.
      prevStringifiedStepRef.current = currentPropContent;
    }
  }, [
    step.id, // Important: if the step ID changes, it's a new step, always reset.
    stringifiedStepContentFromProps, // The primary trigger for content-based resets.
    reset,
    memoizedStepTemplates,
    safeIngredientsMeta
  ]);


  const debouncedOnChange = useMemo(() =>
    debounce((dataToSubmit: RecipeStep) => {
      onChange(dataToSubmit); // Propagate the change upwards
      // After successfully sending the update, update the ref
      // to reflect the content of what was just submitted.
      // This helps the prop-sync effect above to ignore the "echo" of this update.
      prevStringifiedStepRef.current = JSON.stringify({
        templateId: dataToSubmit.stepTemplateId,
        fields: dataToSubmit.fields,       // Use fields from dataToSubmit
        ingredients: dataToSubmit.ingredients, // Use ingredients from dataToSubmit
      });
    }, 100),
    [onChange] // onChange is a prop, prevStringifiedStepRef is a ref (doesn't need to be dependency of useMemo)
  );

  // Effect to call debouncedOnChange when form is dirty
  useEffect(() => {
    if (formState.isDirty) {
      const currentFormData = getValues();
      
      // Preserve stable identifiers from the prop `step`
      const stepId = step.id;
      const stepOrder = step.order;
      const stepRecipeId = step.recipeId;
      const originalStepNotes = step.notes; // If notes/desc are not in StepFormValues
      const originalStepDescription = step.description;

      // Rebuild fields array, preserving existing DB IDs and notes where possible
      // It uses step.fields from props to get original DB IDs/notes.
      const newFieldsArray: RecipeStepField[] = [];
      const originalFieldsMap = new Map(step.fields.map(f => [f.fieldId, f]));
      if (currentFormData.fields) {
        for (const fieldIdStr in currentFormData.fields) {
          const fieldId = Number(fieldIdStr);
          const value = currentFormData.fields[fieldId];
          const existingStepField = originalFieldsMap.get(fieldId);
          newFieldsArray.push({
            id: existingStepField?.id || 0,
            recipeStepId: stepId,
            fieldId: fieldId,
            value: value,
            notes: existingStepField?.notes || null,
          });
        }
      }
      const updatedStepData: RecipeStep = {
        // Use stable identifiers and form data
        id: stepId,
        order: stepOrder,
        recipeId: stepRecipeId,
        stepTemplateId: Number(currentFormData.templateId),
        fields: newFieldsArray,
        ingredients: currentFormData.ingredients.map(ing => ({
          ...ing,
          recipeStepId: stepId,
        })),
        notes: originalStepNotes, // Or from currentFormData if editable in this form
        description: originalStepDescription, // Or from currentFormData
      };
      debouncedOnChange(updatedStepData);
    }
  }, [
    formState.isDirty, 
    getValues, 
    debouncedOnChange, 
    step.id, 
    step.order, 
    step.recipeId, 
    step.notes,
    step.description,
    step.fields, // Dependency because originalFieldsMap uses it to merge IDs/notes
    // selectedTemplateId and watchedIngredients are implicitly handled by formState.isDirty
    // if they are part of the form and their change dirties the form.
  ]);

  const visibleFields = (template?.fields || []).filter(
    (f) => showAdvanced || !f.advanced
  );

  if (!template) {
    return <div className="text-red-500 p-4">Step template (ID: {selectedTemplateId}) not found.</div>;
  }

  return (
    <FormProvider {...formMethods}>
      <form
        className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex flex-col gap-4 border border-gray-100 max-w-3xl mx-auto"
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
                  onChange={e => {
                    const newTemplateId = Number(e.target.value);
                    field.onChange(newTemplateId);
                    // When template changes, reset fields and ingredients based on new template
                    const newTemplate = memoizedStepTemplates.find(t => t.id === newTemplateId);
                    if (newTemplate) {
                      const defaultNewFields = getDefaultFields(newTemplate);
                      setValue("fields", defaultNewFields, {shouldDirty: true}); // Mark dirty on template change
                      // Reset ingredients based on new template rules
                      const newDefaultIngredients = newTemplate.ingredientRules.map(ir => ({
                        id: -(Date.now() + ir.ingredientCategoryId + Math.floor(Math.random() * 1000)), // new temp ID
                        recipeStepId: step.id,
                        ingredientId: 0,
                        amount: 0,
                        calculationMode: safeIngredientsMeta.find((im: IngredientMeta) => im.ingredientCategoryId === ir.ingredientCategoryId)?.defaultCalculationMode || IngredientCalculationMode.PERCENTAGE,
                        ingredientCategoryId: ir.ingredientCategoryId,
                        preparation: null,
                        notes: null,
                      }));
                      setValue("ingredients", newDefaultIngredients, {shouldDirty: true}); // Mark dirty
                    }
                  }}
                  className="px-3 py-2 text-base border border-gray-300 rounded-md min-w-[180px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {memoizedStepTemplates.map((t) => (
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

                if (breadFlourMeta && !isBreadFlourPresent && flourIngredientsInStep.length === 0) {
                  finalIngredientToAdd = {
                    ...newIngredientData,
                    ingredientId: breadFlourMeta.id, // Default to Bread Flour
                    amount: 100, // Set to 100%
                    calculationMode: IngredientCalculationMode.PERCENTAGE, // Ensure it's percentage mode
                  };
                }
              }
              append(finalIngredientToAdd);
            }}
            remove={(idx) => {
              remove(idx);
            }}
            control={control}
            setValue={setValue as UseFormSetValue<StepFormValues>}
            flourCategoryName={FLOUR_CATEGORY_NAME}
            recipeStepId={step.id}
          />
        )}
      </form>
    </FormProvider>
  );
}
