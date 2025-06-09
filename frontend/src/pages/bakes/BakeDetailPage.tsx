import { useEffect, useState } from 'react'; // Import useState
import { useParams, Link, useHistory } from 'react-router-dom';
import { useBakeStore } from '../../store/useBakeStore';
import BakeStepCard from '../../components/Bake/BakeStepCard.tsx'; // Ensure this path is correct
import { useToast } from '../../context/ToastContext'; // Ensure this path is correct

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
    error, 
    isLoading: isStoreLoading 
  } = useBakeStore();
  const { addToast } = useToast();
  const [isEditingBakeNotes, setIsEditingBakeNotes] = useState(false);
  const [editableBakeNotes, setEditableBakeNotes] = useState('');
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

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
    if (currentBake && window.confirm("Are you sure you want to cancel this bake? This action cannot be undone.")) {
      const success = await cancelBake(currentBake.id);
      if (success) {
        addToast({ type: 'info', message: 'Bake has been cancelled.' });
        history.push('/bakes'); 
      } else {
        addToast({ type: 'error', message: `Failed to cancel bake: ${error || 'Unknown error'}` });
      }
    }
  };

  const handleCompleteBake = async () => {
    if (currentBake && window.confirm("Are you sure you want to mark this bake as complete?")) {
      const updatedBake = await completeBake(currentBake.id);
      if (updatedBake) {
        addToast({ type: 'success', message: 'Bake marked as complete!' });
      } else {
        addToast({ type: 'error', message: `Failed to mark bake as complete: ${error || 'Unknown error'}` });
      }
    }
  };

  const handleCloneBake = async () => {
    if (currentBake && currentBake.recipeId) {
      if (window.confirm(`Clone this bake? This will start a new bake using the recipe "${currentBake.recipe?.name || 'this recipe'}".`)) {
        const newBakeNotes = `Clone of "${currentBake.notes || `Bake ID ${currentBake.id}`}"`;
        const newBake = await startBake(currentBake.recipeId, newBakeNotes);
        if (newBake && newBake.id) {
          addToast({ type: 'success', message: 'Bake cloned successfully! New bake started.' });
          history.push(`/bakes/${newBake.id}`); // Navigate to the new bake's detail page
        } else {
          addToast({ type: 'error', message: `Failed to clone bake: ${error || 'Unknown error'}` });
        }
      }
    }
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
              <button onClick={handleSaveBakeNotes} disabled={isStoreLoading} className="btn-primary px-4 py-2">Save Notes</button>
              <button onClick={() => setIsEditingBakeNotes(false)} disabled={isStoreLoading} className="btn-secondary px-4 py-2">Cancel</button>
            </>
          )}
          {!isEditingBakeNotes && currentBake.active && ( // Show these only if not editing notes AND bake is active
            <>
              {allStepsFinalized && (
                <button onClick={handleCompleteBake} disabled={isStoreLoading} className="btn-success px-4 py-2">Mark as Complete</button>
              )}
              <button onClick={handleCancelBake} disabled={isStoreLoading} className="btn-danger px-4 py-2">Cancel Bake</button>
            </>
          )}
          {!isEditingBakeNotes && !currentBake.active && currentBake.recipeId && ( // Show Clone button for inactive bakes with a recipe
            <>
              <button onClick={handleCloneBake} disabled={isStoreLoading} className="btn-primary px-4 py-2">Clone this Bake</button>
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
              <button onClick={handleSaveRating} disabled={isStoreLoading} className="btn-primary text-sm px-3 py-1">Save Rating</button>
              <button onClick={() => { setIsEditingRating(false); setSelectedRating(currentBake.rating || null); }} disabled={isStoreLoading} className="btn-secondary text-sm px-3 py-1 ml-2">Cancel</button>
            </div>
          )}
        </div>
      )}
      
      <h2 className="text-2xl font-semibold mb-3 text-text-primary">Steps:</h2>
      {currentBake.steps && currentBake.steps.length > 0 ? (
        <div>
          {currentBake.steps.map(step => ( // No change needed here if the above line handles the undefined case
            <BakeStepCard key={step.id} step={step} bakeId={currentBake.id} isActiveBake={currentBake.active} />
          ))}
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