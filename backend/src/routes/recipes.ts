import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateJWT, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();
const prisma = new PrismaClient();

// Public endpoint for recipe field metadata
router.get("/fields", (_req, res) => {
  res.json([
    { name: "name", type: "string", label: "Name", required: true },
    { name: "totalWeight", type: "number", label: "Total Weight", required: true },
    { name: "hydrationPct", type: "number", label: "Hydration %", required: true },
    { name: "saltPct", type: "number", label: "Salt %", required: true },
    { name: "notes", type: "string", label: "Notes", required: false }
  ]);
});

// Create a recipe
router.post("/", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { name, totalWeight, hydrationPct, saltPct, notes } = req.body;
    const recipe = await prisma.recipe.create({
      data: {
        name,
        totalWeight,
        hydrationPct,
        saltPct,
        notes,
        owner: { connect: { id: req.user!.userId } },
      },
    });
    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ error: "Failed to create recipe" });
  }
});

// Get all recipes for the logged-in user
router.get("/", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { ownerId: req.user!.userId, active: true },
    });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// Get a single recipe by ID
router.get("/:id", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id: Number(req.params.id), ownerId: req.user!.userId, active: true },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

// Get a single recipe by ID with full details
router.get("/:id/full", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id: Number(req.params.id), ownerId: req.user!.userId, active: true },
      include: {
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
    res.status(500).json({ error: "Failed to fetch full recipe" });
  }
});

// Update a recipe
router.put("/:id", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { name, totalWeight, hydrationPct, saltPct, notes } = req.body;
    const recipe = await prisma.recipe.updateMany({
      where: { id: Number(req.params.id), ownerId: req.user!.userId, active: true },
      data: { name, totalWeight, hydrationPct, saltPct, notes },
    });
    if (recipe.count === 0) return res.status(404).json({ error: "Recipe not found or not yours" });
    res.json({ message: "Recipe updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

// Soft-delete a recipe
router.delete("/:id", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const recipe = await prisma.recipe.updateMany({
      where: { id: Number(req.params.id), ownerId: req.user!.userId, active: true },
      data: { active: false },
    });
    if (recipe.count === 0) return res.status(404).json({ error: "Recipe not found or not yours" });
    res.json({ message: "Recipe deleted (soft)" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

export default router;