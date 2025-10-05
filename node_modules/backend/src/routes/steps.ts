import express from "express";
import { authenticateJWT, requireAdmin, AuthRequest } from "../middleware/authMiddleware";
import prisma from "../lib/prisma";
import logger from "../lib/logger";
import { AppError } from "../middleware/errorHandler";

const router = express.Router();

// --- NEW ---

// Update a Step Template (Admin only)
router.put("/templates/:id", authenticateJWT, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const templateId = Number(req.params.id);
    const { name, description } = req.body;

    if (typeof name !== 'string' || typeof description !== 'string' || 
        name.trim().length === 0 || description.trim().length === 0) {
      throw new AppError(400, "Invalid data: name and description are required.");
    }

    const updatedTemplate = await prisma.stepTemplate.update({
      where: { id: templateId },
      data: { name, description },
    });
    
    logger.info('Step template updated', { templateId, userId: req.user?.userId });
    
    res.json(updatedTemplate);
  } catch (err) {
    next(err);
  }
});

// Delete a Step Template (Admin only)
router.delete("/templates/:id", authenticateJWT, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const templateId = Number(req.params.id);

    const templateInUse = await prisma.recipeStep.findFirst({
      where: { stepTemplateId: templateId },
    });

    if (templateInUse) {
      throw new AppError(400, "Cannot delete template because it is currently used by at least one recipe.");
    }

    await prisma.stepTemplate.delete({
      where: { id: templateId },
    });
    
    logger.info('Step template deleted', { templateId, userId: req.user?.userId });
    
    res.status(204).send();
  } catch (err) {
    next(err);
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