import React from "react";
import type { FullRecipe } from "../../types/recipe";

interface TargetEditorProps {
  recipe: FullRecipe;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  onChange: (updated: FullRecipe) => void;
}

export function TargetEditor({ recipe, showAdvanced, setShowAdvanced, onChange }: TargetEditorProps) {
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
        <input
          className="border rounded px-3 py-2"
          value={recipe.name}
          onChange={e => onChange({ ...recipe, name: e.target.value })}
          placeholder="Recipe name"
        />
        <textarea
          className="border rounded px-3 py-2"
          value={recipe.notes || ""}
          onChange={e => onChange({ ...recipe, notes: e.target.value })}
          placeholder="Description"
        />
        {/* Add more fields here, and conditionally render advanced fields */}
        {showAdvanced && (
          <div>
            {/* Advanced fields go here */}
          </div>
        )}
      </div>
    </div>
  );
}