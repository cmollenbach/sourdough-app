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
  onStepAdd, // Destructure the new prop
}: StepColumnProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create a unique ID string for dnd-kit items
  const getDndId = (stepId: number) => `step-${stepId}`;

  return (
    <div className="mb-6 p-4 bg-white rounded-xl shadow border border-gray-100">
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
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={onStepAdd}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
      >
        + Add Step
      </button>
    </div>
  );
}

// Wrapper component to make StepCard sortable
interface SortableStepCardItemProps extends Omit<StepCardProps, 'dragHandleProps'> {
  dndId: string;
}

function SortableStepCardItem(props: SortableStepCardItemProps) {
  const { dndId, ...otherProps } = props; // Destructure dndId and the rest of the props
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dndId }); // Use the destructured dndId

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 100 : 'auto', // Ensure dragged item is on top
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} >
      <StepCard {...otherProps} dragHandleProps={listeners} />
    </div>
  );
}