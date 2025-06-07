import type { FullRecipe } from "../../types/recipe";
import type { FieldMeta } from "../../types/recipeLayout";

interface TargetEditorProps {
  recipe: FullRecipe;
  fieldsMeta: FieldMeta[];
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  onChange: (updated: FullRecipe) => void;
}

export function TargetEditor({
  recipe,
  fieldsMeta,
  showAdvanced,
  setShowAdvanced,
  onChange,
}: TargetEditorProps) {
  // Merge meta and values
  const mergedFields = fieldsMeta
    .filter(f => showAdvanced || !f.advanced)
    .map(meta => ({
      ...meta,
      value: recipe.fieldValues?.find(v => v.fieldId === meta.id)?.value ?? meta.defaultValue ?? "",
    }));

  return (
    <div className="mb-6 p-4 bg-white rounded-xl shadow border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">Recipe Info</h2>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showAdvanced}
            onChange={e => setShowAdvanced(e.target.checked)}
            className="accent-blue-600"
          />
          Show advanced fields
        </label>
      </div>
      <div className="flex flex-col gap-3">
        {mergedFields.map(field => (
          <div key={field.id}>
            <label className="block font-medium">{field.label || field.name}</label>
            <input
              className="border rounded px-3 py-2"
              type={field.type === "number" ? "number" : "text"}
              value={field.value}
              onChange={e => {
                const newValue = e.target.value;
                onChange({
                  ...recipe,
                  fieldValues: [
                    ...(recipe.fieldValues?.filter(fv => fv.fieldId !== field.id) ?? []),
                    { fieldId: field.id, value: newValue }
                  ]
                });
              }}
              placeholder={field.helpText || ""}
            />
          </div>
        ))}
      </div>
    </div>
  );
}