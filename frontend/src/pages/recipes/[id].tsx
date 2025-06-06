import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RecipeLayout from "../../components/Recipe/RecipeLayout";
import { apiGet } from "../../utils/api";
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";

export default function RecipeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);

  // Use Zustand selectors for all recipe/meta/UI state
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
    if (!id) return;
    setLoading(true);
    Promise.all([
      apiGet<{ templates: any[] }>("/meta/step-templates"),
      apiGet<any[]>("/meta/ingredients"),
      apiGet<{ fields: any[] }>("/meta/recipe-fields"),
      apiGet<any>(`/recipes/${id}/full`),
    ])
      .then(([stepTemplatesData, ingredientsMetaData, fieldsMetaData, recipeData]) => {
        setStepTemplates(stepTemplatesData.templates || []);
        setIngredientsMeta(ingredientsMetaData || []);
        setFieldsMeta(fieldsMetaData.fields || []);
        setRecipe(recipeData);
      })
      .catch((err) => {
        console.error("Error loading recipe data:", err);
      })
      .finally(() => setLoading(false));
  }, [id, setRecipe, setStepTemplates, setIngredientsMeta, setFieldsMeta]);

  if (loading || !recipe) return <div>Loading...</div>;

  return <RecipeLayout />;
}