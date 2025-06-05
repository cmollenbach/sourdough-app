import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateJWT, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();
const prisma = new PrismaClient();

// Create a step for a recipe
router.post("/", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { recipeId, stepTemplateId, order, description, notes } = req.body;
    // Optionally: check that the recipe belongs to the user
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, ownerId: req.user!.userId, active: true },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found or not yours" });

    const step = await prisma.recipeStep.create({
      data: {
        recipeId,
        stepTemplateId,
        order,
        notes,
        description, // now valid!
      },
    });
    res.status(201).json(step);
  } catch (err) {
    res.status(500).json({ error: "Failed to create step" });
  }
});

// Get all steps for a recipe
router.get("/:recipeId", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const recipeId = Number(req.params.recipeId);
    // Optionally: check that the recipe belongs to the user
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, ownerId: req.user!.userId, active: true },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found or not yours" });

    const steps = await prisma.recipeStep.findMany({
      where: { recipeId },
      orderBy: { order: "asc" },
    });
    res.json(steps);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch steps" });
  }
});

// Update a step
router.put("/:id", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const stepId = Number(req.params.id);
    const { order, description, notes } = req.body;
    // Optionally: check that the step belongs to a recipe owned by the user
    const step = await prisma.recipeStep.findUnique({ where: { id: stepId } });
    if (!step) return res.status(404).json({ error: "Step not found" });

    const recipe = await prisma.recipe.findFirst({
      where: { id: step.recipeId, ownerId: req.user!.userId, active: true },
    });
    if (!recipe) return res.status(403).json({ error: "Not authorized" });

    const updated = await prisma.recipeStep.update({
      where: { id: stepId },
      data: { order, description, notes },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update step" });
  }
});

// Delete a step
router.delete("/:id", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const stepId = Number(req.params.id);
    const step = await prisma.recipeStep.findUnique({ where: { id: stepId } });
    if (!step) return res.status(404).json({ error: "Step not found" });

    const recipe = await prisma.recipe.findFirst({
      where: { id: step.recipeId, ownerId: req.user!.userId, active: true },
    });
    if (!recipe) return res.status(403).json({ error: "Not authorized" });

    await prisma.recipeStep.delete({ where: { id: stepId } });
    res.json({ message: "Step deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete step" });
  }
});

export default router;