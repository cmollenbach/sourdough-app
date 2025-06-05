import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import type { Recipe } from "../../types/recipe";
import type { FieldMeta } from "../../types/recipeLayout";

export default function RecipesListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [fieldsMeta, setFieldsMeta] = useState<FieldMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/recipes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      }).then(res => {
        if (!res.ok) throw new Error("Failed to fetch recipes");
        return res.json();
      }),
      fetch("/api/recipes/meta", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      }).then(res => {
        if (!res.ok) throw new Error("Failed to fetch meta");
        return res.json();
      }),
    ])
      .then(([recipesData, metaData]) => {
        setRecipes(recipesData);
        setFieldsMeta(metaData.fields || []);
      })
      .catch(() => addToast("Failed to load recipes or meta", "error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading recipes...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Recipes</h1>
        <Link
          to="/recipes/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Recipe
        </Link>
      </div>
      {recipes.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No recipes found.</div>
      ) : (
        <ul className="divide-y">
          {recipes.map(recipe => (
            <li key={recipe.id} className="py-3 flex justify-between items-center">
              <div>
                {/* Core fields */}
                <div className="font-semibold">{recipe.name}</div>
                <div className="text-xs text-gray-500">
                  {recipe.isPredefined ? "Predefined" : "Personal"} &middot;{" "}
                  {recipe.createdAt
                    ? new Date(recipe.createdAt).toLocaleDateString()
                    : ""}
                  {recipe.notes && (
                    <span className="ml-2 italic text-gray-400">({recipe.notes})</span>
                  )}
                </div>
                {/* Dynamic fields (excluding core fields) */}
                {fieldsMeta
                  .filter(
                    f =>
                      f.visibleInList &&
                      !["name", "notes", "createdAt", "isPredefined"].includes(f.name)
                  )
                  .map(field => (
                    <div key={`${field.id}-${recipe.id}`}>
                      <span className="font-medium">{field.label || field.name}:</span>{" "}
                      {(recipe as Record<string, unknown>)[field.name] as string}
                    </div>
                  ))}
              </div>
              <Link
                to={`/recipes/${recipe.id}`}
                className="text-blue-600 hover:underline"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}