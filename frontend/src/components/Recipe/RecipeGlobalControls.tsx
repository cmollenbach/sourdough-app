export default function RecipeGlobalControls({ showAdvanced, onToggleAdvanced }: { showAdvanced: boolean, onToggleAdvanced: () => void }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <label>
        <input type="checkbox" checked={showAdvanced} onChange={onToggleAdvanced} />
        Show Advanced Fields
      </label>
      {/* Add more global controls here */}
    </div>
  );
}