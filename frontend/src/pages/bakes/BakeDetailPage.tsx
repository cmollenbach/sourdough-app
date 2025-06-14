import { useEffect, useState, useMemo } from 'react'; // Import useMemo
import { useParams, Link, useHistory } from 'react-router-dom';
import { useBakeStore } from '../../store/useBakeStore';
import BakeStepCard from '../../components/Bake/BakeStepCard.tsx'; // Ensure this path is correct
import { useToast } from '../../context/ToastContext'; // Ensure this path is correct
import { useDialog } from '../../context/useDialog'; // Import useDialog
import BakeTargetsDisplay from '../../components/Bake/BakeTargetsDisplay'; // Import the new component
import { useRecipeBuilderStore } from '../../store/recipeBuilderStore'; // For metadata
import { useRecipeCalculations, type CalculatedStepColumn } from '../../hooks/useRecipeCalculations'; // For calculations, CalculatedStepColumn is used for typing stepCalculationsMap. OtherIngredientDisplay is not directly used here.
import { type FullRecipe, type RecipeStep, IngredientCalculationMode } from '../../types/recipe'; // For type definitions, IngredientCalculationMode is now a value import
// import type { StepTemplate as StepTemplateMeta } from '../../types/recipeLayout'; // StepTemplateMeta is used as a type, not a variable

export default function BakeDetailPage() {
  const { bakeId } = useParams<{ bakeId: string }>();
  const history = useHistory();
  const { 
    currentBake, 
    fetchBakeById, 
    cancelBake, 
    completeBake,
    startBake, // Add startBake for cloning
    updateBakeRating, // New store action
    updateBakeNotes, // New store action
    isLoading, 
    error
  } = useBakeStore();
  const { showDialog, hideDialog } = useDialog(); // Get dialog functions
  const { addToast } = useToast();
  const [isEditingBakeNotes, setIsEditingBakeNotes] = useState(false);
  const [editableBakeNotes, setEditableBakeNotes] = useState('');
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const {
    ingredientsMeta,
    ingredientCategoriesMeta,
    fieldsMeta,
    stepTemplates,
  } = useRecipeBuilderStore(state => state); // Fetch all metadata


  useEffect(() => {
    if (bakeId) {
      fetchBakeById(Number(bakeId));
    }
  }, [bakeId, fetchBakeById]);

  useEffect(() => {
    if (currentBake) {
      setEditableBakeNotes(currentBake.notes || '');
      setSelectedRating(currentBake.rating || null);
    }
  }, [currentBake]);

  // Memoize sorted steps to prevent re-sorting on every render unless currentBake.steps changes
  const sortedSteps = useMemo(() => {
    if (!currentBake?.steps) return [];
    return [...currentBake.steps].sort((a, b) => a.order - b.order);
  }, [currentBake?.steps]);

  // Determine the index of the first step that needs action (not COMPLETED or SKIPPED)
  const activeStepIndex = useMemo(() => {
    return sortedSteps.findIndex(s => s.status !== 'COMPLETED' && s.status !== 'SKIPPED');
  }, [sortedSteps]);

  // Prepare valid RecipeStep array for calculations
  const validRecipeStepsForCalculations = useMemo((): RecipeStep[] => {
    if (!currentBake?.steps) return [];

    // Construct RecipeStep objects from BakeStep and BakeStep.recipeStep (RecipeStepInfo)
    return currentBake.steps
      .map((bakeStepInstance) => { // Removed unused _index parameter
        const recipeStepInfo = bakeStepInstance.recipeStep;
        
        // Attempt to find the full StepTemplateMeta from the store using the name
        // from recipeStepInfo.stepTemplate. This assumes names are unique enough.
        // A direct stepTemplateId on bakeStepInstance or recipeStepInfo would be more robust.
        const stepTemplateNameFromInfo = recipeStepInfo?.stepTemplate?.name;
        const fullStepTemplateMeta = stepTemplates.find(
          (st) => st.name === stepTemplateNameFromInfo
        );

        if (
          !recipeStepInfo ||
          typeof bakeStepInstance.recipeStepId !== 'number' || // ID of original RecipeStep
          typeof fullStepTemplateMeta?.id !== 'number' || // Use the ID from the looked-up fullStepTemplateMeta
          typeof currentBake?.recipeId !== 'number' 
        ) {
          return null; // Cannot form a valid RecipeStep
        }
        
        // Map BakeStep.ingredients (BakeStepIngredient[]) to RecipeStepIngredient[]
        // This assumes BakeStepIngredient is compatible or can be cast.
        // If BakeStepIngredient has a different structure, a more detailed mapping is needed.
        // For missing calculationMode and ingredientCategoryId, we'll use defaults or derive if possible.
        const ingredientsForCalc = (bakeStepInstance.ingredients || []).map(bsIng => ({
          id: bsIng.id || 0, // Or a temporary ID if not present
          recipeStepId: bakeStepInstance.recipeStepId, // This is the ID of the original RecipeStep
          ingredientId: bsIng.ingredientId,
          amount: bsIng.plannedPercentage ?? 0, // Assuming plannedPercentage is the amount for calculation
          // Defaulting calculationMode if not present. This is a significant assumption.
          // Ideally, this information should come from the backend or be derivable.
          // Use a type assertion if you are sure the property might exist at runtime but isn't in the type.
          // Or, ensure BakeStepIngredient type includes calculationMode if it's expected.
          calculationMode: (bsIng as { calculationMode?: IngredientCalculationMode }).calculationMode || IngredientCalculationMode.PERCENTAGE,
          // Attempt to find ingredientCategoryId from ingredientsMeta if not directly on bsIng
          ingredientCategoryId: (bsIng as { ingredientCategoryId?: number }).ingredientCategoryId ||
                                ingredientsMeta.find(im => im.id === bsIng.ingredientId)?.ingredientCategoryId || 0,
          preparation: bsIng.plannedPreparation || null,
          notes: bsIng.notes || null,
        })) as RecipeStep['ingredients'];

        // Map BakeStep.parameterValues (BakeStepParameterValue[]) to RecipeStepField[]
        // This assumes BakeStepParameterValue is compatible or can be cast.
        const fieldsForCalc = (bakeStepInstance.parameterValues || []).map(pv => ({
          id: pv.id || 0, // Or a temporary ID
          recipeStepId: bakeStepInstance.recipeStepId,
          fieldId: pv.parameterId,
          value: pv.plannedValue ?? '', // Assuming plannedValue is the value for calculation
          notes: pv.notes || null,
        })) as RecipeStep['fields'];

        return {
          id: bakeStepInstance.recipeStepId,
          recipeId: currentBake.recipeId, // Use recipeId from the parent Bake object
          stepTemplateId: fullStepTemplateMeta.id, // Use id from the looked-up fullStepTemplateMeta
          order: bakeStepInstance.order,
          name: fullStepTemplateMeta.name || "Unnamed Step", // Name from the looked-up fullStepTemplateMeta
          description: recipeStepInfo.description || null,
          notes: bakeStepInstance.notes || null, // Notes from the BakeStep instance
          ingredients: ingredientsForCalc,
          fields: fieldsForCalc,
        } as RecipeStep;
      })
      .filter((rs): rs is RecipeStep => rs !== null);
  }, [currentBake?.steps, currentBake?.recipeId, ingredientsMeta, stepTemplates]); // Added stepTemplates dependency

  // Prepare data for useRecipeCalculations
  const recipeForCalculations = useMemo((): FullRecipe | null => {
    // If there's no currentBake or if there are bake steps but none yielded valid RecipeStep data
    if (!currentBake || (currentBake.steps && currentBake.steps.length > 0 && validRecipeStepsForCalculations.length === 0)) {
      return null;
    }
    return {
      // Cast currentBake.recipe to FullRecipe to access 'id' if it's expected to be there at runtime.
      id: (currentBake.recipe as FullRecipe | undefined)?.id || currentBake.recipeId || 0,
      name: (currentBake.recipe as FullRecipe | null | undefined)?.name || currentBake.notes || "Current Bake", // Use notes if bake instance name isn't directly available
      // Use snapshotted values for calculation consistency with the time of bake start
      totalWeight: currentBake.recipeTotalWeightSnapshot,
      hydrationPct: currentBake.recipeHydrationPctSnapshot,
      saltPct: currentBake.recipeSaltPctSnapshot,
      // The steps for calculation are the original RecipeStep definitions
      steps: validRecipeStepsForCalculations,
      // Assuming currentBake.recipe, if it exists, is compatible with FullRecipe or provides fieldValues
      fieldValues: (currentBake.recipe as FullRecipe | null | undefined)?.fieldValues || [] 
    };
  }, [currentBake, validRecipeStepsForCalculations]);

  const calculatedRecipeData = useRecipeCalculations(
    recipeForCalculations,
    validRecipeStepsForCalculations, // Use the filtered and typed array
    ingredientsMeta,
    ingredientCategoriesMeta,
    fieldsMeta,
    stepTemplates
  );

  // Create a map of stepId to CalculatedStepColumn for efficient lookup
  const stepCalculationsMap = useMemo(() => {
    const map = new Map<number, CalculatedStepColumn>();
    if (calculatedRecipeData?.columns) {
      calculatedRecipeData.columns.forEach(col => {
        // col.stepId is the ID of the original RecipeStep
        map.set(col.stepId, col);
      });
    }
    return map;
  }, [calculatedRecipeData]);


  if (isLoading) {
    return <div className="p-4 text-center text-text-secondary">Loading bake details...</div>;
  }

  if (error && !currentBake) { // Show general error if bake couldn't be loaded
    return <div className="p-4 text-center bg-danger-50 text-danger-700 border border-danger-200 rounded-md">Error loading bake: {error}</div>;
  }

  if (!currentBake) {
    return <div className="p-4 text-center text-text-secondary">Bake not found. <Link to="/bakes" className="text-primary-500 hover:text-primary-600 hover:underline">Go back to bakes list.</Link></div>;
  }

  const handleCancelBake = async () => {
    if (!currentBake) return;

    showDialog({
      title: "Confirm Cancel Bake",
      content: "Are you sure you want to cancel this bake? This action cannot be undone.",
      confirmText: "Yes, Cancel Bake",
      onConfirm: async () => {
        hideDialog(); // Close the dialog first
        const success = await cancelBake(currentBake.id);
        if (success) {
          addToast({ type: 'info', message: 'Bake has been cancelled.' });
          history.push('/bakes'); 
        } else {
          addToast({ type: 'error', message: `Failed to cancel bake: ${error || 'Unknown error'}` });
        }
      },
      onCancel: hideDialog,
    });
  };

  const handleCompleteBake = async () => {
    if (!currentBake) return;

    showDialog({
      title: "Confirm Complete Bake",
      content: "Are you sure you want to mark this bake as complete?",
      confirmText: "Yes, Complete Bake",
      onConfirm: async () => {
        hideDialog();
        const updatedBake = await completeBake(currentBake.id);
        if (updatedBake) {
          addToast({ type: 'success', message: 'Bake marked as complete!' });
        } else {
          addToast({ type: 'error', message: `Failed to mark bake as complete: ${error || 'Unknown error'}` });
        }
      },
      onCancel: hideDialog,
    });
  };

  const handleCloneBake = async () => {
    if (!currentBake || !currentBake.recipeId) return;

    showDialog({
      title: "Confirm Clone Bake",
      content: `Clone this bake? This will start a new bake using the recipe "${currentBake.recipe?.name || 'this recipe'}".`,
      confirmText: "Yes, Clone Bake",
      onConfirm: async () => {
        hideDialog();
        const newBakeNotes = `Clone of "${currentBake.notes || `Bake ID ${currentBake.id}`}"`;
        // Ensure startBake is called with the correct parameters.
        // Assuming startBake in useBakeStore takes (recipeId: number, notes?: string)
        const newBake = await startBake(currentBake.recipeId!, newBakeNotes); // Added non-null assertion for recipeId as it's checked
        if (newBake && newBake.id) {
          addToast({ type: 'success', message: 'Bake cloned successfully! New bake started.' });
          history.push(`/bakes/${newBake.id}`);
        } else {
          addToast({ type: 'error', message: `Failed to clone bake: ${error || 'Unknown error'}` });
        }
      },
      onCancel: hideDialog,
    });
  };

  const handleEditBakeNotes = () => {
    setEditableBakeNotes(currentBake?.notes || '');
    setIsEditingBakeNotes(true);
  };

  const handleSaveBakeNotes = async () => {
    if (currentBake) {
      const updatedBake = await updateBakeNotes(currentBake.id, editableBakeNotes.trim() || null);
      if (updatedBake) {
        addToast({ type: 'success', message: 'Bake notes updated!' });
        setIsEditingBakeNotes(false);
      } else {
        addToast({ type: 'error', message: `Failed to update bake notes: ${error || 'Unknown error'}` });
      }
    }
  };

  const handleSaveRating = async () => {
    if (currentBake && selectedRating !== undefined) { // selectedRating can be null
      const updatedBake = await updateBakeRating(currentBake.id, selectedRating);
      if (updatedBake) {
        addToast({ type: 'success', message: 'Rating saved!' });
        setIsEditingRating(false);
      } else {
        addToast({ type: 'error', message: `Failed to save rating: ${error || 'Unknown error'}` });
      }
    }
  };

  const Star = ({ filled, onClick }: { filled: boolean; onClick: () => void }) => (
    <button onClick={onClick} className={`text-2xl ${filled ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}>★</button>
  );

  const allStepsFinalized = currentBake?.steps && currentBake.steps.every(
    step => step.status === 'COMPLETED' || step.status === 'SKIPPED'
  );

  return (
    <div className="p-4">
      {error && currentBake && ( // Show error related to an action if bake is loaded but an action failed
         <div className="mb-4 p-4 text-center bg-danger-50 text-danger-700 border border-danger-200 rounded-md">Action Error: {error}</div>
      )}
      <div className="flex justify-between items-center mb-4">
        {!isEditingBakeNotes ? (
          <div className="flex items-center group">
            <h1 className="text-3xl font-bold text-text-primary">
              {currentBake.notes || `Bake ID ${currentBake.id}`}
            </h1>
            {/* Allow editing notes even for inactive bakes, or make conditional based on currentBake.active */}
            <button 
              onClick={handleEditBakeNotes} 
              className="ml-3 btn-secondary text-xs px-2 py-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              title="Edit bake name/notes"
            >
              ✏️
            </button>

          </div>
        ) : (
          <div className="flex-grow mr-4">
            <input 
              type="text" 
              value={editableBakeNotes} 
              onChange={(e) => setEditableBakeNotes(e.target.value)} 
              className="form-input w-full text-3xl font-bold"/>
          </div>
        )}
        <div className="flex space-x-2">
          {isEditingBakeNotes && (
            <>
              <button onClick={handleSaveBakeNotes} disabled={isLoading} className="btn-primary px-4 py-2">Save Notes</button>
              <button onClick={() => setIsEditingBakeNotes(false)} disabled={isLoading} className="btn-secondary px-4 py-2">Cancel</button>
            </>
          )}
          {!isEditingBakeNotes && currentBake.active && ( // Show these only if not editing notes AND bake is active
            <>
              {allStepsFinalized && (
                <button onClick={handleCompleteBake} disabled={isLoading} className="btn-success px-4 py-2">Mark as Complete</button>
              )}
              <button onClick={handleCancelBake} disabled={isLoading} className="btn-danger px-4 py-2">Cancel Bake</button>
            </>
          )}
          {!isEditingBakeNotes && !currentBake.active && currentBake.recipeId && ( // Show Clone button for inactive bakes with a recipe
            <>
              <button onClick={handleCloneBake} disabled={isLoading} className="btn-primary px-4 py-2">Clone this Bake</button>
            </>
          )}
        </div>
      </div>
      <p className="mb-1 text-text-secondary">Recipe: {currentBake.recipe?.name || 'N/A'}</p>
      <p className="mb-1 text-text-secondary">Status: {currentBake.active ? <span className="text-success-600 font-medium">In Progress</span> : <span className="text-text-tertiary font-medium">Inactive/Finalized</span>}</p>
      <p className="mb-4 text-text-secondary">
        Started: {new Date(currentBake.startTimestamp).toLocaleString()}
        {currentBake.finishTimestamp && !currentBake.active && (
          <span className="ml-2 text-text-tertiary">(Ended: {new Date(currentBake.finishTimestamp).toLocaleString()})</span>
        )}
      </p>

      {/* Display Snapshotted Bake Targets */}
      <BakeTargetsDisplay bake={currentBake} />

      {!currentBake.active && ( // Show rating section only for inactive bakes
        <div className="mb-4 p-3 bg-surface-elevated rounded-md border border-border">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-semibold text-text-secondary">Your Rating:</h3>
            {!isEditingRating && (
              <button onClick={() => setIsEditingRating(true)} className="btn-secondary text-xs px-2 py-1">
                {currentBake.rating ? 'Edit Rating' : 'Add Rating'}
              </button>
            )}
          </div>
          {!isEditingRating ? (
            <div className="flex mt-1">
              {currentBake.rating ? [...Array(5)].map((_, i) => <Star key={i} filled={i < currentBake.rating!} onClick={() => { setSelectedRating(i + 1); setIsEditingRating(true); }} />) : <p className="text-sm text-text-tertiary italic">Not yet rated.</p>}
            </div>
          ) : (
            <div className="mt-2">
              <div className="flex space-x-1 mb-2">{[...Array(5)].map((_, i) => <Star key={i} filled={selectedRating !== null && i < selectedRating} onClick={() => setSelectedRating(i + 1)} />)}</div>
              <button onClick={() => setSelectedRating(null)} className="text-xs text-primary-500 hover:underline mr-2">Clear</button>
              <button onClick={handleSaveRating} disabled={isLoading} className="btn-primary text-sm px-3 py-1">Save Rating</button>
              <button onClick={() => { setIsEditingRating(false); setSelectedRating(currentBake.rating || null); }} disabled={isLoading} className="btn-secondary text-sm px-3 py-1 ml-2">Cancel</button>
            </div>
          )}
        </div>
      )}
      
      <h2 className="text-2xl font-semibold mb-3 text-text-primary">Steps:</h2>
      {sortedSteps.length > 0 ? (
        <div>
          {sortedSteps.map((bakeStep, index) => { 
            // Retrieve pre-calculated data for this specific step from the map
            // Assumes bakeStep.recipeStep and bakeStep.recipeStep.id are valid.
            // Use bakeStep.recipeStepId as the key, which corresponds to the original RecipeStep.id
            const stepCalculations = typeof bakeStep.recipeStepId === 'number' ? stepCalculationsMap.get(bakeStep.recipeStepId) : undefined;

            return (
              <BakeStepCard 
                key={bakeStep.id} 
                step={bakeStep} 
                bakeId={currentBake.id} 
                isActiveBake={currentBake.active}
                isInitiallyExpanded={index === activeStepIndex}
                stepCalculations={stepCalculations} />
            );
          })}
        </div>
      ) : (
        <p className="text-text-secondary">No steps defined for this bake.</p>
      )}

      <div className="mt-6">
        <Link to="/bakes" className="text-primary-500 hover:text-primary-600 hover:underline">&larr; Back to Bakes List</Link>
      </div>
    </div>
  );
}