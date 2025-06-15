// StepCard.tsx
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
  isExpanded: boolean; // Added for accordion
  onToggleExpand: () => void; // Added for accordion
  isNewlyAdded?: boolean; // For auto-expand/focus on new step
  onNewlyAddedStepHandled?: () => void; // Callback after handling newly added step
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

// Define StepFormValues outside the component so it's accessible by getFormValuesFromStepData
export type StepFormValues = { // Export this type
  templateId: number;
  fields: Record<number, string | number>;
  notes?: string | null;
  description?: string | null;
  ingredients: RecipeStepIngredient[];
};
// Helper function to generate form values from step data
function getFormValuesFromStepData(
  stepData: RecipeStep,
  allTemplates: StepTemplate[],
  allIngredientsMeta: IngredientMeta[] // Expects the already "safe" array from useMemo
): StepFormValues { // StepFormValues is defined below
  const template = allTemplates.find((t) => t.id === stepData.stepTemplateId);
  const defaultStepFields = template ? getDefaultFields(template) : {};
  
  const currentFieldsData = stepData.fields ? Object.fromEntries(stepData.fields.map(f => [f.fieldId, f.value])) : {};

  return {
    templateId: stepData.stepTemplateId,
    fields: {
      ...defaultStepFields,
      ...currentFieldsData,
    },
    notes: stepData.notes,
    description: stepData.description,
    ingredients: stepData.ingredients.map(ing => {
      const meta = ing.ingredientId && ing.ingredientId !== 0
        ? allIngredientsMeta.find((m) => m.id === ing.ingredientId)
        : undefined;
      
      let finalIngredientCategoryId = ing.ingredientCategoryId;
      if (meta) {
        finalIngredientCategoryId = meta.ingredientCategoryId;
      } else if (ing.ingredientId === 0 && ing.ingredientCategoryId) {
        finalIngredientCategoryId = ing.ingredientCategoryId;
      } else {
        finalIngredientCategoryId = 0; 
      }

      return { ...ing, ingredientCategoryId: finalIngredientCategoryId || 0 };
    }),
  };
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
  isExpanded,
  onToggleExpand,
  isNewlyAdded,
  onNewlyAddedStepHandled,
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

  const formMethods = useForm<StepFormValues>({
    mode: "onChange", // Important for formState.isDirty to update on changes
    defaultValues: useMemo(() => {
      return getFormValuesFromStepData(step, memoizedStepTemplates, safeIngredientsMeta);
    }, [step, memoizedStepTemplates, safeIngredientsMeta]), // Added step, step.xyz are covered by step
  });
  const { watch, control, reset, setValue, getValues, formState } = formMethods;

  const selectedTemplateId = Number(watch("templateId"));

  // Ref for the notes textarea (for "focus on Other ingredient" feature)
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const focusNotesField = () => {
    notesTextareaRef.current?.focus();
  };
  const [shouldFocusTemplateSelect, setShouldFocusTemplateSelect] = useState(false); // New state for managing focus
  const templateSelectRef = useRef<HTMLSelectElement>(null); // Ref for the template select input
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
  }), [step.stepTemplateId, step.fields, step.ingredients, step.notes, step.description]);

  const prevStringifiedStepRef = useRef<string | null>(null);

  // Effect to reset the form when the step prop changes significantly from an external source
  useEffect(() => {
    // Get the stringified version of the current incoming props
    const currentPropContent = stringifiedStepContentFromProps;

    // If the current prop content is different from what we last knew (or submitted)
    if (prevStringifiedStepRef.current !== currentPropContent) {
      // This indicates either an initial load or a genuine external change.
      const newFormValues = getFormValuesFromStepData(step, memoizedStepTemplates, safeIngredientsMeta);
      reset(newFormValues, { keepDirty: false }); // Reset the form to be clean against new props
      // Update the ref to reflect this newly set state from props.
      prevStringifiedStepRef.current = currentPropContent;
    }
  }, [
    step, // step is used in getFormValuesFromStepData
    stringifiedStepContentFromProps, // The primary trigger for content-based resets.
    reset,
    memoizedStepTemplates,
    safeIngredientsMeta,
  ]); // step.stepTemplateId is covered by 'step'

  // Effect for handling newly added step: auto-expand and flag for focus
  useEffect(() => {
    if (isNewlyAdded) {
      if (!isExpanded) {
        onToggleExpand(); // Expand if not already expanded
      }
      setShouldFocusTemplateSelect(true); // Set flag to attempt focus after expansion

      if (onNewlyAddedStepHandled) {
        onNewlyAddedStepHandled(); // Notify parent that this has been handled
      }
    }
  }, [isNewlyAdded, isExpanded, onToggleExpand, onNewlyAddedStepHandled]);

  // Effect to focus the template select input when isExpanded changes and the flag is set
  useEffect(() => {
    if (isExpanded && shouldFocusTemplateSelect) {
      // Delay focus slightly to ensure the element is rendered and visible after expansion
      const timer = setTimeout(() => {
        templateSelectRef.current?.focus();
        setShouldFocusTemplateSelect(false); // Reset the flag
      }, 100); // Increased delay slightly, adjust if needed
      return () => clearTimeout(timer);
    }
  }, [isExpanded, shouldFocusTemplateSelect]);



const debouncedOnChange = useMemo(() =>
    debounce((dataToSubmit: RecipeStep) => {
      onChange(dataToSubmit); // Propagate the change upwards first

      // After propagating the change, reset the form with this new data.
      // This makes the form "clean" against this new state and should set formState.isDirty to false.
      const formValuesForReset = getFormValuesFromStepData(dataToSubmit, memoizedStepTemplates, safeIngredientsMeta);
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
    [onChange, reset, safeIngredientsMeta, memoizedStepTemplates] // Added memoizedStepTemplates
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
    step, // step covers id, order, recipeId, and fields
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
      <div className="bg-surface-elevated rounded-2xl shadow-card mb-6 border border-border max-w-3xl mx-auto"
      >
        {/* Header Row */}
        <div
          className="flex flex-wrap items-center gap-3 justify-between p-4 cursor-pointer hover:bg-surface-hover transition-colors"
          onClick={onToggleExpand}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleExpand(); }}
          aria-expanded={isExpanded}
          aria-controls={`step-content-${step.id}`}
          aria-label={`Step ${step.order}: ${template?.name || 'Unnamed Step'}, ${isExpanded ? 'expanded, click to collapse' : 'collapsed, click to expand'}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span {...dragHandleProps}
                  onClick={(e) => e.stopPropagation()} // Prevent toggle when starting drag
                  onKeyDown={(e) => { // Prevent toggle if space/enter is for drag
                    if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
                  }}
                  className="cursor-grab text-gray-400 hover:text-gray-600 text-2xl p-1 -ml-1" // Added padding for easier grab
                  aria-label="Reorder step">
              ☰
            </span>
            {/* Template Selector - stop propagation to prevent toggle when interacting with select */}
            <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="flex-shrink-0">
              <Controller
                name="templateId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field} // Spread field props first
                    ref={(e) => { // Then, merge your ref with RHF's ref
                      field.ref(e); // Call RHF's ref function
                      templateSelectRef.current = e; // Assign to your ref
                    }}
                    value={field.value}
                    onChange={e => {
                      const newTemplateId = Number(e.target.value);
                      field.onChange(newTemplateId);
                      const newTemplate = memoizedStepTemplates.find(t => t.id === newTemplateId);
                      if (newTemplate) {
                        const defaultNewFields = getDefaultFields(newTemplate);
                        setValue("fields", defaultNewFields, {shouldDirty: true});
                        const newDefaultIngredients = newTemplate.ingredientRules.map(ir => ({
                          id: -(Date.now() + ir.ingredientCategoryId + Math.floor(Math.random() * 1000)),
                          recipeStepId: step.id,
                          ingredientId: 0,
                          amount: 0,
                          calculationMode: safeIngredientsMeta.find((im: IngredientMeta) => im.ingredientCategoryId === ir.ingredientCategoryId)?.defaultCalculationMode || IngredientCalculationMode.PERCENTAGE,
                          ingredientCategoryId: ir.ingredientCategoryId,
                          preparation: null,
                          notes: null,
                        }));
                        setValue("ingredients", newDefaultIngredients, {shouldDirty: true});
                      }
                      // UX Enhancement: Auto-expand if not already expanded when type changes
                      if (!isExpanded) {
                        onToggleExpand();
                      }
                    }}
                    className="px-3 py-2 text-base border border-border rounded-md min-w-[180px] bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition-colors"
                    aria-label="Select step template"
                  >
                    {memoizedStepTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                    <option value="">[+ Request new template]</option>
                  </select>
                )}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDuplicate(step); }}
              aria-label={`Duplicate step: ${template?.name || 'Unnamed Step'}`}
              className="btn-primary"
            >Duplicate</button>
            <button type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(step.id); }}
              aria-label={`Delete step: ${template?.name || 'Unnamed Step'}`}
              title={`Delete step: ${template?.name || 'Unnamed Step'}`}
              className="btn-danger"
            >
              🗑️
            </button>
            {/* Expansion Indicator */}
            <span className="text-xl select-none" aria-hidden="true">
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <form
            id={`step-content-${step.id}`}
            className="p-4 pt-0 flex flex-col gap-4 border-t border-border-muted" // pt-0 because header has p-4
            // onSubmit={formMethods.handleSubmit(data => console.log("Form submitted", data))} // RHF handles submission via getValues/onChange
          >
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
                        <div className="flex items-center sm:min-w-[160px] sm:mb-0 mb-1 pr-2">
                          <label htmlFor={inputId} className="block font-medium text-sm">
                            {meta.field.label || meta.field.name}
                          </label>
                          {(meta.helpText || meta.field.helpText) && (
                            <div className="relative inline-block ml-1.5">
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
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 p-2.5 bg-gray-700 text-white text-xs rounded-md shadow-lg z-20 w-max max-w-[280px]" role="tooltip">
                                  {meta.helpText || meta.field.helpText}
                                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-gray-700"></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            {...field}
                            id={inputId}
                            value={typeof field.value === "string" || typeof field.value === "number" ? field.value : ""}
                            type={meta.field.type === "number" ? "number" : "text"}
                            className={`border border-border rounded px-3 py-2 w-full bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition ${fieldState.invalid ? "border-red-500" : ""} ${meta.field.type.toUpperCase() === "NUMBER" ? "text-center" : ""}`}
                            aria-label={meta.field.label || meta.field.name}
                          />
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
                  // This 'append' is RHF's useFieldArray append, aliased for clarity
                  const rhfAppend = append; 
                  let finalIngredientToAdd = { ...newIngredientData }; // newIngredientData comes from StepIngredientTable's +Add button (amount 0)
                  
                  const flourCategoryRule = template.ingredientRules.find(r => r.ingredientCategory.name === FLOUR_CATEGORY_NAME);

                  // Check if the append is for the main flour category defined by FLOUR_CATEGORY_NAME
                  if (flourCategoryRule && newIngredientData.ingredientCategoryId === flourCategoryRule.ingredientCategory.id) {
                    const breadFlourMeta = safeIngredientsMeta.find((m: IngredientMeta) => m.name === BREAD_FLOUR_NAME && m.ingredientCategoryId === flourCategoryRule.ingredientCategory.id);
                    const currentFormIngredients = getValues("ingredients"); // All ingredients in the step form

                    // Filter for flours that are ALREADY in the form for THIS SPECIFIC RULE
                    const existingFloursInThisRule = currentFormIngredients.filter(
                      ing => ing.ingredientCategoryId === flourCategoryRule.ingredientCategory.id
                    );

                    // If this rule currently has NO flours, then the one being added is the first.
                    if (existingFloursInThisRule.length === 0) {
                      if (breadFlourMeta && (newIngredientData.ingredientId === 0 || newIngredientData.ingredientId === breadFlourMeta.id)) {
                        // If Bread Flour meta exists and the user is adding a generic flour or specifically Bread Flour as the first
                        finalIngredientToAdd = {
                          ...newIngredientData, // keeps categoryId, recipeStepId
                          ingredientId: breadFlourMeta.id, // Override/set ingredientId to Bread Flour
                          amount: 100, // Set to 100
                          calculationMode: IngredientCalculationMode.PERCENTAGE, // Ensure mode
                        };
                      } else {
                        // No specific "Bread Flour" preference, or a different flour is explicitly chosen first.
                        // Still, it's the first in the rule, so set its amount to 100%.
                        finalIngredientToAdd = { ...newIngredientData, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE };
                      }
                    }
                    // If there are already flours in this rule, finalIngredientToAdd remains as is (e.g., amount 0),
                    // and the auto-balancing will adjust the existing "first" (now disabled) flour.
                  }
                  rhfAppend(finalIngredientToAdd); // Call the actual RHF append function
                }}
                remove={(idx) => remove(idx)}
                control={control}
                setValue={setValue as UseFormSetValue<StepFormValues>}
                flourCategoryName={FLOUR_CATEGORY_NAME}
                recipeStepId={step.id} // recipeStepId is used by StepIngredientTable
                onFocusNotesRequested={focusNotesField} // Pass the actual focus function
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
                    {...field} // Spread field props first
                    ref={(e) => { // Merge refs
                      field.ref(e); // Call RHF's ref
                      notesTextareaRef.current = e; // Assign to your notes ref
                    }}
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
        )}
      </div>
    </FormProvider>
  );
}
