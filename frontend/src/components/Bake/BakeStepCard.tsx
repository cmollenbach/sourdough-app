import { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { BakeStep, BakeStepParameterValue, StepParameter } from '../../types/bake'; 
import { useBakeStore } from '../../store/useBakeStore';
import { useToast } from '../../context/ToastContext'; // Assuming this is the correct path

interface BakeStepCardProps {
  step: BakeStep;
  bakeId: number;
  isActiveBake: boolean; // To enable/disable actions based on overall bake status
}

export default function BakeStepCard({ step, bakeId, isActiveBake }: BakeStepCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  // State to hold actual values. Initialize from plannedValue or empty.
  // Key is parameterId, value is the actual input string.
  const [actualValuesInput, setActualValuesInput] = useState<Record<number, string>>({});
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableNotes, setEditableNotes] = useState(step.notes || '');
  const [isEditingDeviations, setIsEditingDeviations] = useState(false);
  const [editableDeviations, setEditableDeviations] = useState(
    step.deviations ? JSON.stringify(step.deviations, null, 2) : ''
  );

  const { startStep, completeStep, skipStep, updateStepNote, updateStepDeviations, isLoading: isStoreLoading } = useBakeStore();
  const { addToast } = useToast();

  const handleStartStep = async () => {
    if (!isStoreLoading) {
      const updatedStep = await startStep(bakeId, step.id);
      if (updatedStep) addToast({ type: 'success', message: `Step "${updatedStep.recipeStep?.stepTemplate?.name || 'Step'}" started.` });
      // Error is handled by the store and displayed on BakeDetailPage
    }
  };

  const handlePrepareComplete = () => {
    // Initialize actualValuesInput with planned values or empty strings
    const initialInputs: Record<number, string> = {};
    step.parameterValues.forEach(pv => {
      // If plannedValue is simple (string/number), use it, otherwise stringify or leave empty
      let initialVal = '';
      if (pv.parameter.type === 'BOOLEAN') {
        initialVal = pv.plannedValue === true ? 'true' : 'false';
      } else if (pv.parameter.type === 'DATE' && typeof pv.plannedValue === 'string') {
        // For datetime-local, format needs to be YYYY-MM-DDTHH:mm
        try {
          const d = new Date(pv.plannedValue);
          if (!isNaN(d.getTime())) {
            initialVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          }
        } catch (e) { console.warn("Error formatting planned DATE value:", pv.plannedValue, e); }
      } else {
        if (typeof pv.plannedValue === 'string' || typeof pv.plannedValue === 'number') {
          initialVal = String(pv.plannedValue);
        } else if (pv.plannedValue !== null && pv.plannedValue !== undefined) {
          try {
            initialVal = JSON.stringify(pv.plannedValue);
          } catch (e) { 
            console.warn("Error stringifying plannedValue for pre-fill:", pv.plannedValue, e);
            /* leave empty or set a default placeholder */ 
          }
        }
      }
      initialInputs[pv.parameterId] = initialVal;
    });
    setActualValuesInput(initialInputs);
    setIsCompleting(true);
  };

  const handleCompleteStep = async () => {
    if (!isStoreLoading) {
      const payloadActualValues: { [parameterId: number]: unknown } = {};
      for (const paramIdStr in actualValuesInput) {
        const paramId = Number(paramIdStr);
        const paramDefinition = step.parameterValues.find(p => p.parameterId === paramId)?.parameter;
        const rawValue = actualValuesInput[paramId];

        if (paramDefinition?.type === 'BOOLEAN') {
          payloadActualValues[paramId] = rawValue === 'true';
        } else if (paramDefinition?.type === 'NUMBER' && !isNaN(parseFloat(rawValue))) {
          payloadActualValues[paramId] = parseFloat(rawValue);
        } else if (paramDefinition?.type === 'JSON') {
          try { payloadActualValues[paramId] = JSON.parse(rawValue); }
          catch (parseError) { payloadActualValues[paramId] = rawValue; console.warn(`Could not parse JSON for param ${paramDefinition.name}, sending as string.`, parseError); }
        } else if (paramDefinition?.type === 'DATE') {
          try { payloadActualValues[paramId] = JSON.parse(rawValue); }
          catch (parseError) { payloadActualValues[paramId] = rawValue; console.warn(`Could not parse JSON for param ${paramDefinition.name}, sending as string.`, parseError); }
        } else {
          // Default to string or attempt general JSON parse for other complex types
          try { payloadActualValues[paramId] = JSON.parse(rawValue); } // Try to parse, might be object/array stored as string
          catch { payloadActualValues[paramId] = rawValue; } // Fallback to raw string
        }
      }
      const updatedStep = await completeStep(bakeId, step.id, { actualParameterValues: payloadActualValues });
      if (updatedStep) {
        addToast({ type: 'success', message: `Step "${updatedStep.recipeStep?.stepTemplate?.name || 'Step'}" completed.` });
        setIsCompleting(false); // Close the form
      } else {
        addToast({ type: 'error', message: 'Failed to complete step.' });
      }
    }
  };

  const handleSkipStep = async () => {
    if (!isStoreLoading) {
      const updatedStep = await skipStep(bakeId, step.id);
      if (updatedStep) addToast({ type: 'info', message: `Step "${updatedStep.recipeStep?.stepTemplate?.name || 'Step'}" skipped.` });
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

  const handleEditNotes = () => {
    setEditableNotes(step.notes || ''); // Reset to current notes when starting edit
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    if (!isStoreLoading) {
      const updatedStep = await updateStepNote(bakeId, step.id, editableNotes);
      if (updatedStep) {
        addToast({ type: 'success', message: 'Notes saved successfully.' });
        setIsEditingNotes(false);
      } else {
        addToast({ type: 'error', message: 'Failed to save notes.' });
      }
    }
  };

  const handleEditDeviations = () => {
    setEditableDeviations(step.deviations ? JSON.stringify(step.deviations, null, 2) : '');
    setIsEditingDeviations(true);
  };

  const handleSaveDeviations = async () => {
    if (!isStoreLoading) {
      let deviationsToSave: unknown = null;
      try {
        deviationsToSave = editableDeviations ? JSON.parse(editableDeviations) : null;
      } catch (e) {
        const errMessage = "Deviations are not valid JSON.";
        console.error("Error parsing deviations JSON:", e);
        addToast({ type: 'error', message: errMessage });
        return;
      }
      const updatedStep = await updateStepDeviations(bakeId, step.id, deviationsToSave);
      if (updatedStep) {
        addToast({ type: 'success', message: 'Deviations saved successfully.' });
        setIsEditingDeviations(false);
      } else {
        addToast({ type: 'error', message: 'Failed to save deviations.' });
      }
    }
  };

  const canStart = isActiveBake && step.status === 'PENDING';
  const canComplete = isActiveBake && step.status === 'IN_PROGRESS';
  const canSkip = isActiveBake && (step.status === 'PENDING' || step.status === 'IN_PROGRESS');

  // Helper to render parameter values
  const renderParameterValue = (paramValue: BakeStepParameterValue) => {
    let displayValue = '';
    if (paramValue.actualValue !== null && paramValue.actualValue !== undefined) {
      try { displayValue = `Actual: ${JSON.stringify(paramValue.actualValue)}`; }
      catch(stringifyError) { displayValue = `Actual: (error displaying value)`; console.warn("Error stringifying actualValue:", paramValue.actualValue, stringifyError); }
    } else if (paramValue.plannedValue !== null && paramValue.plannedValue !== undefined) {
      try { displayValue = `Planned: ${JSON.stringify(paramValue.plannedValue)}`; }
      catch(stringifyError) { displayValue = `Planned: (error displaying value)`; console.warn("Error stringifying plannedValue:", paramValue.plannedValue, stringifyError); }
    } else {
      displayValue = `Planned: (not set)`;
    }

    return `${paramValue.parameter.name}: ${displayValue}`;
  };

  return (
    <div className={`mb-4 p-4 border border-border rounded-lg shadow-md ${step.status === 'COMPLETED' ? 'bg-success-50' : step.status === 'IN_PROGRESS' ? 'bg-primary-50' : 'bg-surface'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {step.order}. {step.recipeStep?.stepTemplate?.name || step.recipeStep?.name || 'Unnamed Step'}
          </h3>
          <p className="text-sm text-text-tertiary">Status: <span className="font-medium">{step.status}</span></p>
        </div>
        <div className="flex space-x-2">
          {canStart && (
            <button onClick={handleStartStep} disabled={isStoreLoading} className="btn-primary text-sm px-3 py-1"> {/* Adjusted padding for consistency if needed */}
              Start
            </button>
          )}
          {canComplete && !isCompleting && (
            <button onClick={handlePrepareComplete} disabled={isStoreLoading} className="btn-success text-sm">
              Record & Complete
            </button>
          )}
          {/* The actual "Complete" button will be shown within the isCompleting form */}
          {isCompleting && (
             <button onClick={() => setIsCompleting(false)} disabled={isStoreLoading} className="btn-secondary text-sm px-3 py-1">Cancel</button>
          )}

          {canSkip && (
            <button onClick={handleSkipStep} disabled={isStoreLoading} className="btn-skip text-sm">
              Skip
            </button>
          )}
        </div>
      </div>

      {step.recipeStep?.description && <p className="text-sm text-text-secondary mb-2">{step.recipeStep.description}</p>}
      
      <div className="my-3">
        {!isEditingNotes ? (
          <>
            {step.notes ? (
              <p className="text-sm italic text-accent-700">
                <strong>Notes:</strong> {step.notes}
              </p>
            ) : (
              <p className="text-sm text-text-tertiary italic">No notes for this step.</p>
            )}
            {isActiveBake && step.status !== 'COMPLETED' && step.status !== 'SKIPPED' && (
              <button onClick={handleEditNotes} className="btn-secondary text-xs px-2 py-1 mt-1">Edit Notes</button>
            )}
          </>
        ) : (
          <div className="mt-2">
            <label htmlFor={`notes-${step.id}`} className="form-label text-sm">Edit Notes:</label>
            <textarea
              id={`notes-${step.id}`}
              value={editableNotes}
              onChange={(e) => setEditableNotes(e.target.value)}
              className="form-input w-full mt-1 text-sm min-h-[80px]"
              rows={3}
            />
            <div className="mt-2 space-x-2">
              <button onClick={handleSaveNotes} disabled={isStoreLoading} className="btn-primary text-sm px-3 py-1">Save Notes</button>
              <button onClick={() => setIsEditingNotes(false)} disabled={isStoreLoading} className="btn-secondary text-sm px-3 py-1">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="my-3">
        {!isEditingDeviations ? (
          <>
            {step.deviations ? (
              <div className="text-sm text-accent-700">
                <strong>Deviations:</strong>
                <pre className="bg-surface p-2 rounded-md mt-1 whitespace-pre-wrap break-all">
                  {JSON.stringify(step.deviations, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-text-tertiary italic">No deviations recorded for this step.</p>
            )}
            {isActiveBake && step.status !== 'COMPLETED' && step.status !== 'SKIPPED' && ( 
              <button onClick={handleEditDeviations} className="btn-secondary text-xs px-2 py-1 mt-1">Edit Deviations</button>
            )}
          </>
        ) : (
          <div className="mt-2">
            <label htmlFor={`deviations-${step.id}`} className="form-label text-sm">Edit Deviations (JSON format):</label>
            <textarea
              id={`deviations-${step.id}`}
              value={editableDeviations}
              onChange={(e) => setEditableDeviations(e.target.value)}
              className="form-input w-full mt-1 text-sm font-mono min-h-[100px]" // font-mono for JSON
              rows={4}
              placeholder='Enter deviations as JSON, e.g., {"temperature": "was 5°C lower"}'
            />
            <div className="mt-2 space-x-2">
              <button onClick={handleSaveDeviations} disabled={isStoreLoading} className="btn-primary text-sm px-3 py-1">Save Deviations</button>
              <button onClick={() => setIsEditingDeviations(false)} disabled={isStoreLoading} className="btn-secondary text-sm px-3 py-1">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {isCompleting && (
        <div className="my-4 p-4 border border-primary-300 rounded-md bg-surface-elevated">
          <h4 className="text-md font-semibold text-text-primary mb-2">Record Actual Values:</h4>
          {step.parameterValues.map(pv => (
            <div key={pv.parameterId} className="mb-3">
              <label htmlFor={`actual-${step.id}-${pv.parameterId}`} className="form-label text-sm">
                {pv.parameter.name} (Planned: {pv.plannedValue === null || pv.plannedValue === undefined ? '(not set)' : JSON.stringify(pv.plannedValue)})
              </label>
              {pv.parameter.type === 'BOOLEAN' ? (
                <input
                  type="checkbox"
                  id={`actual-${step.id}-${pv.parameterId}`}
                  checked={actualValuesInput[pv.parameterId] === 'true'}
                  onChange={(e) => handleActualValueChange(pv.parameterId, e.target.checked, pv.parameter.type)}
                  className="form-input mt-1 text-sm h-5 w-5 text-primary-600 border-border focus:ring-primary-500 rounded" // Basic checkbox styling
                />
              ) : pv.parameter.type === 'DATE' ? (
                <input
                  type="datetime-local"
                  id={`actual-${step.id}-${pv.parameterId}`}
                  value={actualValuesInput[pv.parameterId] || ''}
                  onChange={(e) => handleActualValueChange(pv.parameterId, e.target.value, pv.parameter.type)}
                  className="form-input w-full mt-1 text-sm"
                />
              ) : pv.parameter.type === 'JSON' || (pv.parameter.type === 'STRING' && (actualValuesInput[pv.parameterId]?.length > 50 || String(pv.plannedValue)?.length > 50)) ? (
                <textarea
                  id={`actual-${step.id}-${pv.parameterId}`}
                  value={actualValuesInput[pv.parameterId] || ''}
                  onChange={(e) => handleActualValueChange(pv.parameterId, e.target.value, pv.parameter.type)}
                  className="form-input w-full mt-1 text-sm min-h-[60px]" // Basic textarea styling
                  rows={3}
                />
              ) : (
                <input
                  type={pv.parameter.type === 'NUMBER' ? 'number' : (pv.parameter.type === 'DURATION' ? 'text' : 'text')}
                  placeholder={pv.parameter.type === 'DURATION' ? 'e.g., 2h 30m or 90m' : ''}
                  id={`actual-${step.id}-${pv.parameterId}`}
                  value={actualValuesInput[pv.parameterId] || ''}
                  onChange={(e) => handleActualValueChange(pv.parameterId, e.target.value, pv.parameter.type)}
                  className="form-input w-full mt-1 text-sm"
                />
              )}
            </div>
          ))}
          <button onClick={handleCompleteStep} disabled={isStoreLoading} className="btn-success text-sm mt-2 w-full sm:w-auto">
            Confirm & Complete Step
          </button>
        </div>
      )}


      {step.parameterValues && step.parameterValues.length > 0 && (
        <div className="mt-2">
          <h4 className="text-xs font-semibold text-text-tertiary uppercase">Parameters:</h4>
          <ul className="list-disc list-inside pl-4 text-sm text-text-secondary">
            {step.parameterValues.map(pv => (
              <li key={pv.id}>{renderParameterValue(pv)}</li>
            ))}
          </ul>
        </div>
      )}
      {step.ingredients && step.ingredients.length > 0 && (
        <div className="mt-2">
          <h4 className="text-xs font-semibold text-text-tertiary uppercase">Ingredients:</h4>
          <ul className="list-disc list-inside pl-4 text-sm text-text-secondary">
            {step.ingredients.map(ing => (
              <li key={ing.id}>{ing.ingredient.name}: {ing.plannedPercentage}{ing.plannedPreparation ? ` (${ing.plannedPreparation})` : ''}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
