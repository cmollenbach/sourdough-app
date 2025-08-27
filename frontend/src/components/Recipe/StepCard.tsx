// StepCard.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useEffect, useRef, useState, useCallback } from "react"; // Ensure useCallback is imported
import debounce from 'lodash.debounce';
import { useForm, Controller, useFieldArray, type UseFormSetValue, FormProvider } from "react-hook-form";
import type { RecipeStep, RecipeStepIngredient, RecipeStepField } from "../../types/recipe";
import { IngredientCalculationMode } from "../../types/recipe";
import type { StepTemplate, IngredientMeta, IngredientCategoryMeta } from "../../types/recipeLayout";
import { StepIngredientTable } from "./StepIngredientTable";
import { TimingScheduleDisplay, useAlarmNotifications } from "./TimingSchedule";

export interface StepCardProps {
  step: RecipeStep;
  stepTemplates: StepTemplate[];
  ingredientsMeta: IngredientMeta[] | undefined;
  showAdvanced: boolean;
  ingredientCategoriesMeta: IngredientCategoryMeta[]; // Added
  onChange: (updated: RecipeStep) => void;
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

// FIX: New helper function to compare form state with props, ignoring the 'rhfId'
// and normalizing numbers to prevent floating-point comparison errors.
function areFormValuesEqual(formValues: StepFormValues, propValues: StepFormValues): boolean {
  // Create deep clones to avoid mutating the original objects.
  const formValuesCopy = JSON.parse(JSON.stringify(formValues));
  const propValuesCopy = JSON.parse(JSON.stringify(propValues));

  const normalizeIngredients = (ingredients: any[]) => {
    if (ingredients && Array.isArray(ingredients)) {
      ingredients.forEach((ing: any) => {
        delete ing.rhfId; // Remove RHF internal ID.
        // Round 'amount' to 5 decimal places to avoid floating point inaccuracies.
        if (typeof ing.amount === 'number') {
          ing.amount = parseFloat(ing.amount.toFixed(5));
        }
      });
    }
  };

  // Normalize both sets of ingredients before comparison.
  normalizeIngredients(formValuesCopy.ingredients);
  normalizeIngredients(propValuesCopy.ingredients);

  const isEqual = JSON.stringify(formValuesCopy) === JSON.stringify(propValuesCopy);

  // Keep these logs for now if you continue to see issues.
  if (!isEqual) {
    console.log('%c🔍 areFormValuesEqual: Comparison returned false. Inspecting objects:', 'color: red; font-weight: bold;');
    console.log('%cNormalized Form Values (Object):', 'color: #FF5722;', formValuesCopy);
    console.log('%cNormalized Prop Values (Object):', 'color: #03A9F4;', propValuesCopy);

    // --- START NEW LOGS ---
    // Log the pretty-printed JSON strings to find the exact character difference.
    console.log('%cStringified Form Values (for diffing):', 'color: #FF5722;');
    console.log(JSON.stringify(formValuesCopy, null, 2));
    console.log('%cStringified Prop Values (for diffing):', 'color: #03A9F4;');
    console.log(JSON.stringify(propValuesCopy, null, 2));
    console.info('Hint: Copy the two string blocks above and use a text comparison tool (like VS Code\'s "Compare Selected") to find the difference.');
    // --- END NEW LOGS ---
  }

  return isEqual;
}

// FIX: This function now correctly maps form data back to the RecipeStep type,
// preserving the original IDs for existing fields by referencing the original step.
function mapFormValuesToRecipeStep(
  formData: StepFormValues,
  originalStep: RecipeStep
): RecipeStep {
  return {
    id: originalStep.id,
    recipeId: originalStep.recipeId,
    order: originalStep.order,
    stepTemplateId: formData.templateId,
    notes: formData.notes,
    description: formData.description,
    ingredients: formData.ingredients,
    fields: Object.entries(formData.fields).map(([fieldIdStr, value]) => {
      const fieldId = Number(fieldIdStr);
      const originalField = originalStep.fields.find(f => f.fieldId === fieldId);
      return {
        id: originalField ? originalField.id : 0,
        recipeStepId: originalStep.id,
        fieldId: fieldId,
        value: value,
      };
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
    () => {
      // Define logical baking process order
      const processOrder: { [key: string]: number } = {
        'Preferment': 1,
        'Autolyse': 2,
        'Final Mix': 3,
        'Add Enrichments': 4,
        'Bulk Ferment': 5,
        // Note: 'Stretch & Fold' is omitted as it's integrated into Bulk Ferment
        'Lamination': 6,
        'Shape': 7,
        'Final Proof': 8,
        'Bake': 9,
        'Rest': 10
      };

      return stepTemplates
        .filter(template => {
          // Hide advanced templates when showAdvanced is false
          if (template.advanced && !showAdvanced) {
            return false;
          }
          // Hide the separate "Stretch & Fold" template since S&F is integrated into Bulk Ferment
          if (template.name === 'Stretch & Fold') {
            return false;
          }
          return true;
        })
        .sort((a, b) => {
          // First sort by logical process order
          const orderA = processOrder[a.name] || 999;
          const orderB = processOrder[b.name] || 999;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          
          // Then by template order field (for templates with same process step)
          if (a.order !== b.order) {
            return (a.order || 999) - (b.order || 999);
          }
          
          // Finally by name for consistency
          return a.name.localeCompare(b.name);
        });
    },
    [stepTemplates, showAdvanced]
  );

  // FIX: Define stringifiedStepContentFromProps to track relevant prop changes for synchronization.
  const stringifiedStepContentFromProps = useMemo(() => {
    // Selectively stringify only the parts of the step that are managed by the form.
    // This prevents unnecessary re-syncs from parent state changes unrelated to this form.
    return JSON.stringify({
      stepTemplateId: step.stepTemplateId,
      fields: step.fields,
      notes: step.notes,
      description: step.description,
      ingredients: step.ingredients,
    });
  }, [step]);

  // Capture the initial step prop to stabilize defaultValues for useForm
  // This helps prevent formMethods from changing reference unnecessarily
  const [initialStepForForm] = useState(step);

  const formMethods = useForm<StepFormValues>({
    mode: "onChange",
    defaultValues: useMemo(() => {
      const formValues = getFormValuesFromStepData(initialStepForForm, memoizedStepTemplates, safeIngredientsMeta);
      // FIX: Ensure the initial form values are mutable to prevent errors when react-hook-form
      // tries to update its internal state, which was seeded with read-only data from Zustand.
      return JSON.parse(JSON.stringify(formValues));
    }, [initialStepForForm, memoizedStepTemplates, safeIngredientsMeta]) // Depends on initialStepForForm
  });
  // FIX: Destructure formState directly to make it available in the component scope.
  const { watch, control, reset, setValue, getValues, formState } = formMethods;

  const selectedTemplateId = Number(watch("templateId"));

  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const focusNotesField = () => {
    notesTextareaRef.current?.focus();
  };
  const templateSelectRef = useRef<HTMLSelectElement>(null);
  const cardRootRef = useRef<HTMLDivElement>(null); // Ref for the root div of the card
  const template = memoizedStepTemplates.find((t) => t.id === selectedTemplateId);
  
  // Handle S&F method when switching between standard/advanced modes
  useEffect(() => {
    const currentFormValues = getValues();
    const currentSFMethod = currentFormValues?.fields ? Object.entries(currentFormValues.fields).find(([fieldId, value]) => {
      const fieldMeta = template?.fields.find(f => f.fieldId === parseInt(fieldId));
      return fieldMeta?.field.name === 'S&F Method';
    })?.[1] : null;
    
    // If user exits advanced mode while having "Custom" selected, reset to "Basic"
    if (!showAdvanced && currentSFMethod === 'Custom') {
      const sfMethodFieldId = template?.fields.find(f => f.field.name === 'S&F Method')?.fieldId;
      if (sfMethodFieldId && currentFormValues.fields && sfMethodFieldId in currentFormValues.fields) {
        setValue(`fields.${sfMethodFieldId}` as any, 'Basic', { shouldDirty: true });
      }
    }
  }, [showAdvanced, setValue, getValues, template]);
  
  const newlyAddedFocusAttemptedRef = useRef(false); // Ref to track if focus was attempted for this newly added card

  // FIX: This block replaces the previous debouncing logic to prevent stale closures.
  // By using a ref, the debounced function can always access the latest props.
  const latestPropsRef = useRef({ step, onChange });
  useEffect(() => {
    latestPropsRef.current = { step, onChange };
  });

  const debouncedOnChange = useMemo(() => {
    return debounce((formData: StepFormValues) => {
      const { step: currentStep, onChange: currentOnChange } = latestPropsRef.current;
      const updatedStep = mapFormValuesToRecipeStep(formData, currentStep);
      currentOnChange(updatedStep);
    }, 500);
  }, []); // Empty dependency array ensures this is created only once.

  useEffect(() => {
    const subscription = watch((value) => {
      if (formState.isDirty) {
        debouncedOnChange(value as StepFormValues);
      }
    });
    return () => {
      subscription.unsubscribe();
      debouncedOnChange.cancel();
    };
  }, [watch, formState, debouncedOnChange]);

  const onIngredientBlur = useCallback(() => {
    debouncedOnChange.cancel();
  }, [debouncedOnChange]);


  // FIX: Rename 'append' to 'rhfAppend' to avoid scope conflicts when passing the append function as a prop.
  const { fields: ingredientFields, append: rhfAppend, remove: removeIngredient, update: updateIngredient } = useFieldArray({
    control,
    name: "ingredients",
    keyName: "rhfId", // Use 'rhfId' to avoid conflict with the ingredient's own 'id' property.
  });

  // FIX: Define missing constants.
  const FLOUR_CATEGORY_NAME = "Flour";
  const BREAD_FLOUR_NAME = "Bread Flour";

  // This useEffect handles synchronizing the form state with the global state (props)
  // It's crucial for updates that happen outside the form, like auto-balancing.
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
      const newFormValuesFromProps = getFormValuesFromStepData(step, memoizedStepTemplates, safeIngredientsMeta);
      const currentFormValues = getValues();

      // Check if form state matches props (ignoring React Hook Form's rhfId)
      if (areFormValuesEqual(currentFormValues, newFormValuesFromProps)) {
        prevStringifiedStepRef.current = currentPropContent;
        return; // Skip reset - form is already in sync
      }

      // Reset form with new prop values
      const mutableFormValues = JSON.parse(JSON.stringify(newFormValuesFromProps));
      reset(mutableFormValues, { keepDirty: false });
      prevStringifiedStepRef.current = currentPropContent;
    }
  }, [
    step, // This dependency ensures the effect runs when the step data changes
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

  // Get current form values to check S&F Method
  const formValues = watch();
  const sfMethodValue = formValues?.fields ? Object.entries(formValues.fields).find(([fieldId, value]) => {
    const fieldMeta = template?.fields.find(f => f.fieldId === parseInt(fieldId));
    return fieldMeta?.field.name === 'S&F Method';
  })?.[1] : null;

  const visibleFields = (template?.fields || []).filter((f) => {
    // First apply the standard advanced field filtering
    if (f.advanced && !showAdvanced) {
      return false;
    }
    
    // Apply S&F conditional visibility with ultra-simplified custom mode
    const sfCustomFields = ['First Fold After (minutes)', 'Interval Between Folds (minutes)', 'Custom Fold Schedule', 'Timing Plan', 'Fold Strength'];
    
    // Hide all S&F fields when method is "None" or empty
    if (sfCustomFields.includes(f.field.name)) {
      if (!sfMethodValue || sfMethodValue === 'None') {
        return false;
      }
      
      // Basic mode: No additional inputs needed (predefined schedule)
      if (sfMethodValue === 'Basic') {
        return false;
      }
      
      // Custom mode: Only show the Timing Plan field (remove redundant timing fields)
      if (sfMethodValue === 'Custom') {
        // Only show Timing Plan, hide the redundant timing fields
        if (['First Fold After (minutes)', 'Interval Between Folds (minutes)', 'Custom Fold Schedule', 'Fold Strength'].includes(f.field.name)) {
          return false;
        }
        // Custom mode only available in advanced mode
        if (!showAdvanced) {
          return false;
        }
      }
    }
    
    return true;
  });

  const [visibleHelpFieldId, setVisibleHelpFieldId] = useState<number | null>(null);
  const { scheduleNotification } = useAlarmNotifications();

  // Get the current timing plan value for display - includes both custom plans and generated basic plans
  const currentTimingPlan = useMemo(() => {
    if (!formValues?.fields) return '';
    
    // First check for explicit timing plan
    const explicitPlan = Object.entries(formValues.fields).find(([fieldId, value]) => {
      const fieldMeta = template?.fields.find(f => f.fieldId === parseInt(fieldId));
      return fieldMeta?.field.name === 'Timing Plan' || fieldMeta?.field.name === 'Custom Fold Schedule';
    })?.[1] as string;
    
    if (explicitPlan && explicitPlan.trim()) {
      return explicitPlan;
    }
    
    // Generate timing plan for basic S&F method
    const sfMethodEntry = Object.entries(formValues.fields).find(([fieldId, value]) => {
      const fieldMeta = template?.fields.find(f => f.fieldId === parseInt(fieldId));
      return fieldMeta?.field.name === 'S&F Method';
    });
    
    if (sfMethodEntry?.[1] === 'Basic') {
      return 'S&F at 30, 60, 90, 120 minutes (Basic - 4 folds every 30 minutes)';
    }
    
    return '';
  }, [formValues?.fields, template?.fields]);

  // Check if this is a bulk fermentation step that should show timing
  const shouldShowTiming = template && (
    template.name?.toLowerCase().includes('bulk') || 
    template.name?.toLowerCase().includes('ferment')
  );

  if (!template) {
    return <div className="text-red-500 p-4">Step template (ID: {selectedTemplateId}) not found.</div>;
  }

  return (
    <FormProvider {...formMethods}>
      <div className={`step-card bg-surface-container rounded-lg shadow-md mb-4 transition-all duration-300 ease-in-out ${isExpanded ? 'is-expanded' : ''}`}>
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
          
          {/* Show timing preview in collapsed state for bulk fermentation steps */}
          {!isExpanded && currentTimingPlan && currentTimingPlan.trim() && shouldShowTiming && (
            <div className="flex-1 min-w-0 px-2">
              <div className="text-xs text-text-secondary truncate">
                <span className="inline-flex items-center gap-1">
                  <span>⏰</span>
                  <span>{currentTimingPlan.length > 50 ? `${currentTimingPlan.substring(0, 50)}...` : currentTimingPlan}</span>
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
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
                          {meta.field.name === 'S&F Method' ? (
                            // Special dropdown for S&F Method
                            <select
                              {...field}
                              id={inputId}
                              value={field.value || 'None'}
                              className={`border border-border rounded px-3 py-2 w-full bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition ${fieldState.invalid ? "border-red-500" : ""}`}
                              aria-label={meta.field.label || meta.field.name}
                            >
                              <option value="None">None - Just bulk ferment</option>
                              <option value="Basic">Basic - 4 folds every 30 minutes</option>
                              {showAdvanced && (
                                <option value="Custom">Custom - Describe your schedule</option>
                              )}
                            </select>
                          ) : (meta.field.name === 'Custom Fold Schedule' || meta.field.name === 'Timing Plan') ? (
                            // Enhanced text area for comprehensive planning (timeline will show during active bake)
                            <textarea
                              {...field}
                              id={inputId}
                              value={field.value || ""}
                              rows={4}
                              className={`border border-border rounded px-3 py-2 w-full bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition ${fieldState.invalid ? "border-red-500" : ""}`}
                              placeholder="Describe your complete timing plan...

Examples:
• S&F at 30, 60, 90, 120 minutes
• Folds every 45min for 3hrs, then rest
• Weekend schedule: Friday mix, Saturday bake
• Start 8am: bulk 4hrs with hourly folds

Note: Timeline and alarms will be created when you start baking!"
                              aria-label={meta.field.label || meta.field.name}
                            />
                          ) : (
                            // Regular input for other fields
                            <input
                              {...field}
                              id={inputId}
                              value={typeof field.value === "string" || typeof field.value === "number" ? field.value : ""}
                              type={meta.field.type === "number" ? "number" : "text"}
                              className={`border border-border rounded px-3 py-2 w-full bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition ${fieldState.invalid ? "border-red-500" : ""} ${meta.field.type.toUpperCase() === "NUMBER" ? "text-center" : ""}`}
                              aria-label={meta.field.label || meta.field.name}
                            />
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

            {/* Show timing schedule preview for bulk fermentation steps with timing plans */}
            {currentTimingPlan && currentTimingPlan.trim() && shouldShowTiming && (
              <div className="mt-4 mb-2">
                <h4 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                  <span>⏰</span>
                  Stretch & Fold Schedule
                </h4>
                <TimingScheduleDisplay 
                  timingPlan={currentTimingPlan} 
                  onSetAlarm={(event, time) => {
                    scheduleNotification(event, time);
                  }}
                />
              </div>
            )}            {template.ingredientRules.length > 0 && (
              <StepIngredientTable
                ingredientsMeta={safeIngredientsMeta}
                ingredientCategoriesMeta={ingredientCategoriesMeta} // Pass down
                showAdvanced={showAdvanced} // Pass advanced toggle
                stepRole={template?.role} // Pass step role for contextual filtering
                ingredientFields={ingredientFields} // Pass the fields from useFieldArray
                // FIX: The function passed to the 'append' prop must call 'rhfAppend' from useFieldArray.
                append={(newIngredientData: Partial<RecipeStepIngredient>) => {
                  const currentFormIngredients = getValues("ingredients") || [];
                  const flourCategoryRule = template.ingredientRules.find(
                    (r) => r.ingredientCategory.name === FLOUR_CATEGORY_NAME
                  );
                  // FIX: Use the 'safeIngredientsMeta' variable to prevent errors when 'ingredientsMeta' is undefined.
                  const breadFlourMeta = safeIngredientsMeta.find(
                    (ing) => ing.name === BREAD_FLOUR_NAME
                  );

                  let finalIngredientToAdd: Partial<RecipeStepIngredient> = {
                    ...newIngredientData,
                    amount: 0,
                    calculationMode: IngredientCalculationMode.PERCENTAGE,
                    // FIX: Explicitly set ingredientId to 0 for new ingredients if not provided.
                    // This prevents a mismatch between the form state (where it would be undefined)
                    // and the prop state, which expects a number (0 for new).
                    ingredientId: newIngredientData.ingredientId || 0,
                  };

                  if (flourCategoryRule && finalIngredientToAdd.ingredientCategoryId === flourCategoryRule.ingredientCategory.id) {
                    const existingFloursInThisRule = currentFormIngredients.filter(
                      (ing) => ing.ingredientCategoryId === flourCategoryRule.ingredientCategory.id
                    );

                    if (existingFloursInThisRule.length === 0) {
                      if (breadFlourMeta && (finalIngredientToAdd.ingredientId === 0 || !finalIngredientToAdd.ingredientId)) {
                        finalIngredientToAdd = {
                          ...finalIngredientToAdd,
                          ingredientId: breadFlourMeta.id,
                          amount: 100,
                          calculationMode: IngredientCalculationMode.PERCENTAGE,
                        };
                      } else {
                        finalIngredientToAdd = { ...finalIngredientToAdd, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE };
                      }
                    }
                  }
                  // Deep clone the object before appending to break any potential links
                  // to read-only state that could "poison" react-hook-form's internal state.
                  rhfAppend(JSON.parse(JSON.stringify(finalIngredientToAdd)));
                }}
                remove={(idx: number) => removeIngredient(idx)} // Use renamed removeIngredient
                update={updateIngredient} // Pass update function down
                control={control}
                setValue={setValue as UseFormSetValue<StepFormValues>}
                flourCategoryName={FLOUR_CATEGORY_NAME}
                recipeStepId={step.id}
                onFocusNotesRequested={focusNotesField}
                onIngredientBlur={onIngredientBlur} // FIX: Pass the stable callback.
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