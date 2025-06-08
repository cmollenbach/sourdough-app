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
    <div className="p-4 border border-border rounded-lg shadow-card bg-surface-elevated mb-6">
      <h2 className="text-xl font-bold mb-3 text-text-primary">Targets</h2>
      <div>
        <div>
          <strong className="text-text-primary">{recipe.name ?? "Unnamed Recipe"}</strong>
        </div>
        {/* Display core targets directly */}
        <div className="mt-1"><label className="font-medium text-sm text-text-secondary">Total Dough Weight:</label> <div className="text-text-primary">{recipe.totalWeight ?? 'N/A'} g</div></div>
        <div className="mt-1"><label className="font-medium text-sm text-text-secondary">Hydration:</label> <div className="text-text-primary">{recipe.hydrationPct ?? 'N/A'} %</div></div>
        <div className="mt-1"><label className="font-medium text-sm text-text-secondary">Salt:</label> <div className="text-text-primary">{recipe.saltPct ?? 'N/A'} %</div></div>

        {otherNumericTargetFields.map(field => (
          <div key={field.id} className="mt-1">
            <label className="font-medium text-sm text-text-secondary">{field.label || field.name}:</label>
            <div className="text-text-primary">
              {recipe.fieldValues?.find(fv => fv.fieldId === field.id)?.value || "N/A"}
            </div>
          </div>
        ))}
        {recipe.notes && (
          <div className="mt-2">
            <label className="font-medium text-sm text-text-secondary">Notes:</label>
            <div className="text-text-primary whitespace-pre-wrap">{recipe.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}