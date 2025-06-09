import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRecipeList } from '../../utils/api'; // We'll ensure this exists
import type { RecipeStub } from '../../types/recipe'; // We'll ensure this type exists

const RecipeListPage: React.FC = () => {
  const [recipes, setRecipes] = useState<RecipeStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        setError(null);
        const recipeList = await fetchRecipeList();
        setRecipes(recipeList);
      } catch (err) {
        console.error("Failed to load recipes:", err);
        setError("Failed to load recipes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4 text-center text-text-secondary">Loading recipes...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Recipes</h1>
        <Link
          to="/recipes/new" // Assumes your RecipeBuilderPage handles "new"
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-sm font-semibold transition-colors"
        >
          Create New Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <p className="text-text-secondary text-center">No recipes found. Why not create one?</p>
      ) : (
        <ul className="space-y-3">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="bg-surface-elevated p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <Link to={`/recipes/${recipe.id}`} className="text-lg font-semibold text-primary-600 hover:text-primary-700">
                {recipe.name}
              </Link>
              {/* You could add more details here like a short description or creation date if available in RecipeStub */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default RecipeListPage;