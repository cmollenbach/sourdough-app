// StepCard.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useEffect, useRef, useState } from "react";
import debounce from 'lodash.debounce';
import { useForm, Controller, useFieldArray, type UseFormSetValue, FormProvider } from "react-hook-form";
import type { RecipeStep, RecipeStepIngredient, RecipeStepField } from "../../types/recipe";
import { IngredientCalculationMode } from "../../types/recipe";
import type { StepTemplate, IngredientMeta, IngredientCategoryMeta } from "../../types/recipeLayout";
import { StepIngredientTable } from "./StepIngredientTable";

export interface StepCardProps {
  step: RecipeStep;
  stepTemplates: StepTemplate[];
  ingredientsMeta: IngredientMeta[] | undefined;
  showAdvanced: boolean;
  ingredientCategoriesMeta: IngredientCategoryMeta[]; // Added
  onChange: (updated: RecipeStep) => void;
  onDuplicate: (step: RecipeStep) => void;
  onRemove: (stepId: number) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEnsureExpanded?: () => void; // New optional prop for ensuring expansion
  isNewlyAdded?: boolean;
  onNewlyAddedStepHandled?: () => void;
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

export type StepFormValues = {
  templateId: number;
  fields: Record<number, string | number>;
  notes?: string | null;
  description?: string | null;
  ingredients: RecipeStepIngredient[];
};

function getFormValuesFromStepData(
  stepData: RecipeStep,
  allTemplates: StepTemplate[],
  allIngredientsMeta: IngredientMeta[]
): StepFormValues {
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
  ingredientCategoriesMeta, // Added
  showAdvanced,
  onChange,
  onDuplicate,
  onRemove,
  dragHandleProps,
  isExpanded,
  onToggleExpand,
  isNewlyAdded,
  onNewlyAddedStepHandled,
  onEnsureExpanded,
}: StepCardProps) {
  const safeIngredientsMeta = useMemo(
    (): IngredientMeta[] =>
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

  // Capture the initial step prop to stabilize defaultValues for useForm
  // This helps prevent formMethods from changing reference unnecessarily
  const [initialStepForForm] = useState(step);

  const formMethods = useForm<StepFormValues>({
    mode: "onChange",
    defaultValues: useMemo(() => {
      return getFormValuesFromStepData(initialStepForForm, memoizedStepTemplates, safeIngredientsMeta);
    }, [initialStepForForm, memoizedStepTemplates, safeIngredientsMeta]) // Depends on initialStepForForm
  });
  const { watch, control, reset, setValue, getValues, formState } = formMethods;

  const selectedTemplateId = Number(watch("templateId"));

  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const focusNotesField = () => {
    notesTextareaRef.current?.focus();
  };
  const templateSelectRef = useRef<HTMLSelectElement>(null);
  const cardRootRef = useRef<HTMLDivElement>(null); // Ref for the root div of the card
  const template = memoizedStepTemplates.find((t) => t.id === selectedTemplateId);
  const newlyAddedFocusAttemptedRef = useRef(false); // Ref to track if focus was attempted for this newly added card

  const { fields: ingredientFields, append, remove: removeIngredient } = useFieldArray({ // Renamed remove to removeIngredient
    control,
    name: "ingredients",
  });

  const FLOUR_CATEGORY_NAME = "Flour";
  const BREAD_FLOUR_NAME = "Bread Flour";

  const stringifiedStepContentFromProps = useMemo(() => JSON.stringify({
    templateId: step.stepTemplateId,
    fields: step.fields,
    notes: step.notes,
    ingredients: step.ingredients,
    description: step.description
  }), [step.stepTemplateId, step.fields, step.ingredients, step.notes, step.description]);

  // console.log(`%cStepCard (step.id: ${step.id}): Render. isNewlyAdded: ${isNewlyAdded}, isExpanded: ${isExpanded}, newlyAddedFocusAttempted: ${newlyAddedFocusAttemptedRef.current}`, "color: dodgerblue; font-weight: bold;");

  const prevStringifiedStepRef = useRef<string | null>(null);

  const isMounted = useRef(false); // Ref to track if component has mounted

  useEffect(() => {
    // Skip this effect on the initial mount because `useForm`'s `defaultValues`
    // (using `initialStepForForm`) already sets the initial form state.
    // `prevStringifiedStepRef.current` will be null on first render.
    if (!isMounted.current) {
      prevStringifiedStepRef.current = stringifiedStepContentFromProps; // Initialize ref for subsequent renders
      isMounted.current = true;
      return;
    }

    const currentPropContent = stringifiedStepContentFromProps;
    if (prevStringifiedStepRef.current !== currentPropContent) {
      // console.groupCollapsed(`%cStepCard (step.id: ${step.id}): Prop content changed. Resetting form. isNewlyAdded: ${isNewlyAdded}, isExpanded: ${isExpanded}`, "color: blueviolet; font-weight: bold;");
      // console.log("Previous stringified content (prevStringifiedStepRef.current):", prevStringifiedStepRef.current);
      // console.log("Current stringified content (currentPropContent):", currentPropContent);
      // console.log("Current step prop object:", step);
      // console.log("Current initialStepForForm object:", initialStepForForm);
      // console.groupEnd();
      const newFormValues = getFormValuesFromStepData(step, memoizedStepTemplates, safeIngredientsMeta);
      reset(newFormValues, { keepDirty: false });
      prevStringifiedStepRef.current = currentPropContent;
    }
  }, [
    step, // Keep `step` as a dependency to re-evaluate if its reference changes
    stringifiedStepContentFromProps,
    reset,
    memoizedStepTemplates,
    safeIngredientsMeta,
    isNewlyAdded, // Added to log its state when this effect runs
  ]); // isMounted.current is a ref, not needed in deps

  // Effect for handling newly added step: auto-expand
  useEffect(() => {
    // console.log(`%cStepCard (step.id: ${step.id}): isNewlyAdded EFFECT. isNewlyAdded: ${isNewlyAdded}, isExpanded: ${isExpanded}`, "color: green; font-weight: bold;");
    if (isNewlyAdded) {
      // console.log(`%cStepCard (step.id: ${step.id}): isNewlyAdded is TRUE. Current isExpanded: ${isExpanded}`, "color: green;");
      if (!isExpanded && onEnsureExpanded) {
        // console.log(`%cStepCard (step.id: ${step.id}): Calling onEnsureExpanded()`, "color: green;");
        onEnsureExpanded();
      } else if (!isExpanded) { 
        // console.log(`%cStepCard (step.id: ${step.id}): Calling onToggleExpand() as fallback for expansion.`, "color: darkgoldenrod;");
        onToggleExpand(); 
      }
    }
  }, [isNewlyAdded, isExpanded, onToggleExpand, onEnsureExpanded, step.id]);

  // Effect to handle focus for newly added and expanded card
  useEffect(() => {
    let parentNotificationTimerId: ReturnType<typeof setTimeout> | undefined;
    let rAFId: number | undefined;

    // console.log(`%cStepCard (step.id: ${step.id}): FOCUS LOGIC. isNewlyAdded: ${isNewlyAdded}, isExpanded: ${isExpanded}, newlyAddedFocusAttempted: ${newlyAddedFocusAttemptedRef.current}`, "color: orange; font-weight: bold;");
    if (isNewlyAdded && isExpanded && templateSelectRef.current && !newlyAddedFocusAttemptedRef.current) {
      // console.log(`%cStepCard (step.id: ${step.id}): Attempting focus on templateSelect.`, "color: orange;");
      
      rAFId = requestAnimationFrame(() => {
        if (templateSelectRef.current) {
          // console.log(`%cStepCard (step.id: ${step.id}): rAF - Focusing:`, "color: orange;", templateSelectRef.current);
          templateSelectRef.current.focus();
          if (document.activeElement !== templateSelectRef.current) {
            console.warn(`%cStepCard (step.id: ${step.id}): Focus attempt FAILED. Active:`, "color: red;", document.activeElement);
          } else {
            console.log(`%cStepCard (step.id: ${step.id}): Focus SUCCEEDED.`, "color: lightgreen; font-weight: bold;");
            newlyAddedFocusAttemptedRef.current = true; 

            // Call onNewlyAddedStepHandled after focus is successful
            if (onNewlyAddedStepHandled) {
              // console.log(`%cStepCard (step.id: ${step.id}): Focus SUCCEEDED - Calling onNewlyAddedStepHandled.`, "color: darkorchid; font-weight: bold;");
              parentNotificationTimerId = setTimeout(() => {
                onNewlyAddedStepHandled();
              }, 50); // Delay to allow browser to process focus
            }
          }
        }
      });
    }

    // Cleanup function for the setTimeout and requestAnimationFrame
    return () => {
      if (rAFId !== undefined) {
        cancelAnimationFrame(rAFId);
      }
      if (parentNotificationTimerId !== undefined) {
        clearTimeout(parentNotificationTimerId);
      }
    };
  }, [isNewlyAdded, isExpanded, onNewlyAddedStepHandled, step.id]);

  const debouncedOnChange = useMemo(() =>
    debounce((dataToSubmit: RecipeStep) => {
      onChange(dataToSubmit);
      // The form will be reset by the useEffect watching the `step` prop if it changes as a result of `onChange`.
      // Removing the immediate reset here to prevent focus loss during typing.
      // The `isDirty` state will persist until the `step` prop change triggers the other reset,
      // or until the user explicitly saves/navigates away (if you implement such logic).
      // prevStringifiedStepRef.current is updated by the other useEffect that handles prop changes.
    }, 100),
    [onChange] 
  );

  useEffect(() => {
    if (formState.isDirty) {
      const currentFormData = getValues();
      const stepId = step.id;
      const stepOrder = step.order;
      const stepRecipeId = step.recipeId;
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
    step,
  ]);

  const visibleFields = (template?.fields || []).filter(
    (f) => showAdvanced || !f.advanced
  );

  const [visibleHelpFieldId, setVisibleHelpFieldId] = useState<number | null>(null);

  if (!template) {
    return <div className="text-red-500 p-4">Step template (ID: {selectedTemplateId}) not found.</div>;
  }

  return (
    <FormProvider {...formMethods}>
      <div ref={cardRootRef} className="bg-surface-elevated rounded-2xl shadow-card mb-6 border border-border max-w-3xl mx-auto">
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
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
                  }}
                  className="cursor-grab text-gray-400 hover:text-gray-600 text-2xl p-1 -ml-1"
                  aria-label="Reorder step">
              ☰
            </span>
            <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="flex-shrink-0">
              <Controller
                name="templateId"
                key={`step-template-select-${step.id}`} // Stable key
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    ref={(e) => {
                      field.ref(e);
                      templateSelectRef.current = e;
                    }}
                    onBlur={() => { // Removed unused _e parameter
                      // Log what has focus when the select loses it
                      // console.log('%cStepCard SELECT ONBLUR - Active Element NOW:', 'color: magenta; font-weight: bold;', document.activeElement);
                      // console.log('%cStepCard SELECT ONBLUR - Focus moved to (relatedTarget):', 'color: magenta;', e.relatedTarget);
                    }}
                    value={field.value}
                    onChange={e => {
                      const newTemplateId = Number(e.target.value);
                      field.onChange(newTemplateId);
                      const newTemplate = memoizedStepTemplates.find(t => t.id === newTemplateId);
                      if (newTemplate) {
                        const defaultNewFields = getDefaultFields(newTemplate);
                        setValue("fields", defaultNewFields, { shouldDirty: true });
                        setValue("ingredients", [], { shouldDirty: true }); // Clear ingredients on template change
                      }
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
            <span className="text-xl select-none" aria-hidden="true">
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>
        </div>

        {isExpanded && (
          <form
            id={`step-content-${step.id}`}
            className="p-4 pt-0 flex flex-col gap-4 border-t border-border-muted"
          >
            <div className="flex flex-col gap-3">
              {visibleFields.map((meta) => {
                const inputId = `step-${step.id}-field-${meta.fieldId}`;
                return (
                  <Controller
                    key={meta.fieldId} // Key for the Controller itself
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

            {template.ingredientRules.length > 0 && (
              <StepIngredientTable
                ingredientRules={template.ingredientRules}
                ingredientsMeta={safeIngredientsMeta}
                ingredientCategoriesMeta={ingredientCategoriesMeta} // Pass down
                ingredientFields={ingredientFields}
                append={(newIngredientData) => {
                  const rhfAppend = append; 
                  let finalIngredientToAdd = { ...newIngredientData };
                  const flourCategoryRule = template.ingredientRules.find(r => r.ingredientCategory.name === FLOUR_CATEGORY_NAME);

                  if (flourCategoryRule && newIngredientData.ingredientCategoryId === flourCategoryRule.ingredientCategory.id) {
                    const breadFlourMeta = safeIngredientsMeta.find((im: IngredientMeta) => im.name === BREAD_FLOUR_NAME && im.ingredientCategoryId === flourCategoryRule.ingredientCategory.id);
                    const currentFormIngredients = getValues("ingredients");
                    const existingFloursInThisRule = currentFormIngredients.filter(
                      ing => ing.ingredientCategoryId === flourCategoryRule.ingredientCategory.id
                    );

                    if (existingFloursInThisRule.length === 0) {
                      if (breadFlourMeta && (newIngredientData.ingredientId === 0 || newIngredientData.ingredientId === breadFlourMeta.id)) {
                        finalIngredientToAdd = {
                          ...newIngredientData,
                          ingredientId: breadFlourMeta.id,
                          amount: 100,
                          calculationMode: IngredientCalculationMode.PERCENTAGE,
                        };
                      } else {
                        finalIngredientToAdd = { ...newIngredientData, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE };
                      }
                    }
                  }
                  rhfAppend(finalIngredientToAdd);
                }}
                remove={(idx) => removeIngredient(idx)} // Use renamed removeIngredient
                control={control}
                setValue={setValue as UseFormSetValue<StepFormValues>}
                flourCategoryName={FLOUR_CATEGORY_NAME}
                recipeStepId={step.id}
                onFocusNotesRequested={focusNotesField}
              />
            )}

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
                    ref={(e) => {
                      field.ref(e);
                      notesTextareaRef.current = e;
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