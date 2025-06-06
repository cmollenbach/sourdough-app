import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateJWT, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();
const prisma = new PrismaClient();

// --- Create a recipe ---
router.post("/recipes", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    // CHANGED: Expect 'parameterValues' from the request body instead of 'fieldValues'
    const { parameterValues, steps } = req.body;

    // Basic validation
    if (!Array.isArray(parameterValues) || parameterValues.some(pv => typeof pv.parameterId !== "number" || typeof pv.value === "undefined")) {
      return res.status(400).json({ error: "Invalid or missing parameterValues" });
    }
    if (steps && !Array.isArray(steps)) {
      return res.status(400).json({ error: "Steps must be an array" });
    }

    const recipe = await prisma.recipe.create({
      data: {
        ownerId: req.user!.userId,
        isPredefined: false,
        // CHANGED: Use the 'parameterValues' relation
        parameterValues: {
          create: parameterValues,
        },
        steps: steps
          ? {
              create: steps.map((step: any) => ({
                stepTemplateId: step.stepTemplateId,
                order: step.order,
                notes: step.notes,
                description: step.description,
                // CHANGED: Use the 'parameterValues' relation for steps
                parameterValues: step.parameterValues
                  ? { create: step.parameterValues }
                  : undefined,
                ingredients: step.ingredients
                  ? { create: step.ingredients }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        // CHANGED: Include the new relation names
        parameterValues: true,
        steps: {
          include: {
            parameterValues: true,
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

// --- Get all recipes for the logged-in user ---
router.get("/recipes", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { ownerId: req.user!.userId, active: true },
      // CHANGED: Include 'parameterValues' instead of 'fieldValues'
      include: { parameterValues: { include: { parameter: true } } },
    });
    // Transform the data to match the old format for frontend compatibility
    const transformedRecipes = recipes.map(recipe => {
      const fieldValues = recipe.parameterValues.map(pv => ({
        fieldId: pv.parameterId,
        value: pv.value,
        name: pv.parameter.name, // Add name for easier use on frontend
      }));
      const { parameterValues, ...rest } = recipe;
      return { ...rest, fieldValues };
    });
    res.json(transformedRecipes);
  } catch (err) {
    console.error("Error in GET /api/recipes:", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// --- Get a single full recipe by ID ---
router.get("/recipes/:id/full", authenticateJWT, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }
  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id, ownerId: req.user!.userId, active: true },
      include: {
        // CHANGED: Include the new relation names
        parameterValues: { include: { parameter: true } },
        steps: {
          orderBy: { order: "asc" },
          include: {
            parameterValues: { include: { parameter: true } },
            ingredients: true,
          }
        }
      },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    // Transform data for frontend compatibility if needed
    const { parameterValues, steps, ...rest } = recipe;
    const transformedRecipe = {
      ...rest,
      fieldValues: parameterValues.map(pv => ({
        fieldId: pv.parameterId,
        value: pv.value,
        name: pv.parameter.name,
      })),
      steps: steps.map(step => {
        const { parameterValues: stepPVs, ...restStep } = step;
        return {
          ...restStep,
          fields: stepPVs.map(spv => ({
            id: spv.id,
            recipeStepId: spv.recipeStepId,
            fieldId: spv.parameterId,
            value: spv.value,
            notes: spv.notes,
            name: spv.parameter.name,
          }))
        };
      })
    };
    res.json(transformedRecipe);
  } catch (err) {
    console.error("Error in GET /api/recipes/:id/full:", err);
    res.status(500).json({ error: "Failed to fetch full recipe" });
  }
});

// --- Update a recipe ---
router.put("/recipes/:id", authenticateJWT, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }
  try {
    // CHANGED: Expect 'parameterValues' from the request body
    const { parameterValues } = req.body;
    for (const pv of parameterValues) {
      await prisma.recipeParameterValue.upsert({
        // CHANGED: Use the new unique identifier
        where: {
          recipeId_parameterId: {
            recipeId: id,
            parameterId: pv.parameterId,
          },
        },
        update: { value: pv.value },
        create: {
          recipeId: id,
          parameterId: pv.parameterId,
          value: pv.value,
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
// This route does not need changes as it only updates the Recipe model itself.
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