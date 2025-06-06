import React from "react";
import type { RecipeStep } from "../../types/recipe";
import type { FieldMeta, IngredientMeta } from "../../types/recipeLayout";

interface RecipeStepListProps {
  steps: RecipeStep[];
  fieldsMeta: FieldMeta[];
  ingredientsMeta: IngredientMeta[];
  onEdit: (step: RecipeStep) => void;
  onDuplicate: (step: RecipeStep) => void;
  onRemove: (stepId: number) => void;
}

const RecipeStepList: React.FC<RecipeStepListProps> = ({
  steps,
  fieldsMeta,
  ingredientsMeta,
  onEdit,
  onDuplicate,
  onRemove,
}) => {
  const safeIngredientsMeta = Array.isArray(ingredientsMeta) ? ingredientsMeta : [];

  return (
    <div>
      {steps.map((step, idx) => (
        <div key={step.id} className="mb-4 p-3 border rounded shadow-sm bg-white">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Step {idx + 1}</span>
            <div className="flex gap-2">
              <button onClick={() => onEdit(step)} className="text-blue-600">Edit</button>
              <button onClick={() => onDuplicate(step)} className="text-yellow-600">Duplicate</button>
              <button onClick={() => onRemove(step.id)} className="text-red-600">Remove</button>
            </div>
          </div>
          {step.description && <div><strong>Description:</strong> {step.description}</div>}
          {step.notes && <div><strong>Notes:</strong> {step.notes}</div>}
          {step.fields.length > 0 && (
            <div>
              <strong>Fields:</strong>
              <ul className="list-disc ml-5">
                {step.fields.map(field => {
                  const meta = fieldsMeta.find(fm => fm.id === field.fieldId);
                  return (
                    <li key={field.id}>
                      {meta ? meta.name : `Field ID: ${field.fieldId}`}: {field.value}
                      {field.notes && <> ({field.notes})</>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {step.ingredients.length > 0 && (
            <div>
              <strong>Ingredients:</strong>
              <ul className="list-disc ml-5">
                {step.ingredients.map(ing => {
                  const ingredientMeta = safeIngredientsMeta.find(im => im.id === ing.ingredientId);
                  return (
                    <li key={ing.id}>
                      {ingredientMeta ? ingredientMeta.name : `Ingredient ID: ${ing.ingredientId}`}, {ing.percentage}%
                      {ing.preparation && <> ({ing.preparation})</>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RecipeStepList;