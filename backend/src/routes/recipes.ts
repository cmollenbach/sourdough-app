import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateJWT, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Recipe creation expects:
 * {
 *   fieldValues: [{ fieldId: number, value: string | number }, ...],
 *   steps: [
 *     {
 *       stepTemplateId: number,
 *       order: number,
 *       notes?: string,
 *       fields?: [{ fieldId: number, value: string | number }, ...],
 *       ingredients?: [{ ingredientId: number, amount: number, ... }, ...]
 *     },
 *     ...
 *   ]
 * }
 */

// --- Create a recipe (dynamic fields) ---
router.post("/recipes", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { fieldValues, steps } = req.body;

    // Basic validation
    if (!Array.isArray(fieldValues) || fieldValues.some(fv => typeof fv.fieldId !== "number" || typeof fv.value === "undefined")) {
      return res.status(400).json({ error: "Invalid or missing fieldValues" });
    }
    if (steps && !Array.isArray(steps)) {
      return res.status(400).json({ error: "Steps must be an array" });
    }

    const recipe = await prisma.recipe.create({
      data: {
        ownerId: req.user!.userId,
        isPredefined: false,
        fieldValues: {
          create: fieldValues,
        },
        steps: steps
          ? {
              create: steps.map((step: any) => ({
                stepTemplateId: step.stepTemplateId,
                order: step.order,
                notes: step.notes,
                fields: step.fields
                  ? { create: step.fields }
                  : undefined,
                ingredients: step.ingredients
                  ? { create: step.ingredients }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        fieldValues: true,
        steps: {
          include: {
            fields: true,
            ingredients: true,
          },
        },
      },
    });
    res.status(201).json(recipe);
  } catch (err) {
    console.error("Error in POST /api/recipes:", err);
    res.status(500).json({ error: "Failed to create recipe", details: err instanceof Error ? err.message : err });
  }
});

// --- Get all recipes for the logged-in user (with field values) ---
router.get("/recipes", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { ownerId: req.user!.userId, active: true },
      include: { fieldValues: true },
    });
    res.json(recipes);
  } catch (err) {
    console.error("Error in GET /api/recipes:", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// --- Get a single recipe by ID (with field values) ---
router.get("/recipes/:id", authenticateJWT, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }
  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id, ownerId: req.user!.userId, active: true },
      include: { fieldValues: true },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    res.json(recipe);
  } catch (err) {
    console.error("Error in GET /api/recipes/:id:", err);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

// --- Get a single recipe by ID with full details ---
router.get("/recipes/:id/full", authenticateJWT, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }
  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id, ownerId: req.user!.userId, active: true },
      include: {
        fieldValues: true,
        steps: {
          orderBy: { order: "asc" },
          include: {
            fields: true,
            ingredients: true,
          }
        }
      },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    res.json(recipe);
  } catch (err) {
    console.error("Error in GET /api/recipes/:id/full:", err);
    res.status(500).json({ error: "Failed to fetch full recipe" });
  }
});

// --- Update a recipe (dynamic fields) ---
router.put("/recipes/:id", authenticateJWT, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }
  try {
    const { fieldValues } = req.body; // [{ fieldId, value }, ...]
    // Update each field value individually
    for (const fv of fieldValues) {
      await prisma.recipeFieldValue.upsert({
        where: {
          recipeId_fieldId: {
            recipeId: id,
            fieldId: fv.fieldId,
          },
        },
        update: { value: fv.value },
        create: {
          recipeId: id,
          fieldId: fv.fieldId,
          value: fv.value,
        },
      });
    }
    res.json({ message: "Recipe updated" });
  } catch (err) {
    console.error("Error in PUT /api/recipes/:id:", err);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

// --- Soft-delete a recipe ---
router.delete("/recipes/:id", authenticateJWT, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }
  try {
    const recipe = await prisma.recipe.updateMany({
      where: { id, ownerId: req.user!.userId, active: true },
      data: { active: false },
    });
    if (recipe.count === 0) return res.status(404).json({ error: "Recipe not found or not yours" });
    res.json({ message: "Recipe deleted (soft)" });
  } catch (err) {
    console.error("Error in DELETE /api/recipes/:id:", err);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

export default router;