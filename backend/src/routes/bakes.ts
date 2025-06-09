import express, { Request, Response } from 'express';
import { PrismaClient, StepExecutionStatus, Prisma } from '@prisma/client'; // Added Prisma
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware'; // Corrected import names

const router = express.Router();
const prisma = new PrismaClient();

// All routes in this file will be protected
router.use(authenticateJWT); // Corrected usage

// --- Define Endpoint Logic Below ---
// GET /api/bakes/active: Fetches all bakes for the logged-in user where active = true.
router.get('/active', async (req: AuthRequest, res: Response) => { // Corrected type to AuthRequest
  const ownerId = req.user?.userId; // Corrected to use userId
  if (!ownerId) {
    return res.status(401).json({ message: 'User not authenticated.' }); // Changed to 401 for unauthenticated
  }

  try {
    const activeBakes = await prisma.bake.findMany({
      where: {
        ownerId: ownerId,
        active: true,
      },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: {
            parameterValues: { include: { parameter: true } },
            ingredients: { include: { ingredient: true } },
            recipeStep: {
              select: { description: true, stepTemplate: { select: { name: true } } }
            }
          },
        },
        recipe: { select: { name: true } },
      },
      orderBy: { startTimestamp: 'desc' },
    });
    res.json(activeBakes);
  } catch (error) {
    console.error('Failed to fetch active bakes:', error);
    res.status(500).json({ message: 'Failed to fetch active bakes.' });
  }
});

// GET /api/bakes: Fetches all bakes (active and inactive) for the logged-in user.
router.get('/', async (req: AuthRequest, res: Response) => {
  const ownerId = req.user?.userId;
  if (!ownerId) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  try {
    const allBakes = await prisma.bake.findMany({
      where: {
        ownerId: ownerId,
      },
      include: {
        // For a history list, we might not need full step details initially.
        // Let's include basic recipe info and step count for now.
        // Full details can be fetched when viewing a specific historical bake.
        recipe: { select: { name: true } },
        _count: { // Count the number of steps
          select: { steps: true }
        }
      },
      orderBy: { startTimestamp: 'desc' }, // Show most recent first
    });
    // Transform the result to include stepCount directly
    const bakesWithStepCount = allBakes.map(bake => ({
      ...bake,
      stepCount: bake._count?.steps,
    }));
    res.json(bakesWithStepCount);
  } catch (error) {
    console.error('Failed to fetch all bakes:', error);
    res.status(500).json({ message: 'Failed to fetch all bakes.' });
  }
});

// GET /api/bakes/:bakeId: Fetches a single bake by its ID for the logged-in user.
router.get('/:bakeId', async (req: AuthRequest, res: Response) => {
  const ownerId = req.user?.userId;
  const { bakeId } = req.params;

  if (!ownerId) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  try {
    const bake = await prisma.bake.findFirst({
      where: {
        id: Number(bakeId),
        ownerId: ownerId, // Ensure the user owns this bake
      },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: {
            parameterValues: { include: { parameter: true } },
            ingredients: { include: { ingredient: true } },
            recipeStep: {
              select: { description: true, stepTemplate: { select: { name: true } } }
            }
          },
        },
        recipe: { select: { name: true } },
        owner: { select: { userProfile: { select: { displayName: true } }, email: true } },
      },
    });

    if (!bake) {
      return res.status(404).json({ message: 'Bake not found or user not authorized.' });
    }
    res.json(bake);
  } catch (error) {
    console.error(`Failed to fetch bake ${bakeId}:`, error);
    res.status(500).json({ message: 'Failed to fetch bake.' });
  }
});

// POST /api/bakes: Creates a new bake and snapshots the recipe steps.
router.post('/', async (req: AuthRequest, res: Response) => { // Corrected type to AuthRequest
  const { recipeId, notes: bakeNotes } = req.body;
  const ownerId = req.user?.userId; // Corrected to use userId
  if (!ownerId) {
    return res.status(401).json({ message: 'User not authenticated.' }); // Changed to 401
  }
  if (!recipeId) {
    return res.status(400).json({ message: 'Recipe ID is required.' });
  }

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: Number(recipeId) },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: {
            parameterValues: { include: { parameter: true } },
            ingredients: { include: { ingredient: true } },
          },
        },
      },
    });

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found.' });
    }

    const newBake = await prisma.$transaction(async (tx) => {
      const bake = await tx.bake.create({
        data: {
          ownerId: ownerId,
          recipeId: recipe.id,
          notes: bakeNotes || `Bake of ${recipe.name}`,
          active: true,
          startTimestamp: new Date(),
          // Snapshot recipe targets
          recipeTotalWeightSnapshot: recipe.totalWeight,
          recipeHydrationPctSnapshot: recipe.hydrationPct,
          recipeSaltPctSnapshot: recipe.saltPct,
        },
      });

      for (const recipeStep of recipe.steps) {
        const createdBakeStep = await tx.bakeStep.create({
          data: {
            bakeId: bake.id,
            recipeStepId: recipeStep.id,
            order: recipeStep.order,
            status: StepExecutionStatus.PENDING,
          },
        });

        for (const pVal of recipeStep.parameterValues) {
          await tx.bakeStepParameterValue.create({
            data: {
              bakeStepId: createdBakeStep.id,
              parameterId: pVal.parameterId,
              plannedValue: pVal.value === null ? Prisma.JsonNull : pVal.value, // Handle null for JSON
            },
          });
        }

        for (const rIng of recipeStep.ingredients) {
          await tx.bakeStepIngredient.create({
            data: {
              bakeStepId: createdBakeStep.id,
              ingredientId: rIng.ingredientId,
              plannedPercentage: rIng.amount, // Assuming RecipeStepIngredient.amount is the percentage
              plannedPreparation: rIng.preparation,
            },
          });
        }
      }
      return bake;
    });

    const detailedBake = await prisma.bake.findUnique({
      where: { id: newBake.id },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: {
            parameterValues: { include: { parameter: true } },
            ingredients: { include: { ingredient: true } },
            recipeStep: { select: { description: true, stepTemplate: { select: { name: true } } } }
          },
        },
        recipe: { select: { name: true } },
        owner: { select: { userProfile: { select: { displayName: true }}, email: true } },
      },
    });

    return res.status(201).json(detailedBake);
  } catch (error) {
    console.error('Failed to create bake:', error);
    return res.status(500).json({ message: 'Failed to create bake.', details: (error as Error).message });
  }
});

// PUT /api/bakes/:bakeId/notes: Updates the notes for a specific bake.
router.put('/:bakeId/notes', async (req: AuthRequest, res: Response) => {
  const ownerId = req.user?.userId;
  const { bakeId } = req.params;
  const { notes } = req.body; // Expecting new notes string

  if (notes === undefined) {
    return res.status(400).json({ message: 'Notes field is required.' });
  }

  try {
    const bake = await prisma.bake.findFirst({ where: { id: Number(bakeId), ownerId: ownerId } });
    if (!bake) {
      return res.status(404).json({ message: 'Bake not found or user not authorized.' });
    }

    const updatedBake = await prisma.bake.update({
      where: { id: Number(bakeId) },
      data: { notes: notes }, // notes can be null if user clears it
    });
    res.json(updatedBake); // Return the updated bake object
  } catch (error) {
    console.error(`Failed to update notes for bake ${bakeId}:`, error);
    res.status(500).json({ message: 'Failed to update bake notes.' });
  }
});

// PUT /api/bakes/:bakeId/rating: Updates the rating for a specific bake.
router.put('/:bakeId/rating', async (req: AuthRequest, res: Response) => {
  const ownerId = req.user?.userId;
  const { bakeId } = req.params;
  let { rating } = req.body; // Expecting new rating (number 1-5 or null)

  if (rating !== undefined && rating !== null) {
    rating = Number(rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5, or null.' });
    }
  } else if (rating === undefined) { // Allow explicitly setting rating to null
      rating = null;
  }

  try {
    const bake = await prisma.bake.findFirst({ where: { id: Number(bakeId), ownerId: ownerId } });
    if (!bake) {
      return res.status(404).json({ message: 'Bake not found or user not authorized.' });
    }

    const updatedBake = await prisma.bake.update({ where: { id: Number(bakeId) }, data: { rating } });
    res.json(updatedBake);
  } catch (error) {
    console.error(`Failed to update rating for bake ${bakeId}:`, error);
    res.status(500).json({ message: 'Failed to update bake rating.' });
  }
});

// PUT /api/bakes/:bakeId/complete: Marks a bake as complete (sets active to false and records finishTimestamp).
router.put('/:bakeId/complete', async (req: AuthRequest, res: Response) => {
  const ownerId = req.user?.userId;
  const { bakeId } = req.params;

  try {
    const bake = await prisma.bake.findFirst({ where: { id: Number(bakeId), ownerId: ownerId } });
    if (!bake) {
      return res.status(404).json({ message: 'Bake not found or user not authorized.' });
    }
    if (!bake.active) {
      return res.status(400).json({ message: 'This bake is already inactive.' });
    }

    const updatedBake = await prisma.bake.update({
      where: { id: Number(bakeId) },
      data: { active: false, finishTimestamp: new Date() },
    });
    res.json(updatedBake);
  } catch (error) {
    console.error(`Failed to complete bake ${bakeId}:`, error);
    res.status(500).json({ message: 'Failed to complete bake.' });
  }
});

// PUT /api/bakes/:bakeId/cancel: Sets the bake active to false and records finishTimestamp.
router.put('/:bakeId/cancel', async (req: AuthRequest, res: Response) => { // Corrected type
  const ownerId = req.user?.userId; // Corrected to use userId
  const { bakeId } = req.params;

  try {
    const bake = await prisma.bake.findFirst({ where: { id: Number(bakeId), ownerId: ownerId } });
    if (!bake) {
        return res.status(404).json({ message: 'Bake not found or user not authorized.' });
    }

    const updatedBake = await prisma.bake.update({
      where: { id: Number(bakeId) },
      data: { active: false, finishTimestamp: new Date() },
    });
    res.json(updatedBake);
  } catch (error) {
    console.error(`Failed to cancel bake ${bakeId}:`, error);
    res.status(500).json({ message: 'Failed to cancel bake.' });
  }
});

// PUT /api/bakes/:bakeId/steps/:stepId/start: Sets step status to IN_PROGRESS and records startTimestamp.
router.put('/:bakeId/steps/:stepId/start', async (req: AuthRequest, res: Response) => { // Corrected type
  const ownerId = req.user?.userId; // Corrected to use userId
  const { bakeId: bakeIdStr, stepId: stepIdStr } = req.params;
  const bakeId = Number(bakeIdStr);
  const stepId = Number(stepIdStr);

  try {
    const bake = await prisma.bake.findFirst({ where: { id: bakeId, ownerId: ownerId } });
    if (!bake) {
        return res.status(404).json({ message: 'Bake not found or user not authorized.' });
    }
    if (!bake.active) {
        return res.status(400).json({ message: 'Cannot modify an inactive bake.' });
    }

    const updatedStep = await prisma.bakeStep.update({
      where: { id: stepId, bakeId: bakeId },
      data: {
        status: StepExecutionStatus.IN_PROGRESS,
        startTimestamp: new Date(),
      },
    });
    res.json(updatedStep);
  } catch (error) {
    console.error(`Failed to start step ${stepId} for bake ${bakeId}:`, error);
    res.status(500).json({ message: 'Failed to start step.' });
  }
});

// PUT /api/bakes/:bakeId/steps/:stepId/complete: Sets step status to COMPLETED, records finishTimestamp.
// Also handles recording actualParameterValues, notes, deviations for the BakeStep.
router.put('/:bakeId/steps/:stepId/complete', async (req: AuthRequest, res: Response) => { // Corrected type
  const ownerId = req.user?.userId; // Corrected to use userId
  const { bakeId: bakeIdStr, stepId: stepIdStr } = req.params;
  const bakeId = Number(bakeIdStr);
  const stepId = Number(stepIdStr);
  const { actualParameterValues, notes, deviations } = req.body; // actualParameterValues: { [parameterId: number]: any }
  try {
    const bake = await prisma.bake.findFirst({ where: { id: bakeId, ownerId: ownerId } });
    if (!bake) {
        return res.status(404).json({ message: 'Bake not found or user not authorized.' });
    }
    if (!bake.active) {
        return res.status(400).json({ message: 'Cannot modify an inactive bake.' });
    }

    const now = new Date();
    const stepToComplete = await prisma.bakeStep.findUnique({ where: { id: stepId, bakeId: bakeId }});
    if (!stepToComplete) {
        return res.status(404).json({ message: 'Step not found for this bake.' });
    }

    const dataToUpdate: any = {
        status: StepExecutionStatus.COMPLETED,
        finishTimestamp: now,
    };
    if (notes !== undefined) dataToUpdate.notes = notes;
    if (deviations !== undefined) dataToUpdate.deviations = deviations;

    await prisma.bakeStep.update({
      where: { id: stepId },
      data: dataToUpdate,
    });

    if (actualParameterValues && typeof actualParameterValues === 'object') {
      for (const [paramIdStr, value] of Object.entries(actualParameterValues)) {
        const paramId = Number(paramIdStr);
        const bspv = await prisma.bakeStepParameterValue.findFirst({
            where: { bakeStepId: stepId, parameterId: paramId }
        });

        if (bspv) {
            await prisma.bakeStepParameterValue.update({
                where: { id: bspv.id },
                data: { actualValue: value === null ? Prisma.JsonNull : value }, // Handle null for JSON
            });
        } else {
            console.warn(`BakeStepParameterValue not found for step ${stepId}, parameter ${paramId} to record actual value.`);
        }
      }
    }

    const finalUpdatedStep = await prisma.bakeStep.findUnique({
        where: { id: stepId },
        include: { parameterValues: { include: { parameter: true } } }
    });

    res.json(finalUpdatedStep);
  } catch (error) {
    console.error(`Failed to complete step ${stepId} for bake ${bakeId}:`, error);
    res.status(500).json({ message: 'Failed to complete step.', details: (error as Error).message });
  }
});

// PUT /api/bakes/:bakeId/steps/:stepId/skip: Sets step status to SKIPPED.
router.put('/:bakeId/steps/:stepId/skip', async (req: AuthRequest, res: Response) => { // Corrected type
  const ownerId = req.user?.userId; // Corrected to use userId
  const { bakeId: bakeIdStr, stepId: stepIdStr } = req.params;
  const bakeId = Number(bakeIdStr);
  const stepId = Number(stepIdStr);

  try {
    const bake = await prisma.bake.findFirst({ where: { id: bakeId, ownerId: ownerId } });
    if (!bake) { return res.status(404).json({ message: 'Bake not found or user not authorized.' }); }
    if (!bake.active) { return res.status(400).json({ message: 'Cannot modify an inactive bake.' }); }

    const updatedStep = await prisma.bakeStep.update({
      where: { id: stepId, bakeId: bakeId },
      data: { status: StepExecutionStatus.SKIPPED, finishTimestamp: new Date() },
    });
    res.json(updatedStep);
  } catch (error) {
    console.error(`Failed to skip step ${stepId} for bake ${bakeId}:`, error);
    res.status(500).json({ message: 'Failed to skip step.' });
  }
});

// PUT /api/bakes/:bakeId/steps/:stepId/parameters/:parameterValueId/actual: Updates actualValue for a specific BakeStepParameterValue.
router.put('/:bakeId/steps/:stepId/parameters/:parameterValueId/actual', async (req: AuthRequest, res: Response) => { // Corrected type
  const ownerId = req.user?.userId; // Corrected to use userId
  const { bakeId: bakeIdStr, stepId: stepIdStr, parameterValueId: bspvIdStr } = req.params;
  const bakeId = Number(bakeIdStr);
  const stepId = Number(stepIdStr);
  const bspvId = Number(bspvIdStr);
  const { actualValue, notes } = req.body;

  if (actualValue === undefined) {
    return res.status(400).json({ message: 'Actual value is required.' });
  }
  try {
    const bake = await prisma.bake.findFirst({ where: { id: bakeId, ownerId: ownerId } });
    if (!bake) { return res.status(404).json({ message: 'Bake not found or user not authorized.' }); }
    if (!bake.active) { return res.status(400).json({ message: 'Cannot modify an inactive bake.' }); }

    const bspv = await prisma.bakeStepParameterValue.findFirst({ where: { id: bspvId, bakeStepId: stepId } });
    if (!bspv) {
        return res.status(404).json({ message: 'Parameter value record not found for this step.' });
    }

    const dataToUpdate: any = { actualValue: actualValue === null ? Prisma.JsonNull : actualValue }; // Handle null for JSON
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updatedParamValue = await prisma.bakeStepParameterValue.update({
      where: { id: bspvId },
      data: dataToUpdate,
    });
    res.json(updatedParamValue);
  } catch (error) {
    console.error(`Failed to update actual value for parameter value ${bspvId}:`, error);
    res.status(500).json({ message: 'Failed to update actual parameter value.' });
  }
});

// PUT /api/bakes/:bakeId/steps/:stepId/note: Updates the notes field for a BakeStep.
router.put('/:bakeId/steps/:stepId/note', async (req: AuthRequest, res: Response) => { // Corrected type
  const ownerId = req.user?.userId; // Corrected to use userId
  const { bakeId: bakeIdStr, stepId: stepIdStr } = req.params;
  const bakeId = Number(bakeIdStr);
  const stepId = Number(stepIdStr);
  const { notes } = req.body;

  if (notes === undefined) {
    return res.status(400).json({ message: 'Notes field is required.' });
  }
  try {
    const bake = await prisma.bake.findFirst({ where: { id: bakeId, ownerId: ownerId } });
    if (!bake) { return res.status(404).json({ message: 'Bake not found or user not authorized.' }); }
    if (!bake.active) { return res.status(400).json({ message: 'Cannot modify an inactive bake.' }); }

    const updatedStep = await prisma.bakeStep.update({
      where: { id: stepId, bakeId: bakeId },
      data: { notes: notes },
    });
    res.json(updatedStep);
  } catch (error) {
    console.error(`Failed to update notes for step ${stepId}:`, error);
    res.status(500).json({ message: 'Failed to update notes.' });
  }
});

// PUT /api/bakes/:bakeId/steps/:stepId/deviations: Updates the deviations field for a BakeStep.
router.put('/:bakeId/steps/:stepId/deviations', async (req: AuthRequest, res: Response) => {
  const ownerId = req.user?.userId;
  const { bakeId: bakeIdStr, stepId: stepIdStr } = req.params;
  const bakeId = Number(bakeIdStr);
  const stepId = Number(stepIdStr);
  const { deviations } = req.body; // Expecting deviations to be valid JSON or a string that can be stored as JSON

  if (deviations === undefined) {
    return res.status(400).json({ message: 'Deviations field is required.' });
  }
  try {
    const bake = await prisma.bake.findFirst({ where: { id: bakeId, ownerId: ownerId } });
    if (!bake) { return res.status(404).json({ message: 'Bake not found or user not authorized.' }); }
    if (!bake.active) { return res.status(400).json({ message: 'Cannot modify an inactive bake.' }); }

    const updatedStep = await prisma.bakeStep.update({
      where: { id: stepId, bakeId: bakeId },
      data: { deviations: deviations === null ? Prisma.JsonNull : deviations }, // Handle null for JSON
    });
    res.json(updatedStep);
  } catch (error) {
    console.error(`Failed to update deviations for step ${stepId}:`, error);
    // Consider checking for Prisma.PrismaClientKnownRequestError if `deviations` is not valid JSON for the DB
    res.status(500).json({ message: 'Failed to update deviations.' });
  }
});

// PUT /api/bakes/:bakeId/steps/:stepId/parameter-values/:parameterValueId/planned
// Updates the plannedValue for a specific BakeStepParameterValue.
router.put('/:bakeId/steps/:stepId/parameter-values/:parameterValueId/planned', async (req: AuthRequest, res: Response) => {
  const ownerId = req.user?.userId;
  const { bakeId: bakeIdStr, stepId: stepIdStr, parameterValueId: bspvIdStr } = req.params;
  const bakeId = Number(bakeIdStr);
  const stepId = Number(stepIdStr);
  const bspvId = Number(bspvIdStr);
  const { plannedValue } = req.body; // Expecting the new plannedValue

  if (plannedValue === undefined) {
    return res.status(400).json({ message: 'New plannedValue is required.' });
  }
  try {
    const bake = await prisma.bake.findFirst({ where: { id: bakeId, ownerId: ownerId } });
    if (!bake) { return res.status(404).json({ message: 'Bake not found or user not authorized.' }); }
    if (!bake.active) { return res.status(400).json({ message: 'Cannot modify an inactive bake.' }); }

    // Ensure the BakeStepParameterValue belongs to the specified step
    const bspv = await prisma.bakeStepParameterValue.findFirst({ where: { id: bspvId, bakeStepId: stepId } });
    if (!bspv) {
      return res.status(404).json({ message: 'Parameter value record not found for this step.' });
    }

    const updatedParamValue = await prisma.bakeStepParameterValue.update({
      where: { id: bspvId },
      data: { plannedValue: plannedValue === null ? Prisma.JsonNull : plannedValue },
    });
    res.json(updatedParamValue);
  } catch (error) {
    console.error(`Failed to update planned value for parameter value ${bspvId}:`, error);
    res.status(500).json({ message: 'Failed to update planned parameter value.' });
  }
});

export default router;
