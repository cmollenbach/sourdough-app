import type { Bake } from '@sourdough/shared';


interface BakeTargetsDisplayProps {
  bake: Bake;
}

export default function BakeTargetsDisplay({ bake }: BakeTargetsDisplayProps) {
  if (!bake.recipeTotalWeightSnapshot && !bake.recipeHydrationPctSnapshot && !bake.recipeSaltPctSnapshot) {
    return null; // Don't render if no snapshot data is available (e.g., for very old bakes before this feature)
  }

  return (
    <div className="mb-4 p-3 bg-surface-elevated rounded-md border border-border">
      <h3 className="text-md font-semibold text-text-secondary mb-2">Original Recipe Targets (at time of bake):</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
        <div>
          <span className="font-medium text-text-tertiary">Total Dough Weight: </span>
          <span className="text-text-primary">{bake.recipeTotalWeightSnapshot ?? 'N/A'} g</span>
        </div>
        <div>
          <span className="font-medium text-text-tertiary">Hydration: </span>
          <span className="text-text-primary">{bake.recipeHydrationPctSnapshot ?? 'N/A'} %</span>
        </div>
        <div>
          <span className="font-medium text-text-tertiary">Salt: </span>
          <span className="text-text-primary">{bake.recipeSaltPctSnapshot ?? 'N/A'} %</span>
        </div>
      </div>
    </div>
  );
}