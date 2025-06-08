import React, { useState, useEffect } from "react";
import { createRecipe, getRecipeFields } from "./api";

type Props = {
  token: string;
  onCreated?: () => void;
};

type FieldMeta = {
  name: string;
  type: string;
  label: string;
  required: boolean;
};

type RecipeFormData = {
  name: string;
  totalWeight: number;
  hydrationPct: number;
  saltPct: number;
  notes?: string;
};

export default function RecipeForm({ token, onCreated }: Props) {
  const [fields, setFields] = useState<FieldMeta[]>([]);
  const [form, setForm] = useState<RecipeFormData>({
    name: "",
    totalWeight: 0,
    hydrationPct: 0,
    saltPct: 0,
    notes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getRecipeFields().then(setFields);
  }, []);

  const handleChange = <K extends keyof RecipeFormData>(name: K, value: RecipeFormData[K]) => {
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    try {
      await createRecipe(token, form);
      setSuccess(true);
      setForm({
        name: "",
        totalWeight: 0,
        hydrationPct: 0,
        saltPct: 0,
        notes: "",
      });
      if (onCreated) onCreated();
    } catch {
      setError("Failed to create recipe");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 p-4 border border-border rounded-lg shadow-card bg-surface-elevated flex flex-col gap-4">
      <h2 className="text-xl font-bold text-text-primary">Create Recipe</h2>
      {fields.map(field => (
        <div key={field.name}>
          <label htmlFor={field.name} className="block text-sm font-medium text-text-secondary mb-1">
            {field.label}
          </label>
          <input
            id={field.name}
            value={form[field.name as keyof RecipeFormData]?.toString() ?? ""}
            onChange={e =>
              handleChange(
                field.name as keyof RecipeFormData,
                field.type === "number" ? Number(e.target.value) : e.target.value
              )
            }
            placeholder={field.label}
            type={field.type === "number" ? "number" : "text"}
            required={field.required}
            className="form-input w-full rounded" // Using the .form-input class from index.css
          />
        </div>
      ))}
      <button 
        type="submit" 
        className="btn-primary px-4 py-2 rounded w-full transition-colors" // Using .btn-primary
      >
        Create
      </button>
      {success && <div className="text-success-600">Recipe created!</div>}
      {error && <div className="text-danger-600">{error}</div>}
    </form>
  );
}