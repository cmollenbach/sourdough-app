import express from "express";
import { PrismaClient } from "@prisma/client";
const router = express.Router();
const prisma = new PrismaClient();

// Get all RecipeParameters (formerly RecipeFields)
router.get("/recipe-fields", async (_req, res) => {
  // CHANGED: Use the new 'recipeParameter' model name
  const recipeParameters = await prisma.recipeParameter.findMany({
    orderBy: { order: "asc" },
  });
  // The frontend might expect the key 'fields', so we can keep the response shape
  res.json({ fields: recipeParameters });
});

// Step templates (with fields/groups)
router.get("/step-templates", async (_req, res) => {
  const templates = await prisma.stepTemplate.findMany({
    include: {
      // CHANGED: The relation is now 'parameters' which includes 'parameter' (the StepParameter)
      parameters: { include: { parameter: true } },
      ingredientRules: { include: { ingredientCategory: true } }
    },
    orderBy: { order: "asc" },
  });
  res.json({ templates });
});

// Ingredients meta
router.get("/ingredients", async (_req, res) => {
  // This query remains the same
  const ingredients = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });
  res.json({ ingredients });
});

// Ingredient categories/groups
router.get("/ingredient-categories", async (_req, res) => {
  // This query remains the same
  const categories = await prisma.ingredientCategory.findMany({ orderBy: { name: "asc" } });
  res.json({ categories });
});

// Get all StepParameters (formerly Fields)
router.get("/fields", async (_req, res) => {
  // CHANGED: Use the new 'stepParameter' model name
  const stepParameters = await prisma.stepParameter.findMany({ orderBy: { order: "asc" } });
  // The frontend might expect the key 'fields', so we can keep the response shape
  res.json({ fields: stepParameters });
});

export default router;