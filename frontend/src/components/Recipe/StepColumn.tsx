import { useState } from "react"; // Moved useState import to 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import type { RecipeStep } from '@sourdough/shared';
import type { StepTemplate, IngredientMeta, IngredientCategoryMeta } from '@sourdough/shared';
import type { StepCardProps } from "./StepCard";

interface StepColumnProps {
  steps: RecipeStep[];
  stepTemplates: StepTemplate[];
  ingredientCategoriesMeta: IngredientCategoryMeta[]; // Added
  ingredientsMeta: IngredientMeta[];
  showAdvanced: boolean;
  onStepChange: (idx: number, updated: RecipeStep) => void;
  onStepRemove: (stepId: number) => void;
  onDragEnd: (event: DragEndEvent) => void; // Changed from onReorder to match dnd-kit
  onStepAdd: () => void; // New prop for adding a step
  newlyAddedStepId?: number | null; // To identify the newly added step
  onNewlyAddedStepHandled?: () => void; // Callback after the new step has been handled (e.g., expanded/focused)
}

export default function StepColumn({
  steps,
  stepTemplates,
  ingredientCategoriesMeta, // Added
  ingredientsMeta,
  showAdvanced,
  onStepChange,
  onStepRemove,
  onDragEnd,
  onStepAdd,
  newlyAddedStepId,
  onNewlyAddedStepHandled,
}: StepColumnProps) {
  // Debug logging
  console.log('StepColumn rendered with:', {
    stepsCount: steps.length,
    stepTemplatesCount: stepTemplates.length,
    showAdvanced,
    firstStepId: steps[0]?.id,
    firstStepTemplateId: steps[0]?.stepTemplateId
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
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
                ingredientCategoriesMeta={ingredientCategoriesMeta} // Pass down
                showAdvanced={showAdvanced}
                onChange={(updated: RecipeStep) => onStepChange(idx, updated)}
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
interface SortableStepCardItemProps extends Omit<StepCardProps, 'dragHandleProps' | 'isExpanded' | 'onToggleExpand' | 'onEnsureExpanded' > {
  dndId: string;
  // step, ingredientsMeta, ingredientCategoriesMeta etc. are part of StepCardProps
  // Other props like stepTemplates, showAdvanced, onChange, onDuplicate, onRemove are passed
  isExpanded: boolean; // Add from StepCardProps
  onToggleExpand: () => void; // Add from StepCardProps
  onEnsureExpanded: () => void; // Add new prop
}

function SortableStepCardItem(props: SortableStepCardItemProps) {
  // dndId is for useSortable, rest are for StepCard
  const { dndId, ...restOfStepCardProps } = props;
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
        dragHandleProps={listeners}
        {...restOfStepCardProps} // Spread all other props including step, ingredientsMeta, ingredientCategoriesMeta etc.
      />
    </div>
  );
}
