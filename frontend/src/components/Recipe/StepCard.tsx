/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useEffect, useRef, useState } from "react"; // Added useState
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
    notes?: string | null; // Added notes
    description?: string | null; // Added description (optional for now, but good to have)
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
        notes: step.notes,
        description: step.description,
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
    notes: step.notes,
    ingredients: step.ingredients,
    description: step.description,
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
        notes: step.notes,
        description: step.description,
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
    step.stepTemplateId, // Added: Explicit dependency
    step.fields,         // Added: Explicit dependency
    step.ingredients,    // Added: Explicit dependency
    stringifiedStepContentFromProps, // The primary trigger for content-based resets.
    reset,
    memoizedStepTemplates,
    safeIngredientsMeta,
  ]);


const debouncedOnChange = useMemo(() =>
    debounce((dataToSubmit: RecipeStep) => {
      onChange(dataToSubmit); // Propagate the change upwards first

      // After propagating the change, reset the form with this new data.
      // This makes the form "clean" against this new state and should set formState.isDirty to false.
      const formValuesForReset: StepFormValues = {
        templateId: dataToSubmit.stepTemplateId,
        fields: Object.fromEntries(dataToSubmit.fields.map(f => [f.fieldId, f.value])),
        notes: dataToSubmit.notes,
        description: dataToSubmit.description,
        ingredients: dataToSubmit.ingredients.map(ing => {
          // Ensure ingredientCategoryId is correctly populated, similar to defaultValues/prop-sync logic
          const meta = safeIngredientsMeta.find((m: IngredientMeta) => m.id === ing.ingredientId);
          return {
            ...ing,
            ingredientCategoryId: meta ? meta.ingredientCategoryId : ing.ingredientCategoryId || 0,
          };
        }),
      };
      reset(formValuesForReset, { keepDirty: false });

      // Update prevStringifiedStepRef to reflect the state the form was just reset to.
      // This helps the prop-sync effect correctly identify external vs. internal updates.
      prevStringifiedStepRef.current = JSON.stringify({
        templateId: dataToSubmit.stepTemplateId,
        fields: dataToSubmit.fields,
        ingredients: dataToSubmit.ingredients,
        notes: dataToSubmit.notes,
        description: dataToSubmit.description,
      });
    }, 100),
    [onChange, reset, safeIngredientsMeta]
  );
  // Effect to call debouncedOnChange when form is dirty
  useEffect(() => {
    if (formState.isDirty) {
      const currentFormData = getValues();
      
      // Preserve stable identifiers from the prop `step`
      const stepId = step.id;
      const stepOrder = step.order;
      const stepRecipeId = step.recipeId;

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
        notes: currentFormData.notes, 
        description: currentFormData.description, 
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
    step.fields, // Dependency because originalFieldsMap uses it to merge IDs/notes
    // selectedTemplateId and watchedIngredients are implicitly handled by formState.isDirty
    // if they are part of the form and their change dirties the form.
  ]);

  const visibleFields = (template?.fields || []).filter(
    (f) => showAdvanced || !f.advanced
  );

  // State to manage the visibility of help popovers for each field
  const [visibleHelpFieldId, setVisibleHelpFieldId] = useState<number | null>(null);

  if (!template) {
    return <div className="text-red-500 p-4">Step template (ID: {selectedTemplateId}) not found.</div>;
  }

  return (
    <FormProvider {...formMethods}>
      <form
        className="bg-surface-elevated rounded-2xl shadow-card p-4 mb-6 flex flex-col gap-4 border border-border max-w-3xl mx-auto"
        tabIndex={0}
        aria-label={`Step ${step.order}`}
      >
        {/* Header Row */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span {...dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600 text-2xl" aria-label="Reorder step">
              ☰
            </span>
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
                  className="px-3 py-2 text-base border border-border rounded-md min-w-[180px] bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition-colors"
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
              className="btn-primary"
            >Duplicate</button>
            <button type="button"
              onClick={() => onRemove(step.id)}
              aria-label="Delete"
              title="Delete"
              className="btn-danger"
            >
              🗑️
            </button>
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
                    {/* Label and Help Icon Container */}
                    <div className="flex items-center sm:min-w-[160px] sm:mb-0 mb-1 pr-2">
                      <label
                        htmlFor={inputId}
                        className="block font-medium text-sm"
                      >
                        {meta.field.label || meta.field.name}
                      </label>
                      {(meta.helpText || meta.field.helpText) && (
                        <div className="relative inline-block ml-1.5"> {/* Wrapper for icon and popover */}
                          <button
                            type="button"
                            onClick={() => setVisibleHelpFieldId(visibleHelpFieldId === meta.fieldId ? null : meta.fieldId)}
                            className="text-primary-500 hover:text-primary-600 focus:outline-none flex items-center justify-center"
                            aria-label={`Help for ${meta.field.label || meta.field.name}`}
                            aria-expanded={visibleHelpFieldId === meta.fieldId}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {visibleHelpFieldId === meta.fieldId && (
                            <div
                              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 p-2.5 bg-gray-700 text-white text-xs rounded-md shadow-lg z-20 w-max max-w-[280px]"
                              role="tooltip"
                            >
                              {meta.helpText || meta.field.helpText}
                              {/* Arrow pointing down to the icon */}
                              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-gray-700"></div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Input and Error Container */}
                    <div className="flex-1 min-w-0"> {/* Added min-w-0 for proper flex behavior */}
                      <input
                        {...field}
                        id={inputId}
                        value={typeof field.value === "string" || typeof field.value === "number" ? field.value : ""}
                        type={meta.field.type === "number" ? "number" : "text"}
                        className={`border border-border rounded px-3 py-2 w-full bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition ${
                          fieldState.invalid ? "border-red-500" : ""
                        } ${meta.field.type.toUpperCase() === "NUMBER" ? "text-center" : ""}`}
                        aria-label={meta.field.label || meta.field.name}
                      />
                      {/* Error message remains below the input */}
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

        {/* Step Notes */}
        <div className="flex flex-col gap-1">
          <label htmlFor={`step-${step.id}-notes`} className="block font-medium text-sm">
            Step Notes
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                id={`step-${step.id}-notes`}
                value={field.value || ""}
                rows={3}
                className="border border-border rounded px-3 py-2 w-full bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition-colors"
                placeholder="Optional notes for this step..."
              />
            )}
          />
        </div>

      </form>
    </FormProvider>
  );
}
