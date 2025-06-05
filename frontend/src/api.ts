import axios from "axios";

const API_URL = "http://localhost:3001/api"; // Change if your backend runs elsewhere

export const login = (email: string, password: string) =>
  axios.post(`${API_URL}/auth/login`, { email, password });

export const getRecipes = (token: string) =>
  axios.get(`${API_URL}/recipes`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const createRecipe = (
  token: string,
  recipe: { name: string; totalWeight: number; hydrationPct: number; saltPct: number; notes?: string }
) =>
  axios.post(`${API_URL}/recipes`, recipe, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getRecipeFields = () =>
  fetch("http://localhost:3001/api/recipes/fields").then(res => res.json());