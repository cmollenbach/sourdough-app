// RecipeCalculator.tsx
import React, { useMemo } from "react"; // Added React and useMemo
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";
import { useRecipeCalculations } from "../../hooks/useRecipeCalculations";

// Helper function to format numbers with a thousands separator
function formatNumberWithCommas(num: number): string {
  return num.toLocaleString('en-US');
}

export default function RecipeCalculator() {
  const recipe = useRecipeBuilderStore((state) => state.recipe);
  const steps = useRecipeBuilderStore((state) => state.recipe?.steps ?? []);

  const calculatedValues = useRecipeCalculations(recipe, steps);

  // Get a unique sorted list of all *specific* flour types present in the recipe
  const allFlourTypesInRecipe = useMemo(() => {
    const specificFlours = new Map<number, string>();
    calculatedValues.columns.forEach(col => {
      col.flourComponents.forEach(fc => specificFlours.set(fc.ingredientId, fc.name));
    });
    return Array.from(specificFlours.entries()).map(([id, name]) => ({ id, name }))
                                             .sort((a, b) => a.name.localeCompare(b.name));
  }, [calculatedValues.columns]);

  if (!recipe) return <div className="p-4 border border-border rounded-lg shadow-card bg-surface-elevated text-text-secondary">Loading recipe data for calculator...</div>;

  return (
    <div className="p-4 border border-border rounded-lg shadow-card bg-surface-elevated mt-4">
      <h2 className="text-lg font-semibold mb-3 text-text-primary">Recipe Calculator (grams)</h2>
      
      {/* Main Calculation Table */}
      {(() => {
        const numStepCols = calculatedValues.columns.length;
        
        const gridTemplateColumns = numStepCols > 0
          ? `auto repeat(${numStepCols}, minmax(100px, 1fr)) auto`
          : 'auto auto';

        return (
          <div 
            className="grid gap-x-2 gap-y-1 text-sm mb-4 overflow-x-auto"
            style={{ gridTemplateColumns }}
          >
            {/* Header Row */}
            <div className="font-semibold sticky left-0 bg-surface-elevated z-10 pr-2 text-left">Ingredient</div>
            {calculatedValues.columns.map(col => (
              <div key={col.stepId} className="font-semibold text-center break-words">
                {col.name}
              </div>
            ))}
            <div className="font-semibold text-center ">Totals</div>

            {/* Ingredient Rows */}
            {allFlourTypesInRecipe.length > 0 ? (
              <>
                {allFlourTypesInRecipe.map(flourType => (
                  <React.Fragment key={`flour-type-${flourType.id}`}>
                    <div className="sticky left-0 bg-surface-elevated z-10 pr-2 text-left">{flourType.name}</div>
                    {calculatedValues.columns.map(col => {
                      const flourInStep = col.flourComponents.find(fc => fc.ingredientId === flourType.id);
                      const weight = flourInStep ? flourInStep.weight : 0;
                      return <div key={`${col.stepId}-flour-${flourType.id}`} className="text-center">{formatNumberWithCommas(parseFloat(weight.toFixed(0)))}</div>;
                    })}
                    <div className="text-center font-semibold">
                      {formatNumberWithCommas(parseFloat(calculatedValues.totals.flourDetails.find(fd => fd.ingredientId === flourType.id)?.totalWeight.toFixed(0) || "0"))}
                    </div>
                  </React.Fragment>
                ))}
                <div className="font-semibold sticky left-0 bg-surface-elevated z-10 pr-2 text-left border-t border-border pt-1">Total Flour</div>
                {calculatedValues.columns.map(col => {
                  const totalStepFlour = col.flourComponents.reduce((sum, fc) => sum + fc.weight, 0) + col.genericFlourWeight;
                  return <div key={`${col.stepId}-totalflour`} className="text-center font-medium border-t border-border pt-1">{formatNumberWithCommas(parseFloat(totalStepFlour.toFixed(0)))}</div>
                })}
                <div className="text-center font-bold border-t border-border pt-1">{formatNumberWithCommas(parseFloat(calculatedValues.totals.totalFlour.toFixed(0)))}</div>
              </>
            ) : (
              // Render single "Flour" row if no specific flours are used anywhere
              <>
                <div className="sticky left-0 bg-surface-elevated z-10 pr-2 text-left">Flour</div>
                {calculatedValues.columns.map(col => {
                   // If no specific flours, all flour is generic for the step
                  const stepFlour = col.genericFlourWeight + col.flourComponents.reduce((s,c) => s+c.weight,0);
                  return <div key={`${col.stepId}-generic-flour`} className="text-center">{formatNumberWithCommas(parseFloat(stepFlour.toFixed(0)))}</div>;
                })}
                <div className="text-center font-semibold">{formatNumberWithCommas(parseFloat(calculatedValues.totals.totalFlour.toFixed(0)))}</div>
              </>
            )}

            <div className="sticky left-0 bg-surface-elevated z-10 pr-2 text-left">Water</div>
            {calculatedValues.columns.map(col => <div key={`${col.stepId}-water`} className="text-center">{formatNumberWithCommas(parseFloat(col.waterWeight.toFixed(0)))}</div>)}
            <div className="text-center font-semibold">{formatNumberWithCommas(parseFloat(calculatedValues.totals.water.toFixed(0)))}</div>

            <div className="sticky left-0 bg-surface-elevated z-10 pr-2 text-left">Salt</div>
            {calculatedValues.columns.map(col => <div key={`${col.stepId}-salt`} className="text-center">{formatNumberWithCommas(parseFloat(col.saltWeight.toFixed(0)))}</div>)}
            <div className="text-center font-semibold">{formatNumberWithCommas(parseFloat(calculatedValues.totals.salt.toFixed(0)))}</div>

            {/* Total Row */}
            <div className="font-semibold sticky left-0 bg-surface-elevated z-10 pr-2 text-left">Step Total</div>
            {calculatedValues.columns.map(col => <div key={`${col.stepId}-total`} className="text-center font-medium">{formatNumberWithCommas(parseFloat(col.totalWeight.toFixed(0)))}</div>)}
            <div className="text-center font-bold">{formatNumberWithCommas(parseFloat(calculatedValues.totals.grandTotal.toFixed(0)))}</div>
          </div>
        );
      })()}
    </div>
  );
}
