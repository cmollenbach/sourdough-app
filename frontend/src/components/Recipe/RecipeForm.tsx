import React from "react";
import type { FullRecipe } from "../../types/recipe";

interface FieldMeta {
  id: number;
  name: string;
  label?: string;
  type?: string; // e.g. "text", "number", "textarea"
}

interface RecipeFieldValue {
  fieldId: number;
  value: string;
}

interface RecipeFormProps {
  recipe: FullRecipe;
  fieldsMeta: FieldMeta[];
  onChange: (changes: Partial<FullRecipe>) => void;
  onSave: () => void;
}

const getFieldValue = (fieldValues: RecipeFieldValue[], fieldId: number) =>
  fieldValues.find(fv => fv.fieldId === fieldId)?.value ?? "";

const handleFieldChange = (
  fieldId: number,
  value: string,
  recipe: FullRecipe,
  onChange: (changes: Partial<FullRecipe>) => void
) => {
  const fieldValues = recipe.fieldValues || [];
  const updatedFieldValues = fieldValues.some(fv => fv.fieldId === fieldId)
    ? fieldValues.map(fv =>
        fv.fieldId === fieldId ? { ...fv, value } : fv
      )
    : [...fieldValues, { fieldId, value }];
  onChange({ fieldValues: updatedFieldValues });
};

const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, fieldsMeta, onChange, onSave }) => {
  const fieldValues = recipe.fieldValues || [];

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSave();
      }}
      className="mb-4"
    >
      {fieldsMeta.map(field => (
        <div className="mb-2" key={field.id}>
          <label className="block font-semibold">
            {field.label || field.name}
          </label>
          {field.type === "textarea" ? (
            <textarea
              className="border rounded px-2 py-1 w-full"
              value={getFieldValue(fieldValues, field.id)}
              onChange={e =>
                handleFieldChange(field.id, e.target.value, recipe, onChange)
              }
            />
          ) : (
            <input
              className="border rounded px-2 py-1 w-full"
              type={field.type || "text"}
              value={getFieldValue(fieldValues, field.id)}
              onChange={e =>
                handleFieldChange(
                  field.id,
                  field.type === "number" ? String(Number(e.target.value)) : e.target.value,
                  recipe,
                  onChange
                )
              }
            />
          )}
        </div>
      ))}
      <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
        Save Recipe
      </button>
    </form>
  );
};

export default RecipeForm;