import type { FullRecipe } from "../../types/recipe";

interface TargetEditorProps {
  recipe: FullRecipe;
  showAdvanced: boolean; 
  setShowAdvanced: (show: boolean) => void; 
  onChange: (updated: FullRecipe) => void;
}

export function TargetEditor({
  recipe,
  showAdvanced,
  setShowAdvanced,
  onChange,
}: TargetEditorProps) {
  return (
    <div className="mb-6 p-4 bg-surface-elevated rounded-xl shadow-card border border-border">
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
      {/* Core target inputs in one line */}
      <div className="flex flex-col md:flex-row gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <label htmlFor="totalWeight" className="block font-medium text-sm mb-1 text-text-secondary">Total Weight (g)</label>
          <input
            id="totalWeight"
            className="border border-border rounded px-3 py-2 w-full text-center bg-surface text-text-primary focus:border-primary-300 focus:ring-1 focus:ring-primary-100 transition-colors"
            type="number"
            value={recipe.totalWeight ?? ""}
            onChange={(e) =>
              onChange({ ...recipe, totalWeight: e.target.value ? parseFloat(e.target.value) : null })
            }
            placeholder="e.g., 1000"
          />
        </div>
        <div className="flex-1 min-w-0">
          <label htmlFor="hydrationPct" className="block font-medium text-sm mb-1 text-text-secondary">Hydration (%)</label>
          <input
            id="hydrationPct"
            className="border border-border rounded px-3 py-2 w-full text-center bg-surface text-text-primary focus:border-primary-300 focus:ring-1 focus:ring-primary-100 transition-colors"
            type="number"
            value={recipe.hydrationPct ?? ""}
            onChange={(e) =>
              onChange({ ...recipe, hydrationPct: e.target.value ? parseFloat(e.target.value) : null })
            }
            placeholder="e.g., 75"
          />
        </div>
        <div className="flex-1 min-w-0">
          <label htmlFor="saltPct" className="block font-medium text-sm mb-1 text-text-secondary">Salt (%)</label>
          <input
            id="saltPct"
            className="border border-border rounded px-3 py-2 w-full text-center bg-surface text-text-primary focus:border-primary-300 focus:ring-1 focus:ring-primary-100 transition-colors"
            type="number"
            value={recipe.saltPct ?? ""}
            onChange={(e) =>
              onChange({ ...recipe, saltPct: e.target.value ? parseFloat(e.target.value) : null })
            }
            placeholder="e.g., 2"
          />
        </div>
      </div>

      {/* Notes field remains below */}
      <div className="flex flex-col gap-3">
        <div>
        <label className="block font-medium">Notes</label>
        <textarea
          className="form-input w-full rounded"
          value={recipe.notes ?? ""}
          onChange={(e) => onChange({ ...recipe, notes: e.target.value })}
          placeholder="Any special notes about this recipe..."
          rows={3}
          />
        </div>
      </div>
    </div>
  );
}