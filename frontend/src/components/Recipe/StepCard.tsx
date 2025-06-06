/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import type { RecipeStep, RecipeStepIngredient } from "../../types/recipe";
import type { StepTemplate, IngredientMeta } from "../../types/recipeLayout";
import { StepIngredientTable } from "./StepIngredientTable";

interface StepCardProps {
  step: RecipeStep;
  stepTemplates: StepTemplate[];
  ingredientsMeta: IngredientMeta[] | undefined;
  showAdvanced: boolean;
  onChange: (updated: RecipeStep) => void;
  onDuplicate: (step: RecipeStep) => void;
  onRemove: (stepId: number) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

function getDefaultFields(template: StepTemplate) {
  const fields: Record<number, string | number> = {};
  for (const f of template.fields) {
    if (f.defaultValue !== undefined) {
      fields[f.fieldId] = f.defaultValue;
    } else if (f.field?.type === "number") {
      fields[f.fieldId] = 0;
    } else {
      fields[f.fieldId] = "";
    }
  }
  return fields;
}

export default function StepCard({
  step,
  stepTemplates,
  ingredientsMeta,
  showAdvanced,
  onChange,
  onDuplicate,
  onRemove,
  dragHandleProps,
}: StepCardProps) {
  // Defensive: always use an array for ingredientsMeta
  const safeIngredientsMeta = useMemo(
    () =>
      Array.isArray(ingredientsMeta)
        ? ingredientsMeta
        : Array.isArray((ingredientsMeta as any)?.ingredients)
        ? (ingredientsMeta as any).ingredients
        : [],
    [ingredientsMeta]
  );
  const memoizedStepTemplates = useMemo(
    () => stepTemplates,
    [stepTemplates]
  );



  // Watch for templateId changes and ensure it's a number
  const { watch, control, handleSubmit, reset } = useForm<{
    templateId: number;
    fields: Record<number, string | number>;
    ingredients: RecipeStepIngredient[];
  }>({
    defaultValues: {
      templateId: step.stepTemplateId,
      fields: (() => {
        const template = stepTemplates.find((t) => t.id === step.stepTemplateId);
        const defaultFields = template ? getDefaultFields(template) : {};
        return {
          ...defaultFields,
          ...(step.fields ? Object.fromEntries(step.fields.map(f => [f.fieldId, f.value])) : {})
        };
      })(),
      ingredients: step.ingredients.map(ing => {
        const meta = safeIngredientsMeta.find((m: IngredientMeta) => m.id === ing.ingredientId);
        return {
          ...ing,
          ingredientCategoryId: meta ? meta.ingredientCategoryId : 0,
        };
      }),
    },
  });

  const selectedTemplateId = Number(watch("templateId"));
  const template = stepTemplates.find((t) => t.id === selectedTemplateId);


  // For dynamic ingredient lines
  const { fields: ingredientFields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  // Keep form in sync if step prop changes (e.g. duplicate/reorder)
  useEffect(() => {
    const template = memoizedStepTemplates.find((t) => t.id === step.stepTemplateId);
    const defaultFields = template ? getDefaultFields(template) : {};
    reset({
      templateId: step.stepTemplateId,
      fields: {
        ...defaultFields,
        ...(step.fields ? Object.fromEntries(step.fields.map(f => [f.fieldId, f.value])) : {})
      },
      ingredients: step.ingredients.map(ing => {
        const meta = safeIngredientsMeta.find((m: IngredientMeta) => m.id === ing.ingredientId);
        return {
          ...ing,
          ingredientCategoryId: meta ? meta.ingredientCategoryId : 0,
        };
      }),
    });
  }, [step, reset, memoizedStepTemplates, safeIngredientsMeta]);




  const visibleFields = (template?.fields || []).filter(
    (f) => showAdvanced || !f.advanced
  );

  if (!template) {
    return <div className="text-red-500">Template not found.</div>;
  }

  return (
    <form
      className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col gap-8 border border-gray-100 max-w-3xl mx-auto"
      onBlur={handleSubmit((data) => {
        onChange({
          ...step,
          stepTemplateId: Number(data.templateId),
          fields: Object.entries(data.fields).map(([fieldId, value]) => ({
            id: 0,
            recipeStepId: step.id,
            fieldId: Number(fieldId),
            value,
          })),
          ingredients: data.ingredients,
        });
      })}
      tabIndex={0}
      aria-label={`Step ${step.order}`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span {...dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600 text-2xl" aria-label="Reorder step">
            {/* Drag handle icon here */}
          </span>
          <span className="font-bold text-xl">{step.order}.</span>
          <Controller
            name="templateId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value}
                onChange={e => field.onChange(Number(e.target.value))}
                className="border rounded px-3 py-2 min-w-[180px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {stepTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                <option value="">[+ Request new template]</option>
              </select>
            )}
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onDuplicate(step)} aria-label="Duplicate">Duplicate</button>
          <button type="button" onClick={() => onRemove(step.id)} aria-label="Delete">Delete</button>
        </div>
      </div>

      <hr className="my-4" />

      {/* Fields Grid */}
      <div className="flex flex-col gap-4">
        {visibleFields.map((meta) => {
          const inputId = `step-${step.id}-field-${meta.fieldId}`;
          return (
            <Controller
              key={meta.fieldId}
              name={`fields.${meta.fieldId}` as any}
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col md:flex-row md:items-center w-full gap-1 md:gap-4">
                  <label
                    htmlFor={inputId}
                    className="block font-medium min-w-[180px] md:text-right md:mb-0 mb-1 pr-2"
                  >
                    {meta.field.label || meta.field.name}
                  </label>
                  <div className="flex-1">
                    <input
                      {...field}
                      id={inputId}
                      value={typeof field.value === "string" || typeof field.value === "number" ? field.value : ""}
                      type={meta.field.type === "number" ? "number" : "text"}
                      className={`border rounded px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${fieldState.invalid ? "border-red-500" : ""}`}
                      aria-label={meta.field.label || meta.field.name}
                    />
                    {(meta.helpText || meta.field.helpText) && (
                      <div className="text-xs text-gray-500 mt-1">{meta.helpText || meta.field.helpText}</div>
                    )}
                    {fieldState.error && (
                      <div className="text-xs text-red-500 mt-1">{fieldState.error.message}</div>
                    )}
                  </div>
                </div>
              )}
            />
          );
        })}
      </div>

      {/* Ingredients Section */}
      {template.ingredientRules.length > 0 && (
        <StepIngredientTable
          ingredientRules={template.ingredientRules}
          ingredientsMeta={safeIngredientsMeta}
          ingredientFields={ingredientFields}
          append={append}
          remove={remove}
          control={control}
        />
      )}
    </form>
  );
}

/* When preparing step.ingredients for the form:
const enrichedIngredients = step.ingredients.map(ing => {
  const meta = ingredientsMeta.find(m => m.id === ing.ingredientId);
  return {
    ...ing,
    ingredientCategoryId: meta ? meta.ingredientCategoryId : 0,
  };
});
*/