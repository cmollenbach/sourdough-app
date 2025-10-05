export default function RecipeGlobalControls({ showAdvanced, onToggleAdvanced }: { showAdvanced: boolean, onToggleAdvanced: () => void }) {
  return (
    <div className="bg-surface-elevated p-2 rounded-lg shadow-card border border-border mb-4 flex justify-end items-center">
      {/* The p-2 makes it a relatively thin bar. Adjust as needed. */}
      {/* justify-end will push the content to the right. If you add more items, you might change this. */}
      <div> {/* Optional inner div if you plan to add more items and need specific group alignment */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary text-sm">
          {/* Switch Toggle Implementation */}
          <div className="relative">
            <input
              type="checkbox"
              id="advanced-toggle"
              className="sr-only" // Hide the default checkbox
              checked={showAdvanced}
              onChange={onToggleAdvanced}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${showAdvanced ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            <div
              className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                showAdvanced ? 'transform translate-x-full' : ''
              }`}
            ></div>
          </div>
          Show Advanced Fields
        </label>
        {/* Add more global controls here, they will align to the right due to justify-end on parent */}
      </div>
    </div>
  );
}