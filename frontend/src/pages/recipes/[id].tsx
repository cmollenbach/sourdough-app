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
import { apiGet } from "../../utils/api";
import { useRecipeBuilderStore } from "../../store/recipeBuilderStore";

export default function RecipeBuilderPage() {
  const { id } = useParams<{ id: string }>();

  // Tracks whether the page is still loading data from the backend
  const [loading, setLoading] = useState(true);

  // Holds the step currently being edited (or null if none)
  const [editingStep, setEditingStep] = useState<RecipeStep | null>(null);

  // Holds metadata about recipe fields (e.g., field definitions for dynamic forms)
  const [fieldsMeta, setFieldsMeta] = useState<FieldMeta[]>([]);

  // Holds metadata about available ingredients
  const [ingredientsMeta, setIngredientsMeta] = useState<IngredientMeta[]>([]);

  // Controls whether advanced options are shown in the UI
  const [showAdvanced, setShowAdvanced] = useState(false);

  const recipe = useRecipeBuilderStore(state => state.recipe);
  const setRecipe = useRecipeBuilderStore(state => state.setRecipe);
  const updateStep = useRecipeBuilderStore(state => state.updateStep);
  const removeStep = useRecipeBuilderStore(state => state.removeStep);
  const { addToast } = useToast();

  // Load the full recipe from the backend when the page loads or the ID changes
  useEffect(() => {
    if (!id) return;
    apiGet<FullRecipe>(`/recipes/${id}/full`)
      .then(setRecipe)
      .catch(() => addToast("Failed to load recipe", "error"))
      .finally(() => setLoading(false));
  }, [id, addToast, setRecipe]);

  // Load field and ingredient metadata when the page loads
  useEffect(() => {
    apiGet<{ fields: FieldMeta[] }>("/meta/recipe-fields")
      .then(data => setFieldsMeta(data.fields || []))
      .catch(() => setFieldsMeta([]));

    apiGet<IngredientMeta[]>("/meta/ingredients")
      .then(setIngredientsMeta)
      .catch(() => setIngredientsMeta([]));
  }, []);

  // Save a step (either updating an existing one or adding a new one)
  function handleSaveStep(updatedStep: RecipeStep) {
    updateStep(updatedStep);
    setEditingStep(null);
    // TODO: Send update to backend here
  }

  // Prepare to add a new step (opens the step editor with a blank step)
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

  // Remove a step from the recipe
  function handleRemoveStep(stepId: number) {
    removeStep(stepId);
    // TODO: Send removal to backend here
  }

  // Duplicate a step (creates a copy with a new ID and order)
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

  // Toggle advanced options in the UI
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