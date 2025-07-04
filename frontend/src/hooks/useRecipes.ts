import { useState } from 'react';

export interface Step {
  id: string;
  description: string;
  // Add more fields as needed
}

export interface Ingredient {
  id: string;
  name: string;
  // Add more fields as needed
}

export interface Recipe {
  id: string;
  title: string;
  author: string;
  notes: string;
  tags: string[];
  steps: Step[];
  ingredients: Ingredient[];
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Placeholder: fetch, add, update, delete logic will go here

  return {
    recipes,
    setRecipes,
    // addRecipe,
    // updateRecipe,
    // deleteRecipe,
  };
}