import type { Prisma } from '@prisma/client';

type RecipeWithFullRelations = Prisma.RecipeGetPayload<{
  include: {
    steps: {
      include: {
        parameterValues: {
          include: { parameter: true };
        };
        ingredients: {
          include: { ingredient: true };
        };
      };
    };
  };
}>;

export type FullRecipeResponse = ReturnType<typeof transformToFullRecipe>;

export function transformToFullRecipe(recipe: RecipeWithFullRelations) {
  const { steps, ...recipeBaseProperties } = recipe;

  return {
    ...recipeBaseProperties,
    totalWeight: recipe.totalWeight,
    hydrationPct: recipe.hydrationPct,
    saltPct: recipe.saltPct,
    name: recipe.name,
    notes: recipe.notes,
    fieldValues: [] as unknown[],
    steps: steps.map(({ parameterValues, ingredients, ...restStep }) => ({
      ...restStep,
      fields: parameterValues.map(spv => ({
        id: spv.id,
        recipeStepId: spv.recipeStepId,
        fieldId: spv.parameterId,
        value: spv.value,
        notes: spv.notes,
        name: spv.parameter.name,
      })),
      ingredients: ingredients.map(ing => ({
        ...ing,
        ingredientName: ing.ingredient?.name,
        ingredientCategoryId: ing.ingredient?.ingredientCategoryId,
      })),
    })),
  };
}

