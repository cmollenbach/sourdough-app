import type { FullRecipe, RecipeStep } from "../../types/recipe";
import type { FieldMeta, IngredientMeta } from "../../types/recipeLayout";

interface RecipeCalculatorProps {
  recipe: FullRecipe;
  steps: RecipeStep[];
  fieldsMeta: FieldMeta[];
  ingredientsMeta: IngredientMeta[];
}

export default function RecipeCalculator({
  recipe,
  steps,
  fieldsMeta,
  ingredientsMeta,
}: RecipeCalculatorProps) {
  // Silence unused variable warnings until implemented
  void recipe; void steps; void fieldsMeta; void ingredientsMeta;

  // TODO: Implement calculator logic
  return <div>Recipe Calculator</div>;
}