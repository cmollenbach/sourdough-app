// RecipeCalculator.tsx
import React, { useMemo } from "react";
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

  const columnsWithIngredients = useMemo(() => (
    calculatedValues.columns.filter(
      col =>
        col.flourComponents.some(fc => fc.weight > 0) ||
        col.waterWeight > 0 || // Check if waterWeight is greater than 0
        col.saltWeight > 0    // Check if saltWeight is greater than 0
    )
  ), [calculatedValues.columns]);
  
  const allFlourTypesInRecipe = useMemo(() => {
    const specificFlours = new Map<number, string>();
    columnsWithIngredients.forEach(col => {
      col.flourComponents.forEach(fc => specificFlours.set(fc.ingredientId, fc.name));
    });
    return Array.from(specificFlours.entries()).map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [columnsWithIngredients]);

  const formatWeight = (weight: number) => formatNumberWithCommas(parseFloat(weight.toFixed(0)));
  
  // --- Refactored Data Transformation for Table Rendering ---
  interface TableRowData {
    isHeader?: boolean;
    isTotal?: boolean;
    isSubTotal?: boolean;
    isIndented?: boolean;
    label: string;
    stepValues: (string | number)[];
    totalValue: string | number;
  }

  const tableDisplayData = useMemo((): TableRowData[] => {
    if (!calculatedValues) return [];

    const rows: TableRowData[] = [];

    // Flour Rows
    rows.push({
      label: "Total Flour",
      isSubTotal: true,
      stepValues: columnsWithIngredients.map(col => 
        formatWeight(col.flourComponents.reduce((sum, fc) => sum + fc.weight, 0) + col.genericFlourWeight)
      ),
      totalValue: formatWeight(calculatedValues.totals.totalFlour),
    });

    allFlourTypesInRecipe.forEach(flourType => {
      rows.push({
        label: flourType.name,
        isIndented: true,
        stepValues: columnsWithIngredients.map(col => {
          const flourInStep = col.flourComponents.find(fc => fc.ingredientId === flourType.id);
          return formatWeight(flourInStep ? flourInStep.weight : 0);
        }),
        totalValue: formatWeight(calculatedValues.totals.flourDetails.find(fd => fd.ingredientId === flourType.id)?.totalWeight || 0),
      });
    });

    // Water Row
    rows.push({ label: "Water", stepValues: columnsWithIngredients.map(col => formatWeight(col.waterWeight)), totalValue: formatWeight(calculatedValues.totals.water) });
    // Salt Row
    rows.push({ label: "Salt", stepValues: columnsWithIngredients.map(col => formatWeight(col.saltWeight)), totalValue: formatWeight(calculatedValues.totals.salt) });

    return rows;
  }, [calculatedValues, columnsWithIngredients, allFlourTypesInRecipe, formatWeight]);
  // --- End of Refactored Data Transformation ---

  if (!recipe) return (
    <div className="p-4 border border-border rounded-lg shadow-card bg-surface-elevated text-text-secondary">
      Loading recipe data for calculator...
    </div>
  );

  return (
    <div className="p-4 border border-border rounded-lg shadow-card bg-surface-elevated mt-4">
      <h2 className="text-lg font-semibold mb-3 text-text-primary">Recipe Calculator (grams)</h2>
      {/* Main Calculation Table */}
      {(() => {
        const numStepCols = columnsWithIngredients.length;
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
            {columnsWithIngredients.map(col => (
              <div key={col.stepId} className="font-semibold text-center break-words">
                {col.name}
              </div>
            ))}
            <div className="font-semibold text-center ">Totals</div>

            {/* Ingredient Rows */}
            {tableDisplayData.map((row, rowIndex) => (
              <React.Fragment key={`row-${rowIndex}-${row.label}`}>
                <div className={`sticky left-0 bg-surface-elevated z-10 pr-2 text-left ${row.isSubTotal ? 'font-semibold border-t border-border pt-1' : ''} ${row.isIndented ? 'pl-4' : ''}`}>
                  {row.label}
                </div>
                {row.stepValues.map((value, colIndex) => (
                  <div 
                    key={`row-${rowIndex}-col-${colIndex}`} 
                    className={`text-center ${row.isSubTotal ? 'font-medium border-t border-border pt-1' : ''}`}
                  >
                    {value}
                  </div>
                ))}
                <div className={`text-center font-semibold ${row.isSubTotal ? 'font-bold border-t border-border pt-1' : ''}`}>
                  {row.totalValue}
                </div>
              </React.Fragment>
            ))}

            {/* Total Row */}
            <div className="font-semibold sticky left-0 bg-surface-elevated z-10 pr-2 text-left">Step Total</div>
            {columnsWithIngredients.map(col => <div key={`${col.stepId}-total`} className="text-center font-medium">{formatNumberWithCommas(parseFloat(col.totalWeight.toFixed(0)))}</div>)}
            <div className="text-center font-bold">{formatNumberWithCommas(parseFloat(calculatedValues.totals.grandTotal.toFixed(0)))}</div>
          </div>
        );
      })()}
    </div>
  );
}
