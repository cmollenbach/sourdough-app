import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateJWT, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();
const prisma = new PrismaClient();

// --- Create a recipe ---
router.post("/recipes", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { parameterValues, steps } = req.body;

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

// --- Get all recipes for the logged-in user (and templates) ---
router.get("/recipes", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: {
        active: true,
        OR: [
          { ownerId: req.user!.userId },
          { isPredefined: true }
        ]
      },
      include: {
        parameterValues: { include: { parameter: true } }, // For RecipeParameter.advanced
        steps: { // To check for advanced step templates, step parameters, or ingredients
          include: {
            stepTemplate: true, // For StepTemplate.advanced
            parameterValues: { include: { parameter: true } }, // For StepParameter.advanced in steps
            ingredients: { include: { ingredient: true } }, // For Ingredient.advanced in steps
          }
        }
      },
    });
    const transformedRecipes = recipes.map(recipe => {
      const fieldValues = recipe.parameterValues.map(pv => ({
        fieldId: pv.parameterId,
        value: pv.value,
        name: pv.parameter.name,
      }));
      // Extract recipe name and notes from parameterValues
      const recipeNameParam = recipe.parameterValues.find(pv => pv.parameter.name === 'name');
      const recipeNotesParam = recipe.parameterValues.find(pv => pv.parameter.name === 'notes');

      // Determine if a template is advanced based on its elements
      let isTemplateAdvanced = false;
      if (recipe.isPredefined) {
        const usesAdvancedRecipeParam = recipe.parameterValues.some(pv => pv.parameter.advanced === true);
        const usesAdvancedStepTemplate = recipe.steps.some(step => step.stepTemplate?.advanced === true);
        const usesAdvancedStepParam = recipe.steps.some(step =>
          step.parameterValues.some(spv => spv.parameter.advanced === true)
        );
        const usesAdvancedIngredient = recipe.steps.some(step =>
          step.ingredients.some(ing => ing.ingredient?.advanced === true)
        );
        isTemplateAdvanced = usesAdvancedRecipeParam || usesAdvancedStepTemplate || usesAdvancedStepParam || usesAdvancedIngredient;
      }

      // Explicitly construct the object for the list view / RecipeStub
      return {
        id: recipe.id, // Explicitly include id
        name: typeof recipeNameParam?.value === 'string' ? recipeNameParam.value : "Unnamed Recipe",
        // Add any other fields from the 'recipe' object that your main /recipes list page might need
        notes: typeof recipeNotesParam?.value === 'string' ? recipeNotesParam.value : undefined,
        isTemplateAdvanced: recipe.isPredefined ? isTemplateAdvanced : undefined,
        createdAt: recipe.createdAt,
        isPredefined: recipe.isPredefined,
        // fieldValues are not typically needed for a simple name/id dropdown,
        // but your main /recipes list page might use them.
        // If the dropdown ONLY needs id/name, you could even omit fieldValues here.
        // For clarity, we'll keep the full fieldValues array as it was,
        // which contains all parameters, including name and notes again.
        // The frontend RecipeStub will only pick id and name.
        fieldValues,
      };
    });
    res.json(transformedRecipes);
  } catch (err) {
    console.error("Error in GET /api/recipes:", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// --- Get a single full recipe by ID (user or template) ---
router.get("/recipes/:id/full", authenticateJWT, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }
  try {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id,
        active: true,
        OR: [
          { ownerId: req.user!.userId },
          { isPredefined: true }
        ]
      },
      include: {
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

    // Destructure to separate specific parameters from the rest of the recipe object
    const { parameterValues: allParameterValues, steps, ...recipeBaseProperties } = recipe;

    // Extract top-level name and notes for the FullRecipe structure
    const recipeNameParamValue = allParameterValues.find(pv => pv.parameter.name === 'name')?.value;
    const recipeNotesParamValue = allParameterValues.find(pv => pv.parameter.name === 'notes')?.value;

    const transformedRecipe = {
      ...recipeBaseProperties, // Includes id, ownerId, createdAt, etc.
      name: typeof recipeNameParamValue === 'string' ? recipeNameParamValue : "Unnamed Recipe", // Ensure name is a string
      notes: typeof recipeNotesParamValue === 'string' ? recipeNotesParamValue : undefined, // Ensure notes is string or undefined
      fieldValues: allParameterValues.map(pv => ({ // This will list all parameters, including name and notes again
        fieldId: pv.parameterId,
        value: String(pv.value), // Ensure value is string for RecipeFieldValue
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
    const { parameterValues } = req.body;
    for (const pv of parameterValues) {
      await prisma.recipeParameterValue.upsert({
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

// --- Clone a recipe (template) ---
router.post("/recipes/:id/clone", authenticateJWT, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid recipe id" });

  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id, active: true, isPredefined: true },
      include: {
        parameterValues: true,
        steps: {
          include: {
            parameterValues: true,
            ingredients: true,
          }
        }
      }
    });
    if (!recipe) return res.status(404).json({ error: "Template not found" });

    // Deep clone parameterValues and steps
    const newRecipe = await prisma.recipe.create({
      data: {
        ownerId: req.user!.userId,
        isPredefined: false,
        parameterValues: {
          create: recipe.parameterValues.map(pv => ({
            parameterId: pv.parameterId,
            value: pv.value,
          }))
        },
        steps: {
          create: recipe.steps.map(step => ({
            stepTemplateId: step.stepTemplateId,
            order: step.order,
            notes: step.notes,
            description: step.description,
            parameterValues: {
              create: step.parameterValues.map(spv => ({
                parameterId: spv.parameterId,
                value: spv.value,
                notes: spv.notes,
              }))
            },
            ingredients: {
              create: step.ingredients.map(ing => ({
                ingredientId: ing.ingredientId,
                percentage: ing.percentage,
                preparation: ing.preparation,
                notes: ing.notes,
              }))
            }
          })) as any // <-- Workaround for Prisma type error
        }
      }
    });
    res.status(201).json(newRecipe);
  } catch (err) {
    console.error("Error in POST /api/recipes/:id/clone:", err);
    res.status(500).json({ error: "Failed to clone recipe" });
  }
});

export default router;