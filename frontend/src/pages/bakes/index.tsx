import { useEffect } from 'react';
import { Link } from 'react-router-dom'; // Assuming you use react-router-dom for navigation
import { useBakeStore } from '../../store/useBakeStore';
import type { Bake } from '@sourdough/shared'; // Ensure Bake type is correctly imported
import ActiveBakeIndicator from '../../components/Bake/ActiveBakeIndicator'; // Adjust path if needed

export default function BakesListPage() {
  const { activeBakes, isLoading, error, fetchActiveBakes } = useBakeStore();

  useEffect(() => {
    fetchActiveBakes();
  }, [fetchActiveBakes]);

  if (isLoading) {
    return <div className="py-10 text-center text-text-secondary">Loading active bakes...</div>;
  }

  if (error) {
    return (
      <div className="py-6 text-center">
        <div className="inline-block rounded-xl border border-danger-200 bg-danger-50 px-6 py-4 text-danger-700">
          Error loading bakes: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-text-primary">Active Bakes</h1>
        {/* Optional: Button to navigate to a page where users can select a recipe to start a new bake */}
        {/* <Link
          to="/recipes"
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        >
          Start New Bake from Recipe
        </Link> */}
      </div>

      {activeBakes.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-elevated px-6 py-10 text-center shadow-soft">
          <p className="text-text-secondary">No active bakes at the moment. Why not start one?</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeBakes.map((bake: Bake) => (
            <article
              key={bake.id}
              className="group rounded-2xl border border-border bg-surface-elevated p-6 shadow-card transition-shadow hover:shadow-elevated"
            >
              <h2 className="mb-2 text-xl font-semibold text-text-primary">
                {bake.notes || `Bake of ${bake.recipe?.name || "Unknown Recipe"}`}
              </h2>
              <p className="text-sm text-text-secondary">Recipe: {bake.recipe?.name || "N/A"}</p>
              <p className="text-sm text-text-tertiary">
                Started: {new Date(bake.startTimestamp).toLocaleString()}
              </p>
              <div className="mt-3 flex flex-col gap-1 text-sm text-text-secondary">
                <span>
                  Status: <ActiveBakeIndicator isActive={bake.active} />
                </span>
                <span>Steps: {bake.steps ? bake.steps.length : "N/A"}</span>
              </div>
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