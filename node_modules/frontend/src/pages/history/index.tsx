import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBakeStore } from '../../store/useBakeStore';
import type { Bake } from '@sourdough/shared';
import ActiveBakeIndicator from '../../components/Bake/ActiveBakeIndicator'; // For displaying status

export default function BakeHistoryPage() {
  const { allBakes, isLoading, error, fetchAllBakes } = useBakeStore();

  useEffect(() => {
    fetchAllBakes();
  }, [fetchAllBakes]);

  if (isLoading) {
    return <div className="p-4 text-center text-text-secondary">Loading bake history...</div>;
  }

  if (error) {
    return <div className="p-4 text-center bg-danger-50 text-danger-700 border border-danger-200 rounded-md">Error loading history: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Bake History</h1>
      </div>

      {allBakes.length === 0 ? (
        <p className="text-text-secondary">No bakes found in your history.</p>
      ) : (
        <div className="space-y-4">
          {allBakes.map((bake: Bake) => (
            <div key={bake.id} className={`p-4 border rounded-lg shadow-md ${bake.active ? 'bg-primary-50 border-primary-200' : 'bg-surface border-border'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary mb-1">{bake.notes || `Bake of ${bake.recipe?.name || 'Unknown Recipe'}`}</h2>
                  <p className="text-sm text-text-secondary">Recipe: {bake.recipe?.name || 'N/A'}</p>
                  <p className="text-sm text-text-tertiary">Started: {new Date(bake.startTimestamp).toLocaleString()}</p>
                  {bake.finishTimestamp && <p className="text-sm text-text-tertiary">Finished: {new Date(bake.finishTimestamp).toLocaleString()}</p>}
                </div>
                <ActiveBakeIndicator isActive={bake.active} />
              </div>
              <p className="text-sm text-text-secondary mt-2">Steps: {bake.stepCount ?? 'N/A'}</p>
              <Link to={`/bakes/${bake.id}`} className="text-sm text-primary-600 hover:text-primary-700 hover:underline font-medium mt-2 inline-block">
                View Details &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}