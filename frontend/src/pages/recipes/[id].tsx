import { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import RecipeLayout from "../../components/Recipe/RecipeLayout";
import { apiGet } from "../../utils/api";
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";
import type { FullRecipe, RecipeStep, RecipeStepField, RecipeStepIngredient } from "../../types/recipe";

const SIMPLE_BASE_RECIPE_ID = 1; // ID of your "Simple Base Recipe"

async function fetchFullRecipeData(id: number): Promise<FullRecipe | null> {
  try {
    return await apiGet<FullRecipe>(`/recipes/${id}/full`);
  } catch (error) {
    console.error(`Error fetching recipe ${id}:`, error);
    return null;
  }
}

function createNewRecipeFromBaseTemplate(baseRecipe: FullRecipe, existingRecipeNames: string[] = []): FullRecipe {
  let newName = "Untitled";
  let counter = 1;
  // This simple check can be improved if many "Untitled X" recipes are expected.
  while (existingRecipeNames.includes(newName)) {
    newName = `Untitled ${counter}`;
    counter++;
  }
  return {
    ...baseRecipe,
    id: 0, // Mark as new
    name: newName,
    steps: baseRecipe.steps.map((step, stepIdx) => ({
      ...step,
      id: 0, recipeId: 0, order: step.order || stepIdx + 1,
      fields: step.fields.map(f => ({ ...f, id: 0, recipeStepId: 0 } as RecipeStepField)),
      ingredients: step.ingredients.map(i => ({ ...i, id: 0, recipeStepId: 0 } as RecipeStepIngredient)),
    } as RecipeStep)),
    fieldValues: baseRecipe.fieldValues.map(fv => ({ ...fv })),
  };
}

export default function RecipeBuilderPage() {
  const { id } = useParams<{ id: string | undefined }>(); // id can now be undefined
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const {
    recipe,
    stepTemplates,
    ingredientsMeta,
    fieldsMeta,
    showAdvanced,
    setRecipe,
    setStepTemplates,
    setIngredientsMeta,
    setFieldsMeta,
    setShowAdvanced,
  } = useRecipeBuilderStore();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const initializePage = async () => {
      try {
        // Fetch metadata first, always needed
        const [stepTemplatesData, ingredientsMetaData, fieldsMetaData] = await Promise.all([
          apiGet<{ templates: StepTemplate[] }>("/meta/step-templates"),
          apiGet<IngredientMeta[]>("/meta/ingredients"),
          apiGet<{ fields: FieldMeta[] }>("/meta/recipe-fields"),
        ]);

        if (!isMounted) return;

        setStepTemplates(stepTemplatesData.templates || []);
        setIngredientsMeta(ingredientsMetaData || []);
        setFieldsMeta(fieldsMetaData.fields || []);

        if (id && id !== "new" && id !== "0") { // Existing recipe ID
          const recipeData = await fetchFullRecipeData(Number(id));
          if (isMounted) {
            if (recipeData) {
              setRecipe(recipeData);
            } else {
              console.error(`Recipe with id ${id} not found.`);
              history.push("/404"); // Or handle error: set an error state
            }
          }
        } else { // New recipe mode (id is undefined, "new", or "0")
          const baseRecipeData = await fetchFullRecipeData(SIMPLE_BASE_RECIPE_ID);
          if (isMounted) {
            if (baseRecipeData) {
              // Fetch existing recipe names to generate a unique "Untitled" name (optional enhancement)
              // const recipeStubs = await apiGet<RecipeStub[]>("/recipes");
              // const existingNames = recipeStubs.map(r => r.name);
              // const newRecipe = createNewRecipeFromBaseTemplate(baseRecipeData, existingNames);
              const newRecipe = createNewRecipeFromBaseTemplate(baseRecipeData); // Simpler version for now
              setRecipe(newRecipe);
            } else {
              console.error("Base recipe template (ID 1) not found.");
              // Potentially set a truly blank recipe or show an error
            }
          }
        }
      } catch (err) {
        if (isMounted) console.error("Error loading recipe data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializePage();
    return () => { isMounted = false; };
  }, [id, history, setRecipe, setStepTemplates, setIngredientsMeta, setFieldsMeta]);

  if (loading) return <div className="p-8 text-center">Loading recipe editor...</div>;
  if (!recipe) return <div className="p-8 text-center">Recipe data could not be loaded.</div>;

  return <RecipeLayout />;
}