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
    return <div className="py-10 text-center text-text-secondary">Loading bake history...</div>;
  }

  if (error) {
    return (
      <div className="py-6 text-center">
        <div className="inline-block rounded-2xl border border-danger-200 bg-danger-50 px-6 py-4 text-danger-700 shadow-soft">
          Error loading history: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-text-primary">Bake History</h1>
      </header>

      {allBakes.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-elevated px-6 py-10 text-center shadow-soft">
          <p className="text-text-secondary">No bakes found in your history.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allBakes.map((bake: Bake) => (
            <article
              key={bake.id}
              className={`rounded-2xl border p-6 shadow-card transition-shadow hover:shadow-elevated ${
                bake.active ? 'border-primary-200 bg-primary-50' : 'border-border bg-surface-elevated'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-text-primary">
                    {bake.notes || `Bake of ${bake.recipe?.name || 'Unknown Recipe'}`}
                  </h2>
                  <p className="text-sm text-text-secondary">Recipe: {bake.recipe?.name || 'N/A'}</p>
                  <p className="text-sm text-text-tertiary">
                    Started: {new Date(bake.startTimestamp).toLocaleString()}
                  </p>
                  {bake.finishTimestamp && (
                    <p className="text-sm text-text-tertiary">
                      Finished: {new Date(bake.finishTimestamp).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <ActiveBakeIndicator isActive={bake.active} />
                </div>
              </div>
              <p className="mt-3 text-sm text-text-secondary">Steps: {bake.stepCount ?? 'N/A'}</p>
              <Link
                to={`/bakes/${bake.id}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-500"
              >
                View Details
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}