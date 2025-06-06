import express from "express";
import { PrismaClient } from "@prisma/client";
const router = express.Router();
const prisma = new PrismaClient();

// Recipe field meta
router.get("/recipe-fields", async (_req, res) => {
  const fields = await prisma.recipeField.findMany({ orderBy: { order: "asc" } });
  res.json({ fields });
});



// Step templates (with fields/groups)
router.get("/step-templates", async (_req, res) => {
  const templates = await prisma.stepTemplate.findMany({
    include: {
      fields: { include: { field: true } },
      ingredientRules: { include: { ingredientCategory: true } }
    },
    orderBy: { order: "asc" },
  });
  res.json({ templates });
});

// Ingredients meta
router.get("/ingredients", async (_req, res) => {
  const ingredients = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });
  res.json({ ingredients });
});

// Ingredient categories/groups
router.get("/ingredient-categories", async (_req, res) => {
  const categories = await prisma.ingredientCategory.findMany({ orderBy: { name: "asc" } });
  res.json({ categories });
});

// All fields
router.get("/fields", async (_req, res) => {
  const fields = await prisma.field.findMany({ orderBy: { order: "asc" } });
  res.json({ fields });
});

export default router;