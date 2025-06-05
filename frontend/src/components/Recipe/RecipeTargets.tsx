import type { FullRecipe } from "../../types/recipe";
import type { FieldMeta } from "../../types/recipeLayout";

interface RecipeTargetsProps {
  recipe: FullRecipe;
  fieldsMeta: FieldMeta[];
}

export default function RecipeTargets({ recipe, fieldsMeta }: RecipeTargetsProps) {
  // Only show fields that are visible and of type "number"
  const targetFields = fieldsMeta.filter(f => f.visible && f.type === "number");

  // Print the filtered fields to the console
  console.log("RecipeTargets targetFields:", targetFields);
  console.log("RecipeTargets fieldsMeta:", fieldsMeta);

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Targets</h2>
      <div>
        <div>
          <strong>{recipe.name}</strong>
        </div>
        {targetFields.map(field => (
          <div key={field.id}>
            <label>{field.label || field.name}</label>
            <div>
              {(recipe.fieldValues?.find(fv => fv.fieldId === field.id)?.value) || ""}
            </div>
          </div>
        ))}
        <div>
          <label>Notes</label>
          <div>{recipe.notes}</div>
        </div>
      </div>
    </div>
  );
}