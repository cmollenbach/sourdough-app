import { useState, useEffect, useRef, useMemo } from 'react';
import type { BakeStep } from '@sourdough/shared'; 

import { useBakeStore } from '../../store/useBakeStore';
import { useToast } from '../../context/ToastContext'; // Assuming this is the correct path
import Spinner from '../Shared/Spinner';
import { TimingScheduleDisplay, useAlarmNotifications } from '../Recipe/TimingSchedule';
import type { CalculatedStepColumn, FlourComponent, OtherIngredientDisplay } from '../../hooks/useRecipeCalculations'; // Import calculation types

interface BakeStepCardProps {
  step: BakeStep;
  bakeId: number;
  isActiveBake: boolean; // To enable/disable actions based on overall bake status
  isInitiallyExpanded: boolean; // To control initial expansion
  stepCalculations?: CalculatedStepColumn; // New prop for calculated ingredient weights
}

export default function BakeStepCard({ 
  step, 
  bakeId, 
  isActiveBake, 
  isInitiallyExpanded,
  stepCalculations 
}: BakeStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [isCompleting, setIsCompleting] = useState(false); // For "Record Actual Values" form

  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const deviationsTextareaRef = useRef<HTMLTextAreaElement>(null);

  // State to hold actual values. Initialize from plannedValue or empty.
  // Key is parameterId, value is the actual input string.
  const [actualValuesInput, setActualValuesInput] = useState<Record<number, string>>({});
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableNotes, setEditableNotes] = useState(step.notes || '');
  const [isEditingDeviations, setIsEditingDeviations] = useState(false);
  // Local loading states for inline edits
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSavingDeviations, setIsSavingDeviations] = useState(false);
  const [editableDeviations, setEditableDeviations] = useState(
    step.deviations ? JSON.stringify(step.deviations, null, 2) : ''
  );
  useEffect(() => {
    if (isCompleting && step.parameterValues.length > 0) {
      // Attempt to focus the first input in the "Record Actual Values" form
      // Use a timeout to ensure the element is rendered and visible, especially after state changes.
      const timer = setTimeout(() => {
        const formElement = document.getElementById(`record-actuals-form-${step.id}`);
        const firstFocusable = formElement?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
        );
        firstFocusable?.focus();
      }, 100); // Small delay
      return () => clearTimeout(timer);
    }
  }, [isCompleting, step.id, step.parameterValues]);

  useEffect(() => {
    setIsExpanded(isInitiallyExpanded);
  }, [isInitiallyExpanded]);

  // Auto-focus notes textarea when editing starts
  useEffect(() => {
    if (isEditingNotes) {
      const timer = setTimeout(() => {
        notesTextareaRef.current?.focus();
      }, 100); // Small delay to ensure element is rendered
      return () => clearTimeout(timer);
    }
  }, [isEditingNotes]);

  // Auto-focus deviations textarea when editing starts
  useEffect(() => {
    if (isEditingDeviations) {
      const timer = setTimeout(() => {
        deviationsTextareaRef.current?.focus();
      }, 100); // Small delay to ensure element is rendered
      return () => clearTimeout(timer);
    }
  }, [isEditingDeviations]);


  const { currentBake, startStep, completeStep, skipStep, updateStepNote, updateStepDeviations, isLoading: isStoreLoading } = useBakeStore();
  const { showToast } = useToast();

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleStartStep = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card from toggling
    if (!isStoreLoading) {
      const updatedStep = await startStep(bakeId, step.id);
      if (updatedStep) {
        showToast(`Step "${updatedStep.recipeStep?.stepTemplate?.name || 'Step'}" started.`, { type: 'success' });
        if (!isExpanded) setIsExpanded(true); // Expand if not already
      }
      // Error is handled by the store and displayed on BakeDetailPage
    }
  };

  // Helper function to determine the initial string value for an input field based on parameter type and planned value
  const getInitialInputValueForParameter = (plannedValue: unknown, parameterType: string): string => {
    let initialVal = '';
    if (parameterType === 'BOOLEAN') {
      initialVal = plannedValue === true ? 'true' : 'false';
    } else if (parameterType === 'DATE' && typeof plannedValue === 'string') {
      // For datetime-local, format needs to be YYYY-MM-DDTHH:mm
      try {
        const d = new Date(plannedValue);
        if (!isNaN(d.getTime())) {
          initialVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      } catch (e) { console.warn("Error formatting planned DATE value for pre-fill:", plannedValue, e); }
    } else {
      if (typeof plannedValue === 'string' || typeof plannedValue === 'number') {
        initialVal = String(plannedValue);
      } else if (plannedValue !== null && plannedValue !== undefined) {
        try {
          initialVal = JSON.stringify(plannedValue);
        } catch (e) { 
          console.warn("Error stringifying plannedValue for pre-fill:", plannedValue, e);
          // leave empty or set a default placeholder
        }
      }
    }
    return initialVal;
  };

  const handlePrepareComplete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card from toggling if it was already expanded
    const initialInputs: Record<number, string> = {};
    step.parameterValues.forEach(pv => initialInputs[pv.parameterId] = getInitialInputValueForParameter(pv.plannedValue, pv.parameter.type));
    setActualValuesInput(initialInputs);
    setIsCompleting(true);
    if (!isExpanded) { // If the card is collapsed
      setIsExpanded(true); // Expand it so the form is visible
    }
  };

  const handleCompleteStep = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isStoreLoading) {
      const payloadActualValues: { [parameterId: number]: unknown } = {};
      let hasError = false; // Flag to prevent submission if parsing fails critically

      for (const paramIdStr in actualValuesInput) {
        const paramId = Number(paramIdStr);
        const paramDefinition = step.parameterValues.find(p => p.parameterId === paramId)?.parameter;
        const rawValue = actualValuesInput[paramId];

        if (!paramDefinition) {
          console.warn(`Parameter definition not found for ID: ${paramId}. Skipping.`);
          continue;
        }

        try {
          switch (paramDefinition.type) {
            case 'BOOLEAN':
              payloadActualValues[paramId] = rawValue === 'true';
              break;
            case 'NUMBER': {
                if (rawValue.trim() === '') {
                  showToast(`Value for ${paramDefinition.name} cannot be empty.`, { type: 'error' });
                  hasError = true;
                } else {
                  const numValue = parseFloat(rawValue);
                  if (isNaN(numValue)) {
                    showToast(`Invalid number for ${paramDefinition.name}: ${rawValue}`, { type: 'error' });
                    hasError = true;
                  } else {
                    payloadActualValues[paramId] = numValue;
                  }
                }
                break;
              }
            case 'JSON':
              payloadActualValues[paramId] = JSON.parse(rawValue); // Let it throw if invalid JSON
              break;
            case 'DATE': {
                const dateObj = new Date(rawValue);
                if (isNaN(dateObj.getTime())) {
                   showToast(`Invalid date format for ${paramDefinition.name}: ${rawValue}`, { type: 'error' });
                   hasError = true;
                } else {
                  payloadActualValues[paramId] = dateObj.toISOString(); // Backend might expect ISO 8601 string
                }
                break;
              }
            default: { // STRING, DURATION, or other types
                try {
                  payloadActualValues[paramId] = JSON.parse(rawValue);
                } catch {
                  payloadActualValues[paramId] = rawValue; // Fallback to raw string
                }
                break;
              }
          }
        } catch (parseError) {
          showToast(`Error processing value for ${paramDefinition.name}: ${ (parseError as Error).message }`, { type: 'error' });
          hasError = true;
          console.warn(`Error parsing value for param ${paramDefinition.name} (type: ${paramDefinition.type}):`, rawValue, parseError);
        }

        if (hasError) break; // Stop processing further parameters if one fails
      }

      if (hasError) {
        return; // Prevent submission
      }

      const updatedStep = await completeStep(bakeId, step.id, { actualParameterValues: payloadActualValues });
      if (updatedStep) {
        showToast(`Step "${updatedStep.recipeStep?.stepTemplate?.name || 'Step'}" completed.`, { type: 'success' });
        setIsCompleting(false); // Close the form
      } else {
        // Error might be handled by useBakeStore, but a toast here can be a fallback.
        // addToast({ type: 'error', message: 'Failed to complete step. Check console for details.' });
      }
    }
  };

  const handleSkipStep = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card from toggling
    if (!isStoreLoading) {
      const updatedStep = await skipStep(bakeId, step.id);
      if (updatedStep) showToast(`Step "${updatedStep.recipeStep?.stepTemplate?.name || 'Step'}" skipped.`, { type: 'success' });
      // Error handled by store
    }
  };

  const handleActualValueChange = (parameterId: number, value: string | boolean, type: string) => {
    if (type === 'BOOLEAN') {
      setActualValuesInput(prev => ({ ...prev, [parameterId]: String(value) }));
    } else {
      setActualValuesInput(prev => ({ ...prev, [parameterId]: value as string }));
    }
  };

  const handleEditNotes = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditableNotes(step.notes || ''); // Reset to current notes when starting edit
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isStoreLoading && !isSavingNotes) {
      setIsSavingNotes(true);
      const updatedStep = await updateStepNote(bakeId, step.id, editableNotes);
      if (updatedStep) {
        showToast('Notes saved successfully.', { type: 'success' });
        setIsEditingNotes(false);
      } else {
        showToast('Failed to save notes.', { type: 'error' });
      }
      setIsSavingNotes(false);
    }
  };



  const handleEditDeviations = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditableDeviations(step.deviations ? JSON.stringify(step.deviations, null, 2) : '');
    setIsEditingDeviations(true);
  };

  const handleSaveDeviations = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isStoreLoading || isSavingDeviations) return; // Prevent multiple submissions

    setIsSavingDeviations(true);
    try {
      let deviationsToSave: unknown = null;
      if (editableDeviations.trim() !== "") { // Only parse if not empty
        try {
          deviationsToSave = JSON.parse(editableDeviations);
        } catch (parseError) {
          const errMessage = "Deviations are not valid JSON.";
          console.error("Error parsing deviations JSON:", parseError);
          showToast(errMessage, { type: 'error' });
          // No need to setIsSavingDeviations(false) here, finally will handle it
          return; // Exit if parsing fails
        }
      }
      // If parsing was successful or string was empty (deviationsToSave remains null)
      const updatedStep = await updateStepDeviations(bakeId, step.id, deviationsToSave);
      if (updatedStep) {
        showToast('Deviations saved successfully.', { type: 'success' });
        setIsEditingDeviations(false);
      } else {
        // This else block might be hit if updateStepDeviations returns null/undefined without throwing
        showToast('Failed to save deviations.', { type: 'error' });
      }
    } catch (apiError) { // Catch errors from updateStepDeviations itself or other unexpected errors in the try block
        showToast('An unexpected error occurred while saving deviations.', { type: 'error' });
        console.error("API error saving deviations:", apiError);
    } finally {
      setIsSavingDeviations(false);
    }
  };

  // Determine if this specific step is the one that can be started next
  const isTheDesignatedNextPendingStep = useMemo(() => {
    if (!currentBake || !isActiveBake || step.status !== 'PENDING') {
      return false;
    }

    const sortedSteps = currentBake.steps?.slice().sort((a, b) => a.order - b.order);
    if (!sortedSteps || sortedSteps.length === 0) {
      return false;
    }

    // Check if any step is IN_PROGRESS. If so, no PENDING step can be started.
    const inProgressStepExists = sortedSteps.some(s => s.status === 'IN_PROGRESS');
    if (inProgressStepExists) {
      return false;
    }

    // If no step is IN_PROGRESS, find the first PENDING step. Only this step can be started.
    const firstPendingStep = sortedSteps.find(s => s.status === 'PENDING');
    return firstPendingStep?.id === step.id;
  }, [currentBake, isActiveBake, step.id, step.status]);

  const canStart = isTheDesignatedNextPendingStep;
  const canComplete = isActiveBake && step.status === 'IN_PROGRESS';
  const canSkip = isActiveBake && (step.status === 'PENDING' || step.status === 'IN_PROGRESS');

  // Helper to format parameter display values
  const formatParameterDisplayValue = (value: unknown, type: string): string => {
    if (value === null || value === undefined) {
      return '(not set)';
    }
    if (type === 'DATE' && typeof value === 'string') {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          // Adjust options as needed for your preferred date/time format
          return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
      } catch { /* Fall through */ }
    }
    if (type === 'BOOLEAN') {
      return value ? 'Yes' : 'No';
    }
    // For other types or if DATE parsing failed
    try {
      // For numbers, directly convert to string. For objects/arrays, stringify.
      if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
          return String(value);
      }
      return JSON.stringify(value);
    } catch (stringifyError) {
      console.warn(`Error stringifying ${type} value:`, value, stringifyError);
      return '(error displaying value)';
    }
  };

  const isLiveStep = step.status === 'IN_PROGRESS';

  // Check if this is a bulk fermentation step that should show timing
  const shouldShowTiming = step.recipeStep?.stepTemplate && (
    step.recipeStep.stepTemplate.name?.toLowerCase().includes('bulk') || 
    step.recipeStep.stepTemplate.name?.toLowerCase().includes('ferment')
  );

  // Generate timing plan for bulk fermentation steps during active baking
  const timingPlan = useMemo(() => {
    if (!shouldShowTiming || !isActiveBake) return '';
    
    // Look for timing plan in step description 
    const description = step.recipeStep?.description || '';
    
    // If there's already a timing plan in the description, use it
    if (description.match(/\d+\s*(min|minutes|hour|hours|h|m)/i)) {
      return description;
    }
    
    // Generate a basic S&F schedule for bulk fermentation if none exists
    return "S&F at 30, 60, 90, 120 minutes";
  }, [shouldShowTiming, isActiveBake, step.recipeStep?.description]);

  const containerClasses = [
    'bg-surface-elevated rounded-2xl shadow-card mb-6 w-full max-w-3xl mx-auto border transition-all duration-300',
    isLiveStep 
      ? 'border-primary-500 border-2 shadow-lg shadow-primary-500/20' // Prominent highlight for the live step
      : 'border-border' // Standard border for all other steps
  ].join(' ');

  return (
    <div className={containerClasses}>
      {/* Clickable Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer transition-colors hover:bg-surface-subtle"
        onClick={toggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpand(); }}
        aria-expanded={isExpanded}
        aria-controls={`bakestep-content-${step.id}`}
        aria-label={`Step ${step.order}: ${step.recipeStep?.stepTemplate?.name || step.recipeStep?.name || 'Unnamed Step'}, ${isExpanded ? 'expanded, click to collapse' : 'collapsed, click to expand'}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-text-primary">
            {step.order}. {step.recipeStep?.stepTemplate?.name || step.recipeStep?.name || 'Unnamed Step'}
          </h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            step.status === 'COMPLETED' ? 'bg-success-100 text-success-800' :
            step.status === 'IN_PROGRESS' ? 'bg-primary-100 text-primary-800' :
            step.status === 'SKIPPED' ? 'bg-secondary-200 text-secondary-700' :
            'bg-secondary-100 text-secondary-600'
          }`}>
            {step.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canStart && (
            <button
              onClick={handleStartStep}
              disabled={isStoreLoading}
              className="btn-primary"
              aria-label={`Start step ${step.order}: ${step.recipeStep?.stepTemplate?.name || step.recipeStep?.name || 'Unnamed Step'}`}
            >
              Start
            </button>
          )}
          {canComplete && !isCompleting && (
            <button
              onClick={handlePrepareComplete}
              disabled={isStoreLoading}
              className="btn-success"
              aria-label={`Record and complete step ${step.order}: ${step.recipeStep?.stepTemplate?.name || step.recipeStep?.name || 'Unnamed Step'}`}
            >
              Record & Complete
            </button>
          )}
          {canSkip && (
            <button
              onClick={handleSkipStep}
              disabled={isStoreLoading}
              className="btn-secondary"
              aria-label={`Skip step ${step.order}: ${step.recipeStep?.stepTemplate?.name || step.recipeStep?.name || 'Unnamed Step'}`}
            >
              Skip
            </button>
          )}
          <span className="text-xl select-none text-text-secondary" aria-hidden="true">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div
          id={`bakestep-content-${step.id}`}
          className="flex flex-col gap-4 border-t border-border-subtle p-4 pt-0"
        >
          {step.recipeStep?.description && <p className="text-sm text-text-secondary">{step.recipeStep.description}</p>}

          {/* Timing Schedule Display for bulk fermentation steps during active baking */}
          {shouldShowTiming && timingPlan && (
            <TimingScheduleDisplay 
              timingPlan={timingPlan}
              initialStartTime={step.startTimestamp ? new Date(step.startTimestamp) : undefined}
              isActive={step.status === 'IN_PROGRESS'}
            />
          )}

          {/* Ingredients Section */}
          {stepCalculations ? (
            <div>
              <h4 className="text-md font-semibold text-text-primary mb-3 mt-3">Ingredients for this step:</h4>
              <div className="space-y-1.5 text-sm text-text-secondary pl-1"> {/* Reduced space-y, adjusted pl */}
                {stepCalculations.flourComponents.length > 0 && (
                  <div>
                    <p className="font-medium text-text-primary mb-0.5">Flours:</p>
                    <ul className="pl-3 space-y-0.5"> {/* Indent list items slightly */}
                      {stepCalculations.flourComponents.map((flour: FlourComponent) => (
                        <li key={flour.ingredientId} className="flex justify-between items-center">
                          <span>{flour.name}</span>
                          <span>{flour.weight.toFixed(0)}g</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {stepCalculations.genericFlourWeight > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-text-primary">Generic Flour:</span>
                    <span>{stepCalculations.genericFlourWeight.toFixed(1)}g</span>
                  </div>
                )}
                {stepCalculations.waterWeight > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-text-primary">Water:</span>
                    <span>{stepCalculations.waterWeight.toFixed(1)}g</span>
                  </div>
                )}
                {stepCalculations.saltWeight > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-text-primary">Salt:</span>
                    <span>{stepCalculations.saltWeight.toFixed(1)}g</span>
                  </div>
                )}
                {stepCalculations.otherIngredients.length > 0 && (
                  <div>
                    <p className="font-medium text-text-primary mb-0.5 mt-1">Other Ingredients:</p>
                    <ul className="pl-3 space-y-0.5"> {/* Indent list items slightly */}
                      {stepCalculations.otherIngredients.map((otherIng: OtherIngredientDisplay) => (
                        <li key={otherIng.ingredientId} className="flex justify-between items-center">
                          <span>{otherIng.name}</span>
                          <span>{otherIng.amount.toFixed(1)}g</span>
                          {/* Optional: Display original mode if needed: (Mode: {otherIng.calculationMode}) */}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Total Weight for the Step */}
                <div className="pt-2 mt-3 border-t border-border-subtle flex justify-between items-center">
                  <span className="font-semibold text-text-primary">
                    Total weight for this step:
                  </span>
                  <span className="font-bold text-text-primary">
                    {stepCalculations.totalWeight.toFixed(1)}g
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-text-tertiary italic">Calculating ingredient weights...</p>
            </div>
          )}


          {/* Parameters Section */}
          {step.parameterValues && step.parameterValues.length > 0 && (
            <div className="mt-3">
              <h4 className="text-md font-semibold text-text-primary mb-2">Parameters:</h4>
              <div className="space-y-1.5 text-sm text-text-secondary pl-1">
                {step.parameterValues.map(pv => {
                  const valueToDisplay = pv.actualValue !== null && pv.actualValue !== undefined 
                    ? pv.actualValue 
                    : pv.plannedValue;
                  const valuePrefix = pv.actualValue !== null && pv.actualValue !== undefined 
                    ? "Actual: " 
                    : "Planned: ";
                  const formattedValueString = formatParameterDisplayValue(valueToDisplay, pv.parameter.type);
                  return (
                    <div key={pv.id} className="flex justify-between items-center">
                      <span className="text-text-primary">{pv.parameter.name}:</span>
                      <span>{valuePrefix}{formattedValueString}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Record Actual Values Form */}
          {isCompleting && (
            <div id={`record-actuals-form-${step.id}`} className="my-2 p-4 border border-primary-300 rounded-md bg-surface">
              <h4 className="text-md font-semibold text-text-primary mb-3">Record Actual Values:</h4>
              {step.parameterValues.map(pv => (
                <div key={pv.parameterId} className="mb-3">
                  <label htmlFor={`actual-${step.id}-${pv.parameterId}`} className="form-label text-sm">
                    {pv.parameter.name} (Planned: {pv.plannedValue === null || pv.plannedValue === undefined ? '(not set)' : JSON.stringify(pv.plannedValue)})
                  </label>
                  {pv.parameter.type === 'BOOLEAN' ? (
                    <input type="checkbox" id={`actual-${step.id}-${pv.parameterId}`} checked={actualValuesInput[pv.parameterId] === 'true'} onChange={(e) => handleActualValueChange(pv.parameterId, e.target.checked, pv.parameter.type)} className="form-input mt-1 text-sm h-5 w-5 text-primary-600 border-border focus:ring-primary-500 rounded" />
                  ) : pv.parameter.type === 'DATE' ? (
                    <input type="datetime-local" id={`actual-${step.id}-${pv.parameterId}`} value={actualValuesInput[pv.parameterId] || ''} onChange={(e) => handleActualValueChange(pv.parameterId, e.target.value, pv.parameter.type)} className="form-input w-full mt-1 text-sm" />
                  ) : pv.parameter.type === 'JSON' || (pv.parameter.type === 'STRING' && (actualValuesInput[pv.parameterId]?.length > 50 || String(pv.plannedValue)?.length > 50)) ? (
                    <textarea id={`actual-${step.id}-${pv.parameterId}`} value={actualValuesInput[pv.parameterId] || ''} onChange={(e) => handleActualValueChange(pv.parameterId, e.target.value, pv.parameter.type)} className="form-input w-full mt-1 text-sm min-h-[60px]" rows={3} />
                  ) : (
                    <input type={pv.parameter.type === 'NUMBER' ? 'number' : (pv.parameter.type === 'DURATION' ? 'text' : 'text')} placeholder={pv.parameter.type === 'DURATION' ? 'e.g., 2h 30m or 90m' : ''} id={`actual-${step.id}-${pv.parameterId}`} value={actualValuesInput[pv.parameterId] || ''} onChange={(e) => handleActualValueChange(pv.parameterId, e.target.value, pv.parameter.type)} className="form-input w-full mt-1 text-sm" />
                  )}
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <button onClick={handleCompleteStep} disabled={isStoreLoading} className="btn-success">Confirm & Complete Step</button>
                <button onClick={(e) => { e.stopPropagation(); setIsCompleting(false);}} disabled={isStoreLoading} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div>
            {!isEditingNotes ? (
              <>
                {step.notes ? (<p className="text-sm italic text-accent-700"><strong>Notes:</strong> {step.notes}</p>) : (<p className="text-sm text-text-tertiary italic">No notes for this step.</p>)}
                {isActiveBake && step.status !== 'COMPLETED' && step.status !== 'SKIPPED' && !isCompleting && (
                  <button onClick={handleEditNotes} className="btn-secondary btn-sm mt-1" aria-label="Edit notes for this step">Edit Notes</button>
                )}
              </>
            ) : (
              <div className="mt-2">
                <label htmlFor={`notes-${step.id}`} className="form-label text-sm">Edit Notes:</label>
                <textarea ref={notesTextareaRef} id={`notes-${step.id}`} value={editableNotes} onChange={(e) => setEditableNotes(e.target.value)} className="form-input w-full mt-1 text-sm min-h-[80px]" rows={3} />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveNotes} disabled={isStoreLoading || isSavingNotes} className="btn-primary btn-sm" aria-label="Save notes">
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setIsEditingNotes(false);}} disabled={isStoreLoading || isSavingNotes} className="btn-secondary btn-sm" aria-label="Cancel editing notes">
                    Cancel
                  </button>
                </div>
                {isSavingNotes && (
                  <div className="mt-2 flex items-center"><Spinner /> <span className="ml-2 text-sm text-text-secondary">Saving notes...</span></div>
                )}
              </div>
            )}
          </div>

          {/* Deviations Section */}
          <div>
            {!isEditingDeviations ? (
              <>
                {step.deviations ? (<div className="text-sm text-accent-700"><strong>Deviations:</strong><pre className="bg-surface p-2 rounded-md mt-1 whitespace-pre-wrap break-all">{JSON.stringify(step.deviations, null, 2)}</pre></div>) : (<p className="text-sm text-text-tertiary italic">No deviations recorded.</p>)}
                {isActiveBake && step.status !== 'COMPLETED' && step.status !== 'SKIPPED' && !isCompleting && ( 
                  <button onClick={handleEditDeviations} className="btn-secondary btn-sm mt-1" aria-label="Edit deviations for this step">Edit Deviations</button>
                )}
              </>
            ) : (
              <div className="mt-2">
                <label htmlFor={`deviations-${step.id}`} className="form-label text-sm">Edit Deviations (JSON format):</label>
                <textarea ref={deviationsTextareaRef} id={`deviations-${step.id}`} value={editableDeviations} onChange={(e) => setEditableDeviations(e.target.value)} className="form-input w-full mt-1 text-sm font-mono min-h-[100px]" rows={4} placeholder='Enter deviations as JSON, e.g., {"temperature": "was 5°C lower"}' />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveDeviations} disabled={isStoreLoading || isSavingDeviations} className="btn-primary btn-sm" aria-label="Save deviations">
                    {isSavingDeviations ? 'Saving...' : 'Save Deviations'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setIsEditingDeviations(false);}} disabled={isStoreLoading || isSavingDeviations} className="btn-secondary btn-sm" aria-label="Cancel editing deviations">
                    Cancel
                  </button>
                </div>
                {isSavingDeviations && (
                  <div className="mt-2 flex items-center"><Spinner /><span className="ml-2 text-sm text-text-secondary">Saving deviations...</span></div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
