import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
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

  // Group recipes by ownership and complexity
  const groupedRecipes = useMemo(() => {
    const mySimple: RecipeStub[] = [];
    const myAdvanced: RecipeStub[] = [];
    const standardSimple: RecipeStub[] = [];
    const standardAdvanced: RecipeStub[] = [];

    recipes.forEach(recipe => {
      if (!recipe.isPredefined) {
        // User's own recipes - determine if advanced based on name or other logic
        // For now, we'll use a simple heuristic or you could add an isAdvanced field
        const isAdvanced = recipe.name.toLowerCase().includes('advanced') || 
                          recipe.name.toLowerCase().includes('complex') ||
                          recipe.name.toLowerCase().includes('lamination') ||
                          recipe.name.toLowerCase().includes('enriched');
        
        if (isAdvanced) {
          myAdvanced.push(recipe);
        } else {
          mySimple.push(recipe);
        }
      } else {
        // Standard templates - use isTemplateAdvanced field
        if (recipe.isTemplateAdvanced) {
          standardAdvanced.push(recipe);
        } else {
          standardSimple.push(recipe);
        }
      }
    });

    // Sort each group alphabetically
    mySimple.sort((a, b) => a.name.localeCompare(b.name));
    myAdvanced.sort((a, b) => a.name.localeCompare(b.name));
    standardSimple.sort((a, b) => a.name.localeCompare(b.name));
    standardAdvanced.sort((a, b) => a.name.localeCompare(b.name));

    return { mySimple, myAdvanced, standardSimple, standardAdvanced };
  }, [recipes]);

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Recipes Column */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-text-primary border-b border-border pb-2">My Recipes</h2>
            
            {/* My Simple Recipes */}
            {groupedRecipes.mySimple.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-text-secondary mb-3">Simple Recipes</h3>
                <ul className="space-y-3">
                  {groupedRecipes.mySimple.map((recipe) => (
                    <li key={recipe.id} className="bg-surface-elevated p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <Link to={`/recipes/${recipe.id}`} className="text-lg font-semibold text-primary-600 hover:text-primary-700">
                        {recipe.name}
                      </Link>
                      <p className="text-sm text-text-tertiary mt-1">Personal Recipe</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* My Advanced Recipes */}
            {groupedRecipes.myAdvanced.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-text-secondary mb-3">Advanced Recipes</h3>
                <ul className="space-y-3">
                  {groupedRecipes.myAdvanced.map((recipe) => (
                    <li key={recipe.id} className="bg-surface-elevated p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-amber-400">
                      <Link to={`/recipes/${recipe.id}`} className="text-lg font-semibold text-primary-600 hover:text-primary-700">
                        {recipe.name}
                      </Link>
                      <p className="text-sm text-text-tertiary mt-1">Personal Recipe • Advanced</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty state for My Recipes */}
            {groupedRecipes.mySimple.length === 0 && groupedRecipes.myAdvanced.length === 0 && (
              <div className="bg-surface-container p-6 rounded-lg border-2 border-dashed border-border text-center">
                <p className="text-text-secondary mb-2">You haven't created any recipes yet.</p>
                <Link
                  to="/recipes/new"
                  className="text-primary-500 hover:text-primary-600 font-medium hover:underline"
                >
                  Create your first recipe →
                </Link>
              </div>
            )}
          </div>

          {/* Standard Recipes Column */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-text-primary border-b border-border pb-2">Standard Recipes</h2>
            
            {/* Simple Templates */}
            {groupedRecipes.standardSimple.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-text-secondary mb-3">Simple Templates</h3>
                <ul className="space-y-3">
                  {groupedRecipes.standardSimple.map((recipe) => (
                    <li key={recipe.id} className="bg-surface-elevated p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <Link to={`/recipes/${recipe.id}`} className="text-lg font-semibold text-primary-600 hover:text-primary-700">
                        {recipe.name}
                      </Link>
                      <p className="text-sm text-text-tertiary mt-1">Standard Template</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Advanced Templates */}
            {groupedRecipes.standardAdvanced.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-text-secondary mb-3">Advanced Templates</h3>
                <ul className="space-y-3">
                  {groupedRecipes.standardAdvanced.map((recipe) => (
                    <li key={recipe.id} className="bg-surface-elevated p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-400">
                      <Link to={`/recipes/${recipe.id}`} className="text-lg font-semibold text-primary-600 hover:text-primary-700">
                        {recipe.name}
                      </Link>
                      <p className="text-sm text-text-tertiary mt-1">Standard Template • Advanced</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty state for Standard Recipes */}
            {groupedRecipes.standardSimple.length === 0 && groupedRecipes.standardAdvanced.length === 0 && (
              <div className="bg-surface-container p-6 rounded-lg border-2 border-dashed border-border text-center">
                <p className="text-text-secondary">No standard recipe templates available.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeListPage;