import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import RecipeForm from "../../components/Recipe/RecipeForm";
import RecipeStepList from "../../components/Recipe/RecipeStepList";
import RecipeStepEditor from "../../components/Recipe/RecipeStepEditor";
import type { RecipeStep, FullRecipe } from "../../types/recipe";

export default function RecipeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<FullRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStep, setEditingStep] = useState<RecipeStep | null>(null);
  const [fieldsMeta, setFieldsMeta] = useState<{ id: number; name: string; label?: string; type?: string }[]>([]);
  const [ingredientsMeta, setIngredientsMeta] = useState<{ id: number; name: string }[]>([]);
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
    fetch("/api/recipes/fields", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })
      .then(res => res.json())
      .then(setFieldsMeta)
      .catch(() => setFieldsMeta([]));

    fetch("/api/recipes/ingredients", {
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

  if (loading) return <div className="p-8 text-center">Loading recipe...</div>;
  if (!recipe) return <div className="p-8 text-center text-red-500">Recipe not found.</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 max-w-5xl mx-auto">
      {/* Column 1: Recipe Management */}
      <div className="flex-1 min-w-0">
        <RecipeForm
          recipe={recipe}
          fieldsMeta={fieldsMeta}
          onChange={changes => setRecipe({ ...recipe, ...changes })}
          onSave={() => {
            // TODO: Save recipe to backend
          }}
        />
      </div>
      {/* Column 2: Steps List */}
      <div className="w-full md:w-80">
        <h2 className="text-xl font-semibold mb-2">Steps</h2>
        <RecipeStepList
          steps={recipe.steps}
          fieldsMeta={fieldsMeta}
          ingredientsMeta={ingredientsMeta}
          onEdit={setEditingStep}
          onDuplicate={handleDuplicateStep}
          onRemove={handleRemoveStep}
        />
        <button
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleAddStep}
        >
          + Add Step
        </button>
      </div>
      {editingStep && (
        <RecipeStepEditor
          step={editingStep}
          onSave={handleSaveStep}
          onCancel={() => setEditingStep(null)}
          fieldsMeta={fieldsMeta}
          ingredientsMeta={ingredientsMeta}
        />
      )}
    </div>
  );
}