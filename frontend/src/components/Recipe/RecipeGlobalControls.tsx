export default function RecipeGlobalControls({ showAdvanced, onToggleAdvanced }: { showAdvanced: boolean, onToggleAdvanced: () => void }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary">
        <input type="checkbox" checked={showAdvanced} onChange={onToggleAdvanced} className="form-checkbox rounded text-primary-500 focus:ring-primary-200" />
        Show Advanced Fields
      </label>
      {/* Add more global controls here */}
    </div>
  );
}