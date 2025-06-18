import { useState } from "react"; // Moved useState import to 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import StepCard from "./StepCard";
import type { RecipeStep } from "../../types/recipe";
import type { StepTemplate, IngredientMeta } from "../../types/recipeLayout";
import type { StepCardProps } from "./StepCard";

interface StepColumnProps {
  steps: RecipeStep[];
  stepTemplates: StepTemplate[];
  ingredientsMeta: IngredientMeta[];
  showAdvanced: boolean;
  onStepChange: (idx: number, updated: RecipeStep) => void;
  onStepDuplicate: (step: RecipeStep) => void;
  onStepRemove: (stepId: number) => void;
  onDragEnd: (event: DragEndEvent) => void; // Changed from onReorder to match dnd-kit
  onStepAdd: () => void; // New prop for adding a step
  newlyAddedStepId?: number | null; // To identify the newly added step
  onNewlyAddedStepHandled?: () => void; // Callback after the new step has been handled (e.g., expanded/focused)
}

export default function StepColumn({
  steps,
  stepTemplates,
  ingredientsMeta,
  showAdvanced,
  onStepChange,
  onStepDuplicate,
  onStepRemove,
  onDragEnd,
  onStepAdd,
  newlyAddedStepId,
  onNewlyAddedStepHandled,
}: StepColumnProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // State for managing expanded step for accordion behavior
  const [expandedStepId, setExpandedStepId] = useState<number | null>(null);

  const handleToggleExpand = (stepId: number) => {
    setExpandedStepId((prevId: number | null) => (prevId === stepId ? null : stepId));
  };

  const handleEnsureExpanded = (stepId: number) => {
    setExpandedStepId(stepId); // Directly set, don't toggle
  };

  // Create a unique ID string for dnd-kit items
  const getDndId = (stepId: number) => `step-${stepId}`;

  return (
    <div className="mb-6 p-4 bg-surface-elevated rounded-xl shadow-card border border-border">
      <h2 className="font-bold text-lg mb-4">Recipe Steps</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={steps.map(step => getDndId(step.id))}
          strategy={verticalListSortingStrategy}
        >
          <div role="list" className="flex flex-col gap-4">
            {steps.map((step, idx) => (
              <SortableStepCardItem
                key={getDndId(step.id)} // dnd-kit needs a stable key based on its ID
                dndId={getDndId(step.id)}
                step={step}
                stepTemplates={stepTemplates}
                ingredientsMeta={ingredientsMeta}
                showAdvanced={showAdvanced}
                onChange={(updated: RecipeStep) => onStepChange(idx, updated)}
                onDuplicate={onStepDuplicate}
                onRemove={onStepRemove}
                isExpanded={expandedStepId === step.id} // Pass expanded state
                onToggleExpand={() => handleToggleExpand(step.id)} // Pass toggle handler
                onEnsureExpanded={() => handleEnsureExpanded(step.id)} // Pass new handler for ensuring expansion
                isNewlyAdded={newlyAddedStepId === step.id} // Pass isNewlyAdded status
                onNewlyAddedStepHandled={onNewlyAddedStepHandled} // Pass handler
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={(e) => {
          onStepAdd();
          // Blur the button after clicking to prevent it from re-gaining focus
          // and interfering with the programmatic focus on the new step's select.
          (e.target as HTMLElement).blur();
        }}
        className="btn-primary"
      >
        + Add Step
      </button>
    </div>
  );
}

// Wrapper component to make StepCard sortable
interface SortableStepCardItemProps extends Omit<StepCardProps, 'dragHandleProps' | 'isExpanded' | 'onToggleExpand' | 'onEnsureExpanded'> {
  dndId: string;
  step: RecipeStep; // Explicitly list step to satisfy StepCardProps
  ingredientsMeta: IngredientMeta[]; // Explicitly list to satisfy StepCardProps
  // Other props like stepTemplates, showAdvanced, onChange, onDuplicate, onRemove are passed
  isExpanded: boolean; // Add from StepCardProps
  onToggleExpand: () => void; // Add from StepCardProps
  onEnsureExpanded: () => void; // Add new prop
}

function SortableStepCardItem(props: SortableStepCardItemProps) {
  // Destructure dndId and specific props for useSortable or direct pass-through.
  // The rest of the props (`otherProps`) will be spread onto StepCard.
  const { dndId, step, ingredientsMeta, isExpanded, onToggleExpand, onEnsureExpanded, ...otherStepCardProps } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dndId }); // Use the destructured dndId

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} >
      <StepCard
        step={step}
        ingredientsMeta={ingredientsMeta}
        dragHandleProps={listeners}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onEnsureExpanded={onEnsureExpanded}
        {...otherStepCardProps} // Spread remaining props like onChange, onDuplicate, etc.
      />
    </div>
  );
}
