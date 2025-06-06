import { DndContext, closestCenter } from "@dnd-kit/core";
import StepCard from "./StepCard";
import type { RecipeStep } from "../../types/recipe";
import type { StepTemplate, IngredientMeta } from "../../types/recipeLayout";

interface StepColumnProps {
  steps: RecipeStep[];
  stepTemplates: StepTemplate[];
  ingredientsMeta: IngredientMeta[];
  showAdvanced: boolean;
  onStepChange: (idx: number, updated: RecipeStep) => void;
  onStepDuplicate: (step: RecipeStep) => void;
  onStepRemove: (stepId: number) => void;
  onReorder: () => void;
}

export default function StepColumn({
  steps,
  stepTemplates,
  ingredientsMeta,
  showAdvanced,
  onStepChange,
  onStepDuplicate,
  onStepRemove,
  onReorder,
}: StepColumnProps) {
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onReorder}>
      <div role="list" className="flex flex-col gap-4">
        {steps.map((step, idx) => (
          <StepCard
            key={step.id}
            step={step}
            stepTemplates={stepTemplates}
            ingredientsMeta={ingredientsMeta}
            showAdvanced={showAdvanced}
            onChange={updated => onStepChange(idx, updated)}
            onDuplicate={onStepDuplicate}
            onRemove={onStepRemove}
            dragHandleProps={{}}
          />
        ))}
      </div>
    </DndContext>
  );
}