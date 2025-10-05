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
    return <div className="p-4 text-center">Loading active bakes...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error loading bakes: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Active Bakes</h1>
        {/* Optional: Button to navigate to a page where users can select a recipe to start a new bake */}
        {/* <Link to="/recipes" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow">
          Start New Bake from Recipe
        </Link> */}
      </div>

      {activeBakes.length === 0 ? (
        <p className="text-gray-600">No active bakes at the moment. Why not start one?</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeBakes.map((bake: Bake) => (
            <div key={bake.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold mb-2 text-blue-600">{bake.notes || `Bake of ${bake.recipe?.name || 'Unknown Recipe'}`}</h2>
              <p className="text-sm text-gray-500 mb-1">Recipe: {bake.recipe?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500 mb-3">Started: {new Date(bake.startTimestamp).toLocaleString()}</p>
              <p className="text-sm text-gray-700 mb-1">Status: <ActiveBakeIndicator isActive={bake.active} /></p>
              <p className="text-sm text-gray-700 mb-4">Steps: {bake.steps ? bake.steps.length : 'N/A'}</p>
              <Link to={`/bakes/${bake.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                View Details &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}