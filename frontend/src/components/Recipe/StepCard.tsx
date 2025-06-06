import { useForm, Controller } from "react-hook-form";
import { FaGripVertical, FaCopy, FaTrash } from "react-icons/fa";

// Use types from your types folder
import type { RecipeStep, RecipeStepIngredient } from "../../types/recipe";
import type { StepTemplate, StepTemplateFieldMeta } from "../../types/recipeLayout";

interface StepCardProps {
  step: RecipeStep;
  stepTemplates: StepTemplate[];
  showAdvanced: boolean;
  onChange: (updated: RecipeStep) => void;
  onDuplicate: (step: RecipeStep) => void;
  onRemove: (stepId: number) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

export default function StepCard({
  step,
  stepTemplates,
  showAdvanced,
  onChange,
  onDuplicate,
  onRemove,
  dragHandleProps,
}: StepCardProps) {
  // Convert fields array to a value map for react-hook-form
  const fieldsValueMap = Object.fromEntries(
    (step.fields || []).map(f => [f.fieldId, f.value])
  );

  type StepFormValues = {
    templateId: number;
    fields: Record<number, string | number>;
    ingredients: RecipeStepIngredient[];
    notes?: string;
  };

  const { control, handleSubmit } = useForm<StepFormValues>({
    defaultValues: {
      templateId: step.stepTemplateId,
      fields: fieldsValueMap,
      ingredients: step.ingredients,
      notes: step.notes ?? "",
    },
  });

  // Filter fields and groups by template and advanced toggle
  const template = stepTemplates.find((t) => t.id === step.stepTemplateId);
  const visibleFields = (template?.fields || []).filter(
    (f: StepTemplateFieldMeta) => showAdvanced || !f.advanced
  );

  return (
    <form
      className="bg-white rounded shadow p-4 mb-4 flex flex-col gap-2"
      onBlur={handleSubmit((data) => {
        // Compose updated step object
        onChange({
          ...step,
          stepTemplateId: data.templateId,
          fields: Object.entries(data.fields).map(([fieldId, value]) => ({
            id: 0,
            recipeStepId: step.id,
            fieldId: Number(fieldId),
            value,
          })),
          ingredients: data.ingredients,
          notes: data.notes ?? "",
        });
      })}
      tabIndex={0}
      aria-label={`Step ${step.order}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span {...dragHandleProps} className="cursor-grab text-gray-500"><FaGripVertical /></span>
        <span className="font-bold mr-2">{step.order}.</span>
        <Controller
          name="templateId"
          control={control}
          render={({ field }) => (
            <select {...field} className="border rounded px-2 py-1">
              {stepTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              <option value="">[+ Request new template]</option>
            </select>
          )}
        />
        <div className="flex gap-2 ml-auto">
          <button type="button" onClick={() => onDuplicate(step)} aria-label="Duplicate"><FaCopy /></button>
          <button type="button" onClick={() => onRemove(step.id)} aria-label="Delete"><FaTrash /></button>
        </div>
      </div>
      <hr />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {visibleFields.map((meta: StepTemplateFieldMeta) => (
          <Controller
            key={meta.fieldId}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={`fields.${meta.fieldId}` as any}
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <label className="w-32">{meta.field.label}</label>
                <input
                  {...field}
                  value={
                    typeof field.value === "string" || typeof field.value === "number"
                      ? field.value
                      : ""
                  }
                  type={meta.field.type === "number" ? "number" : "text"}
                  className="border rounded px-2 py-1 flex-1"
                  aria-label={meta.field.label}
                />
              </div>
            )}
          />
        ))}
      </div>
      <div>
        <label>Notes</label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <textarea {...field} value={field.value ?? ""} className="border rounded px-2 py-1 w-full" />
          )}
        />
      </div>
    </form>
  );
}