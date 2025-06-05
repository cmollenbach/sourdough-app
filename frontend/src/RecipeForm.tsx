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
    <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <h2>Create Recipe</h2>
      {fields.map(field => (
        <div key={field.name} style={{ marginBottom: 12 }}>
          <label htmlFor={field.name} style={{ display: "block", marginBottom: 4 }}>
            {field.label}
          </label>
          <input
            id={field.name}
            value={form[field.name as keyof RecipeFormData] ?? ""}
            onChange={e =>
              handleChange(
                field.name as keyof RecipeFormData,
                field.type === "number" ? Number(e.target.value) : e.target.value
              )
            }
            placeholder={field.label}
            type={field.type === "number" ? "number" : "text"}
            required={field.required}
          />
        </div>
      ))}
      <button type="submit">Create</button>
      {success && <div style={{ color: "green" }}>Recipe created!</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}