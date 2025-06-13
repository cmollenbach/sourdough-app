"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client"); // Removed RecipeParameter import
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// --- Create a recipe ---
router.post("/recipes", authMiddleware_1.authenticateJWT, async (req, res) => {
    try {
        const { id: _id, name, notes, steps, totalWeight, hydrationPct, saltPct, parameterValues: _pv, ...otherBodyProps } = req.body; // Destructure and ignore 'id' and 'parameterValues' from top-level body
        if (!name) { // Name is now a required direct field
            return res.status(400).json({ error: "Recipe name is required" });
        }
        // Validate steps if provided
        if (steps && !Array.isArray(steps)) {
            return res.status(400).json({ error: "Steps must be an array" });
        }
        const recipe = await prisma.recipe.create({
            data: {
                ownerId: req.user.userId,
                ...otherBodyProps, // Spread other potential top-level props, EXCLUDING id
                isPredefined: false,
                totalWeight: totalWeight ? parseFloat(totalWeight) : null,
                hydrationPct: hydrationPct ? parseFloat(hydrationPct) : null,
                saltPct: saltPct ? parseFloat(saltPct) : null,
                name: name, // Set name directly
                notes: notes, // Set notes directly
                // parameterValues: _pv ? { create: _pv.map(...) } : undefined, // REMOVED: Recipe model no longer directly links to RecipeParameterValue this way
                steps: steps
                    ? {
                        // Ensure ingredients have amount and calculationMode
                        create: steps.map((step) => ({
                            stepTemplateId: step.stepTemplateId,
                            order: step.order,
                            notes: step.notes,
                            description: step.description, // Ensure this is handled if sent
                            parameterValues: step.parameterValues
                                ? { create: step.parameterValues.map((pv) => ({ parameterId: pv.parameterId, value: String(pv.value), notes: pv.notes })) } // Explicitly map, ensure value is string
                                : undefined,
                            ingredients: step.ingredients
                                ? { create: step.ingredients.map((ing) => ({
                                        ingredientId: Number(ing.ingredientId), // Ensure numeric
                                        amount: parseFloat(ing.amount),
                                        calculationMode: ing.calculationMode, // Assuming frontend sends valid enum string
                                        preparation: ing.preparation,
                                        notes: ing.notes,
                                    })) }
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
    }
    catch (err) {
        console.error("Error in POST /api/recipes:", err);
        res.status(500).json({ error: "Failed to create recipe", details: err instanceof Error ? err.message : err });
    }
});
// --- Get all recipes for the logged-in user (and templates) ---
router.get("/recipes", authMiddleware_1.authenticateJWT, async (req, res) => {
    try {
        const recipes = await prisma.recipe.findMany({
            where: {
                active: true,
                OR: [
                    { ownerId: req.user.userId },
                    { isPredefined: true }
                ]
            },
            include: {
                steps: {
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
                const usesAdvancedStepParam = recipe.steps.some(step => step.parameterValues.some(spv => spv.parameter.advanced === true));
                const usesAdvancedIngredient = recipe.steps.some(step => step.ingredients.some(ing => ing.ingredient?.advanced === true));
                isTemplateAdvanced = usesAdvancedStepTemplate || usesAdvancedStepParam || usesAdvancedIngredient;
            }
            // Explicitly construct the object for the list view / RecipeStub
            return {
                id: recipe.id, // Explicitly include id
                name: recipe.name, // Use direct field
                notes: recipe.notes, // Use direct field
                totalWeight: recipe.totalWeight, // Direct field
                hydrationPct: recipe.hydrationPct, // Direct field
                saltPct: recipe.saltPct, // Direct field
                isTemplateAdvanced: recipe.isPredefined ? isTemplateAdvanced : undefined,
                createdAt: recipe.createdAt,
                isPredefined: recipe.isPredefined,
            };
        });
        res.json(transformedRecipes);
    }
    catch (err) {
        console.error("Error in GET /api/recipes:", err);
        res.status(500).json({ error: "Failed to fetch recipes" });
    }
});
// --- Get a single full recipe by ID (user or template) ---
router.get("/recipes/:id/full", authMiddleware_1.authenticateJWT, async (req, res) => {
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
                    { ownerId: req.user.userId },
                    { isPredefined: true }
                ]
            },
            include: {
                steps: {
                    orderBy: { order: "asc" },
                    include: {
                        parameterValues: { include: { parameter: true } },
                        ingredients: {
                            include: { ingredient: true }
                        },
                    }
                }
            },
        });
        if (!recipe)
            return res.status(404).json({ error: "Recipe not found" });
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
    }
    catch (err) {
        console.error("Error in GET /api/recipes/:id/full:", err);
        res.status(500).json({ error: "Failed to fetch full recipe" });
    }
});
// --- Get a predefined recipe template by name ---
router.get("/recipes/predefined/by-name", authMiddleware_1.authenticateJWT, async (req, res) => {
    const { name } = req.query;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Recipe name query parameter is required and must be a string." });
    }
    try {
        const recipe = await prisma.recipe.findFirst({
            where: {
                name: name,
                isPredefined: true,
                active: true,
            },
            include: {
                steps: {
                    orderBy: { order: "asc" },
                    include: {
                        parameterValues: { include: { parameter: true } },
                        ingredients: { include: { ingredient: true } },
                    }
                }
            },
        });
        if (!recipe) {
            return res.status(404).json({ error: `Predefined recipe template named "${name}" not found.` });
        }
        // Transform the recipe to the FullRecipe structure (similar to GET /recipes/:id/full)
        // Consider refactoring this transformation logic into a shared function if it's used in multiple places.
        const { steps, ...recipeBaseProperties } = recipe;
        const transformedRecipe = {
            ...recipeBaseProperties,
            totalWeight: recipe.totalWeight,
            hydrationPct: recipe.hydrationPct,
            saltPct: recipe.saltPct,
            name: recipe.name,
            notes: recipe.notes,
            fieldValues: [], // Assuming recipe-level fieldValues are not directly on templates this way
            steps: steps.map(step => {
                const { parameterValues: stepPVs, ingredients: stepIngs, ...restStep } = step;
                return { ...restStep, fields: stepPVs.map(spv => ({ id: spv.id, recipeStepId: spv.recipeStepId, fieldId: spv.parameterId, value: spv.value, notes: spv.notes, name: spv.parameter.name, })), ingredients: stepIngs.map(ing => ({ ...ing, ingredientName: ing.ingredient.name, ingredientCategoryId: ing.ingredient.ingredientCategoryId, })), };
            })
        };
        res.json(transformedRecipe);
    }
    catch (err) {
        console.error(`Error in GET /api/recipes/predefined/by-name for name "${name}":`, err);
        res.status(500).json({ error: "Failed to fetch predefined recipe by name" });
    }
});
// --- Update a recipe ---
router.put("/recipes/:id", authMiddleware_1.authenticateJWT, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid recipe id" });
    }
    try {
        const { name, notes, totalWeight, hydrationPct, saltPct, steps: incomingSteps } = req.body;
        // Ensure the recipe exists and belongs to the user
        const existingRecipe = await prisma.recipe.findUnique({
            where: { id, ownerId: req.user.userId },
        });
        if (!existingRecipe) {
            return res.status(404).json({ error: "Recipe not found or you are not authorized to update it." });
        }
        if (existingRecipe.isPredefined) {
            return res.status(403).json({ error: "Predefined templates cannot be updated directly. Please save as a new recipe." });
        }
        await prisma.$transaction(async (tx) => {
            // 1. Update Recipe's direct fields
            const recipeUpdateData = {};
            if (typeof totalWeight !== 'undefined')
                recipeUpdateData.totalWeight = parseFloat(totalWeight) || null;
            if (typeof hydrationPct !== 'undefined')
                recipeUpdateData.hydrationPct = parseFloat(hydrationPct) || null;
            if (typeof saltPct !== 'undefined')
                recipeUpdateData.saltPct = parseFloat(saltPct) || null;
            if (typeof name !== 'undefined')
                recipeUpdateData.name = name;
            if (typeof notes !== 'undefined')
                recipeUpdateData.notes = notes;
            // Add any other direct recipe fields here if they exist in req.body
            await tx.recipe.update({
                where: { id }, // ownerId check already done
                data: recipeUpdateData,
            });
            // 2. Process Steps
            if (incomingSteps && Array.isArray(incomingSteps)) {
                const existingDbSteps = await tx.recipeStep.findMany({ where: { recipeId: id } });
                const incomingStepClientIds = incomingSteps.map(s => s.id).filter(stepId => stepId && stepId !== 0); // Actual DB IDs from client
                // Delete steps from DB that are not in the incoming payload
                const stepsToDelete = existingDbSteps.filter(dbStep => !incomingStepClientIds.includes(dbStep.id));
                for (const stepToDelete of stepsToDelete) {
                    await tx.recipeStepParameterValue.deleteMany({ where: { recipeStepId: stepToDelete.id } });
                    await tx.recipeStepIngredient.deleteMany({ where: { recipeStepId: stepToDelete.id } });
                    await tx.recipeStep.delete({ where: { id: stepToDelete.id } });
                }
                // Update existing steps or create new ones
                for (const stepPayload of incomingSteps) {
                    const stepData = {
                        stepTemplateId: stepPayload.stepTemplateId,
                        order: stepPayload.order,
                        notes: stepPayload.notes,
                        description: stepPayload.description,
                    };
                    let currentStepId;
                    const isNewStep = !stepPayload.id || stepPayload.id === 0;
                    if (isNewStep) {
                        const newStep = await tx.recipeStep.create({
                            data: { ...stepData, recipeId: id },
                        });
                        currentStepId = newStep.id;
                    }
                    else {
                        currentStepId = stepPayload.id;
                        await tx.recipeStep.update({
                            where: { id: currentStepId },
                            data: stepData,
                        });
                    }
                    // Process ParameterValues (RecipeStepField) for the current step
                    const incomingPvs = stepPayload.parameterValues || [];
                    const existingDbStepPvs = await tx.recipeStepParameterValue.findMany({ where: { recipeStepId: currentStepId } });
                    const incomingPvClientIds = incomingPvs.map((pv) => pv.id).filter((pvId) => pvId && pvId !== 0);
                    const pvsToDelete = existingDbStepPvs.filter(dbPv => !incomingPvClientIds.includes(dbPv.id));
                    for (const pvToDelete of pvsToDelete) {
                        await tx.recipeStepParameterValue.delete({ where: { id: pvToDelete.id } });
                    }
                    for (const pvPayload of incomingPvs) {
                        const pvData = { parameterId: pvPayload.parameterId, value: String(pvPayload.value), notes: pvPayload.notes };
                        if (!pvPayload.id || pvPayload.id === 0) {
                            await tx.recipeStepParameterValue.create({ data: { ...pvData, recipeStepId: currentStepId } });
                        }
                        else {
                            await tx.recipeStepParameterValue.update({ where: { id: pvPayload.id }, data: pvData });
                        }
                    }
                    // Process Ingredients for the current step
                    const incomingIngs = stepPayload.ingredients || [];
                    const existingDbStepIngs = await tx.recipeStepIngredient.findMany({ where: { recipeStepId: currentStepId } });
                    const incomingIngClientIds = incomingIngs.map((ing) => ing.id).filter((ingId) => ingId && ingId !== 0);
                    const ingsToDelete = existingDbStepIngs.filter(dbIng => !incomingIngClientIds.includes(dbIng.id));
                    for (const ingToDelete of ingsToDelete) {
                        await tx.recipeStepIngredient.delete({ where: { id: ingToDelete.id } });
                    }
                    for (const ingPayload of incomingIngs) {
                        const ingData = {
                            ingredientId: ingPayload.ingredientId,
                            amount: Number(ingPayload.amount), // Ensure it's a number; parseFloat is also an option
                            calculationMode: ingPayload.calculationMode,
                            preparation: ingPayload.preparation,
                            notes: ingPayload.notes,
                        };
                        if (!ingPayload.id || ingPayload.id === 0) {
                            await tx.recipeStepIngredient.create({ data: { ...ingData, recipeStepId: currentStepId } });
                        }
                        else {
                            await tx.recipeStepIngredient.update({ where: { id: ingPayload.id }, data: ingData });
                        }
                    }
                }
            }
        }); // End of transaction
        // Fetch the fully updated recipe to return it in the same structure as GET /:id/full
        // This logic is duplicated from GET /:id/full for consistency in response.
        // Consider refactoring into a shared function if it grows more complex.
        const finalRecipe = await prisma.recipe.findUnique({
            where: { id },
            include: {
                steps: {
                    orderBy: { order: "asc" },
                    include: {
                        parameterValues: { include: { parameter: true } },
                        ingredients: { include: { ingredient: true } },
                    }
                }
            },
        });
        if (!finalRecipe) { // Should not happen if transaction succeeded
            return res.status(500).json({ error: "Failed to retrieve updated recipe." });
        }
        // Transform to FullRecipe structure
        const { steps: dbSteps, ...recipeBaseProperties } = finalRecipe;
        const transformedRecipe = {
            ...recipeBaseProperties,
            name: finalRecipe.name,
            notes: finalRecipe.notes,
            totalWeight: finalRecipe.totalWeight,
            hydrationPct: finalRecipe.hydrationPct,
            saltPct: finalRecipe.saltPct,
            fieldValues: [], // Recipe-level dynamic fieldValues are removed
            steps: dbSteps.map(step => {
                const { parameterValues: stepPVs, ingredients: stepIngs, ...restStep } = step;
                return {
                    ...restStep,
                    fields: stepPVs.map(spv => ({
                        id: spv.id,
                        recipeStepId: spv.recipeStepId,
                        fieldId: spv.parameterId,
                        value: spv.value,
                        notes: spv.notes,
                        name: spv.parameter.name, // from included parameter
                    })),
                    ingredients: stepIngs.map(ing => ({
                        id: ing.id,
                        recipeStepId: ing.recipeStepId,
                        ingredientId: ing.ingredientId,
                        ingredientCategoryId: ing.ingredient.ingredientCategoryId, // from included ingredient
                        amount: ing.amount,
                        calculationMode: ing.calculationMode,
                        preparation: ing.preparation,
                        notes: ing.notes,
                        // ingredientName: ing.ingredient.name, // Already available via ingredientId lookup on frontend
                    })),
                };
            })
        };
        res.json({ message: "Recipe updated successfully", recipe: transformedRecipe });
    }
    catch (err) {
        console.error("Error in PUT /api/recipes/:id:", err);
        res.status(500).json({ error: "Failed to update recipe" });
    }
});
// --- Soft-delete a recipe ---
router.delete("/recipes/:id", authMiddleware_1.authenticateJWT, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid recipe id" });
    }
    try {
        const recipe = await prisma.recipe.updateMany({
            where: { id, ownerId: req.user.userId, active: true },
            data: { active: false },
        });
        if (recipe.count === 0)
            return res.status(404).json({ error: "Recipe not found or not yours" });
        res.json({ message: "Recipe deleted (soft)" });
    }
    catch (err) {
        console.error("Error in DELETE /api/recipes/:id:", err);
        res.status(500).json({ error: "Failed to delete recipe" });
    }
});
// --- Clone a recipe (template) ---
router.post("/recipes/:id/clone", authMiddleware_1.authenticateJWT, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id))
        return res.status(400).json({ error: "Invalid recipe id" });
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
        if (!recipe)
            return res.status(404).json({ error: "Template not found" });
        // Deep clone parameterValues and steps
        const newRecipe = await prisma.recipe.create({
            data: {
                ownerId: req.user.userId,
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
                    })) // <-- Workaround for Prisma type error
                }
            }
        });
        res.status(201).json(newRecipe);
    }
    catch (err) {
        console.error("Error in POST /api/recipes/:id/clone:", err);
        res.status(500).json({ error: "Failed to clone recipe" });
    }
});
exports.default = router;
//# sourceMappingURL=recipes.js.map