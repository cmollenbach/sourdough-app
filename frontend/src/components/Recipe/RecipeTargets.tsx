import type { FullRecipe } from "../../types/recipe";
import type { FieldMeta } from "../../types/recipeLayout";

interface RecipeTargetsProps {
  recipe: FullRecipe;
  fieldsMeta: FieldMeta[];
}

export default function RecipeTargets({ recipe, fieldsMeta }: RecipeTargetsProps) {
  // Filter for any *other* dynamic numeric fields if they exist.
  // Name and Notes are now direct properties.
  const otherNumericTargetFields = fieldsMeta.filter(
    f => f.visible && f.type === "number" && !['totalWeight', 'hydrationPct', 'saltPct', 'name', 'notes'].includes(f.name)
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Targets</h2>
      <div>
        <div>
          <strong>{recipe.name ?? "Unnamed Recipe"}</strong>
        </div>
        {/* Display core targets directly */}
        <div className="mt-1"><label className="font-medium text-sm text-gray-700">Total Dough Weight:</label> <div className="text-gray-900">{recipe.totalWeight ?? 'N/A'} g</div></div>
        <div className="mt-1"><label className="font-medium text-sm text-gray-700">Hydration:</label> <div className="text-gray-900">{recipe.hydrationPct ?? 'N/A'} %</div></div>
        <div className="mt-1"><label className="font-medium text-sm text-gray-700">Salt:</label> <div className="text-gray-900">{recipe.saltPct ?? 'N/A'} %</div></div>

        {otherNumericTargetFields.map(field => (
          <div key={field.id} className="mt-1">
            <label className="font-medium text-sm text-gray-700">{field.label || field.name}:</label>
            <div className="text-gray-900">
              {recipe.fieldValues?.find(fv => fv.fieldId === field.id)?.value || "N/A"}
            </div>
          </div>
        ))}
        {recipe.notes && (
          <div className="mt-2">
            <label className="font-medium text-sm text-gray-700">Notes:</label>
            <div className="text-gray-900 whitespace-pre-wrap">{recipe.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}