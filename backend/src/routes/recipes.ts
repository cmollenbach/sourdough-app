import express from "express";
import { PrismaClient, IngredientCalculationMode } from "@prisma/client"; // Removed RecipeParameter import
import { authenticateJWT, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();
const prisma = new PrismaClient();

// --- Create a recipe ---
router.post("/recipes", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { name, notes, steps, totalWeight, hydrationPct, saltPct } = req.body; // Expect name and notes directly

    if (!name) { // Name is now a required direct field
      return res.status(400).json({ error: "Recipe name is required" });
    }
    // Validate steps if provided
    if (steps && !Array.isArray(steps)) {
      return res.status(400).json({ error: "Steps must be an array" });
    }

    const recipe = await prisma.recipe.create({
      data: {
        ownerId: req.user!.userId,
        isPredefined: false,
        totalWeight: totalWeight ? parseFloat(totalWeight) : null,
        hydrationPct: hydrationPct ? parseFloat(hydrationPct) : null,
        saltPct: saltPct ? parseFloat(saltPct) : null,
        name: name, // Set name directly
        notes: notes, // Set notes directly
        steps: steps
          ? {
              // Ensure ingredients have amount and calculationMode
              create: steps.map((step: any) => ({
                stepTemplateId: step.stepTemplateId,
                order: step.order,
                notes: step.notes,
                description: step.description,
                parameterValues: step.parameterValues
                  ? { create: step.parameterValues }
                  : undefined,
                ingredients: step.ingredients
                  ? { create: step.ingredients.map((ing: any) => ({
                      ingredientId: ing.ingredientId,
                      amount: parseFloat(ing.amount),
                      calculationMode: ing.calculationMode as IngredientCalculationMode, // Assuming frontend sends valid enum string
                      preparation: ing.preparation,
                      notes: ing.notes,
                    }))}
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
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
        steps: { // To check for advanced step templates, step parameters, or ingredients
          include: {
            stepTemplate: true, // For StepTemplate.advanced
            parameterValues: {
              include: {
                parameter: true // For StepParameter.advanced in steps
              }
            },
            ingredients: { include: { ingredient: true } }, // For Ingredient.advanced in steps
          }
        }
      },
    });
    const transformedRecipes = recipes.map(recipe => {
      // Determine if a template is advanced based on its elements
      let isTemplateAdvanced = false;
      if (recipe.isPredefined) {
        const usesAdvancedStepTemplate = recipe.steps.some(step => step.stepTemplate?.advanced === true);
        const usesAdvancedStepParam = recipe.steps.some(step =>
          step.parameterValues.some(spv => spv.parameter.advanced === true)
        );
        const usesAdvancedIngredient = recipe.steps.some(step =>
          step.ingredients.some(ing => ing.ingredient?.advanced === true)
        );
        isTemplateAdvanced = usesAdvancedStepTemplate || usesAdvancedStepParam || usesAdvancedIngredient;
      }

      // Explicitly construct the object for the list view / RecipeStub
      return {
        id: recipe.id, // Explicitly include id
        name: recipe.name, // Use direct field
        notes: recipe.notes, // Use direct field
        totalWeight: recipe.totalWeight, // Direct field
        hydrationPct: recipe.hydrationPct, // Direct field
        saltPct: recipe.saltPct,       // Direct field
        isTemplateAdvanced: recipe.isPredefined ? isTemplateAdvanced : undefined,
        createdAt: recipe.createdAt,
        isPredefined: recipe.isPredefined,
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
        steps: {
          orderBy: { order: "asc" },
          include: {
            parameterValues: { include: { parameter: true } },
            ingredients: { // Ensure we get all ingredient details
              include: { ingredient: true }
            },
          }
        }
      },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    // Destructure to separate specific parameters from the rest of the recipe object
    const { steps, ...recipeBaseProperties } = recipe; // No more allParameterValues at recipe level

    const transformedRecipe = {
      ...recipeBaseProperties, // Includes id, ownerId, createdAt, etc.
      // Core targets are now direct properties
      totalWeight: recipe.totalWeight,
      hydrationPct: recipe.hydrationPct,
      saltPct: recipe.saltPct,
      name: recipe.name, // Use direct field
      notes: recipe.notes, // Use direct field
      fieldValues: [], // RecipeParameterValues are gone for recipe level
      steps: steps.map(step => {
        const { parameterValues: stepPVs, ...restStep } = step;
        return {
          ...restStep,
          // ingredients already includes amount and calculationMode from the DB
          // if the include for ingredients was correct
          fields: stepPVs.map(spv => ({
            id: spv.id,
            recipeStepId: spv.recipeStepId,
            fieldId: spv.parameterId,
            value: spv.value,
            notes: spv.notes,
            name: spv.parameter.name,
          })),
          // Ensure ingredients are passed through correctly
          ingredients: step.ingredients.map(ing => ({
            ...ing, // includes id, recipeStepId, ingredientId, amount, calculationMode, preparation, notes
            ingredientName: ing.ingredient.name // for convenience if needed by UI
          })),
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
    const { name, notes, totalWeight, hydrationPct, saltPct, ...otherRecipeData } = req.body; // Expect name, notes

    // Prepare data for direct field updates
    const recipeUpdateData: any = { ...otherRecipeData }; // For any other direct fields like 'active' if sent
    if (typeof totalWeight !== 'undefined') recipeUpdateData.totalWeight = parseFloat(totalWeight) || null;
    if (typeof hydrationPct !== 'undefined') recipeUpdateData.hydrationPct = parseFloat(hydrationPct) || null;
    if (typeof saltPct !== 'undefined') recipeUpdateData.saltPct = parseFloat(saltPct) || null;
    if (typeof name !== 'undefined') recipeUpdateData.name = name; // Update name directly
    if (typeof notes !== 'undefined') recipeUpdateData.notes = notes; // Update notes directly

    // Update direct fields on Recipe
    const updatedRecipe = await prisma.recipe.update({
      where: { id, ownerId: req.user!.userId }, // Ensure user owns the recipe
      data: recipeUpdateData,
    });

    if (!updatedRecipe) {
      return res.status(404).json({ error: "Recipe not found or not authorized to update." });
    }

    res.json({ message: "Recipe updated", recipe: updatedRecipe });
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
        // Copy direct fields
        totalWeight: recipe.totalWeight,
        hydrationPct: recipe.hydrationPct,
        saltPct: recipe.saltPct,
        name: recipe.name + " (Clone)", // Add (Clone) to the name
        notes: recipe.notes, // Copy notes
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
                amount: ing.amount, // Use amount
                calculationMode: ing.calculationMode, // Use calculationMode
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