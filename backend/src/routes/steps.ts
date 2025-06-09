import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateJWT, requireAdmin, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();
const prisma = new PrismaClient();

// --- NEW ---

// Update a Step Template (Admin only)
router.put("/templates/:id", authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const templateId = Number(req.params.id);
    const { name, description } = req.body;

    if (typeof name !== 'string' || typeof description !== 'string') {
      return res.status(400).json({ error: "Invalid data: name and description are required." });
    }

    const updatedTemplate = await prisma.stepTemplate.update({
      where: { id: templateId },
      data: { name, description },
    });
    res.json(updatedTemplate);
  } catch (err) {
    console.error("Failed to update step template:", err);
    res.status(500).json({ error: "Failed to update step template" });
  }
});

// Delete a Step Template (Admin only)
router.delete("/templates/:id", authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const templateId = Number(req.params.id);

    const templateInUse = await prisma.recipeStep.findFirst({
      where: { stepTemplateId: templateId },
    });

    if (templateInUse) {
      return res.status(400).json({ 
        error: "Cannot delete template because it is currently used by at least one recipe." 
      });
    }

    await prisma.stepTemplate.delete({
      where: { id: templateId },
    });
    
    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete step template:", err);
    res.status(500).json({ error: "Failed to delete step template" });
  }
});


// --- EXISTING ROUTES for RecipeSteps ---

// Create a step for a recipe
router.post("/", authenticateJWT, async (req: AuthRequest, res) => {
  // ... existing code ...
});

// Get all steps for a recipe
router.get("/:recipeId", authenticateJWT, async (req: AuthRequest, res) => {
  // ... existing code ...
});

// Update a step
router.put("/:id", authenticateJWT, async (req: AuthRequest, res) => {
  // ... existing code ...
});

// Delete a step
router.delete("/:id", authenticateJWT, async (req: AuthRequest, res) => {
  // ... existing code ...
});

export default router;