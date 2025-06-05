import React, { useState } from "react";
import type { RecipeStepField, RecipeStepIngredient } from "../../types/recipe";
import type { RecipeStepEditorProps } from "../../types/recipeLayout";

const RecipeStepEditor: React.FC<RecipeStepEditorProps> = ({
  step,
  onSave,
  onCancel,
  fieldsMeta,
  ingredientsMeta,
}) => {
  const [description, setDescription] = useState(step.description ?? "");
  const [notes, setNotes] = useState(step.notes ?? "");
  const [fields, setFields] = useState<RecipeStepField[]>([...step.fields]);
  const [ingredients, setIngredients] = useState<RecipeStepIngredient[]>([...step.ingredients]);

  // Handle field value change
  const handleFieldChange = (fieldId: number, value: string | number) => {
    setFields((fields) =>
      fields.some((f) => f.fieldId === fieldId)
        ? fields.map((f) =>
            f.fieldId === fieldId ? { ...f, value } : f
          )
        : [
            ...fields,
            {
              id: 0, // or -1 for new/unsaved
              recipeStepId: step.id,
              fieldId,
              value,
            },
          ]
    );
  };

  // Handle ingredient percentage change
  const handleIngredientChange = (ingredientId: number, percentage: number) => {
    setIngredients((ings) =>
      ings.some((ing) => ing.ingredientId === ingredientId)
        ? ings.map((ing) =>
            ing.ingredientId === ingredientId ? { ...ing, percentage } : ing
          )
        : [
            ...ings,
            {
              id: 0, // or -1 for new/unsaved
              recipeStepId: step.id,
              ingredientId,
              percentage,
            },
          ]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Edit Step</h2>
        <input
          className="border rounded px-2 py-1 w-full mb-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Step Description"
        />
        <textarea
          className="border rounded px-2 py-1 w-full mb-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
        />

        {/* Dynamic Step Fields */}
        {fieldsMeta.length > 0 && (
          <div className="mb-2">
            <strong>Fields:</strong>
            {fieldsMeta.map((meta) => {
              const field = fields.find((f) => f.fieldId === meta.id);
              return (
                <div key={meta.id} className="mb-1">
                  <label className="block text-sm">
                    {meta.label || meta.name}
                  </label>
                  <input
                    className="border rounded px-2 py-1 w-full"
                    type={meta.type === "number" ? "number" : "text"}
                    value={field ? field.value : ""}
                    onChange={(e) =>
                      handleFieldChange(
                        meta.id,
                        meta.type === "number" ? Number(e.target.value) : e.target.value
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Ingredients */}
        {ingredientsMeta.length > 0 && (
          <div className="mb-2">
            <strong>Ingredients:</strong>
            {ingredientsMeta.map((meta) => {
              const ing = ingredients.find((i) => i.ingredientId === meta.id);
              return (
                <div key={meta.id} className="mb-1 flex items-center gap-2">
                  <label className="block text-sm w-32">{meta.name}</label>
                  <input
                    className="border rounded px-2 py-1 w-20"
                    type="number"
                    value={ing ? ing.percentage : ""}
                    onChange={(e) =>
                      handleIngredientChange(meta.id, Number(e.target.value))
                    }
                    placeholder="%"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 rounded bg-gray-200"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white"
            onClick={() =>
              onSave({
                ...step,
                description,
                notes,
                fields,
                ingredients,
              })
            }
            type="button"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeStepEditor;