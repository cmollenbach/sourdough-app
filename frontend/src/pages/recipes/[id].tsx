import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RecipeLayout from "../../components/Recipe/RecipeLayout";
import type { RecipeStep, FullRecipe } from "../../types/recipe";
import type { FieldMeta, IngredientMeta, StepTemplate } from "../../types/recipeLayout";
import { apiGet } from "../../utils/api";
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";
import { useToast } from "../../context/ToastContext";

export default function RecipeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [fieldsMeta, setFieldsMeta] = useState<FieldMeta[]>([]);
  const [ingredientsMeta, setIngredientsMeta] = useState<IngredientMeta[]>([]);
  const [stepTemplates, setStepTemplates] = useState<StepTemplate[]>([]);
  const [showAdvanced] = useState(false);

  const recipe = useRecipeBuilderStore(state => state.recipe);
  const setRecipe = useRecipeBuilderStore(state => state.setRecipe);
  const updateStep = useRecipeBuilderStore(state => state.updateStep);
  const removeStep = useRecipeBuilderStore(state => state.removeStep);
  const { addToast } = useToast();

  useEffect(() => {
    if (!id) return;
    apiGet<FullRecipe>(`/recipes/${id}/full`)
      .then(setRecipe)
      .catch(() => addToast("Failed to load recipe", "error"))
      .finally(() => setLoading(false));
  }, [id, addToast, setRecipe]);

  useEffect(() => {
    apiGet<{ fields: FieldMeta[] }>("/meta/recipe-fields")
      .then(data => setFieldsMeta(data.fields || []))
      .catch(() => setFieldsMeta([]));

    apiGet<IngredientMeta[]>("/meta/ingredients")
      .then(setIngredientsMeta)
      .catch(() => setIngredientsMeta([]));
  }, []);

  useEffect(() => {
    apiGet<{ templates: StepTemplate[] }>("/meta/step-templates")
      .then(data => setStepTemplates(data.templates || []))
      .catch(() => setStepTemplates([]));
  }, []);

  function handleSaveStep(updatedStep: RecipeStep) {
    updateStep(updatedStep);
    // TODO: Send update to backend here
  }

  function handleRemoveStep(stepId: number) {
    removeStep(stepId);
    // TODO: Send removal to backend here
  }

  function handleDuplicateStep(step: RecipeStep) {
    if (!recipe) return;
    const nextOrder = recipe.steps.length ? Math.max(...recipe.steps.map((s: RecipeStep) => s.order)) + 1 : 1;
    const newStep = {
      ...step,
      id: Date.now(),
      order: nextOrder,
      description: (step.description || "") + " (Copy)",
      fields: [...step.fields],
      ingredients: [...step.ingredients],
    };
    setRecipe({
      ...recipe,
      steps: [...recipe.steps, newStep],
    });
    // TODO: Send duplication to backend here
  }

  if (loading) return <div className="p-8 text-center">Loading recipe...</div>;
  if (!recipe) return <div className="p-8 text-center text-red-500">Recipe not found.</div>;

  return (
    <RecipeLayout
      recipe={recipe}
      steps={recipe.steps}
      stepTemplates={stepTemplates}
      fieldsMeta={fieldsMeta}
      stepFieldsMeta={fieldsMeta}
      ingredientsMeta={ingredientsMeta}
      showAdvanced={showAdvanced}
      onStepDuplicate={handleDuplicateStep}
      onStepRemove={handleRemoveStep}
      onStepSave={handleSaveStep}
    />
  );
}