import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import RecipeStepList from "../../components/Recipe/RecipeStepList";
import RecipeStepEditor from "../../components/Recipe/RecipeStepEditor";
import RecipeCalculator from "../../components/Recipe/RecipeCalculator";
import RecipeTargets from "../../components/Recipe/RecipeTargets";
import RecipeGlobalControls from "../../components/Recipe/RecipeGlobalControls";
import { IonGrid, IonRow, IonCol, IonCard } from "@ionic/react";
import type { RecipeStep, FullRecipe } from "../../types/recipe";
import type { FieldMeta, IngredientMeta } from "../../types/recipeLayout";

export default function RecipeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<FullRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStep, setEditingStep] = useState<RecipeStep | null>(null);
  const [fieldsMeta, setFieldsMeta] = useState<FieldMeta[]>([]);
  const [ingredientsMeta, setIngredientsMeta] = useState<IngredientMeta[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/recipes/${id}/full`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch recipe");
        return res.json();
      })
      .then(setRecipe)
      .catch(() => addToast("Failed to load recipe", "error"))
      .finally(() => setLoading(false));
  }, [id, addToast]);

  useEffect(() => {
    fetch("/api/meta/recipe-fields", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })
      .then(res => res.json())
      .then(data => setFieldsMeta(data.fields || []))
      .catch(() => setFieldsMeta([]));

    fetch("/api/meta/ingredients", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })
      .then(res => res.json())
      .then(setIngredientsMeta)
      .catch(() => setIngredientsMeta([]));
  }, []);

  function handleSaveStep(updatedStep: RecipeStep) {
    if (!recipe) return;
    const exists = recipe.steps.some((s: RecipeStep) => s.id === updatedStep.id);
    setRecipe({
      ...recipe,
      steps: exists
        ? recipe.steps.map((s: RecipeStep) => (s.id === updatedStep.id ? updatedStep : s))
        : [...recipe.steps, updatedStep],
    });
    setEditingStep(null);
    // TODO: Send update to backend here
  }

  function handleAddStep() {
    if (!recipe) return;
    const nextOrder = recipe.steps.length ? Math.max(...recipe.steps.map((s: RecipeStep) => s.order)) + 1 : 1;
    setEditingStep({
      id: Date.now(),
      recipeId: recipe.id,
      stepTemplateId: 1,
      order: nextOrder,
      description: "",
      notes: "",
      fields: [],
      ingredients: [],
    });
  }

  function handleRemoveStep(stepId: number) {
    if (!recipe) return;
    setRecipe({
      ...recipe,
      steps: recipe.steps.filter((s: RecipeStep) => s.id !== stepId),
    });
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

  function toggleAdvanced() {
    setShowAdvanced(prev => !prev);
  }

  if (loading) return <div className="p-8 text-center">Loading recipe...</div>;
  if (!recipe) return <div className="p-8 text-center text-red-500">Recipe not found.</div>;

  return (
    <IonGrid>
      <IonRow>
        {/* Left Column: Targets, Calculator, Global Controls */}
        <IonCol size="12" sizeMd="7">
          {/* Targets at the top */}
          <IonCard className="mb-4 p-4">
            <RecipeTargets recipe={recipe} fieldsMeta={fieldsMeta} />
          </IonCard>
          {/* Calculator */}
          <IonCard className="mb-4 p-4">
            <RecipeCalculator
              recipe={recipe}
              steps={recipe.steps}
              fieldsMeta={fieldsMeta}
              ingredientsMeta={ingredientsMeta}
            />
          </IonCard>
          {/* Global controls */}
          <RecipeGlobalControls showAdvanced={showAdvanced} onToggleAdvanced={toggleAdvanced} />
        </IonCol>
        {/* Right Column: Steps list and actions */}
        <IonCol size="12" sizeMd="5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Steps</h2>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={handleAddStep}
            >
              + Add Step
            </button>
          </div>
          <RecipeStepList
            steps={recipe.steps}
            fieldsMeta={fieldsMeta}
            ingredientsMeta={ingredientsMeta}
            onEdit={setEditingStep}
            onDuplicate={handleDuplicateStep}
            onRemove={handleRemoveStep}
          />
          {editingStep && (
            <RecipeStepEditor
              step={editingStep}
              onSave={handleSaveStep}
              onCancel={() => setEditingStep(null)}
              fieldsMeta={fieldsMeta}
              ingredientsMeta={ingredientsMeta}
            />
          )}
        </IonCol>
      </IonRow>
    </IonGrid>
  );
}