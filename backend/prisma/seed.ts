// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- System User ---
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@sourdough.app' },
    update: {},
    create: {
      email: 'system@sourdough.app',
      role: 'SYSTEM',
      emailVerified: true,
      isActive: true,
      notes: 'System user for predefined recipes and system data.',
    },
  });
  console.log(`Upserted system user: ${systemUser.email}`);

  // --- Ingredient Categories ---
  const flourCategory = await prisma.ingredientCategory.upsert({
    where: { name: 'Flour' },
    update: {},
    create: { name: 'Flour', description: 'Various types of flour.', order: 1 },
  });
  const liquidCategory = await prisma.ingredientCategory.upsert({
    where: { name: 'Liquid' },
    update: {},
    create: { name: 'Liquid', description: 'Water, milk, etc.', order: 2 },
  });
  const saltCategory = await prisma.ingredientCategory.upsert({
    where: { name: 'Salt' },
    update: {},
    create: { name: 'Salt', description: 'All types of salt.', order: 3 },
  });
  const prefermentCategory = await prisma.ingredientCategory.upsert({
    where: { name: 'Preferment/Starter' },
    update: {},
    create: { name: 'Preferment/Starter', description: 'Levain, poolish, biga, etc.', order: 4 },
  });
  const inclusionsCategory = await prisma.ingredientCategory.upsert({
    where: { name: 'Inclusions' },
    update: {},
    create: { name: 'Inclusions', description: 'Seeds, nuts, dried fruit, etc.', order: 5 },
  });
  const enrichmentsCategory = await prisma.ingredientCategory.upsert({
    where: { name: 'Enrichments' },
    update: {},
    create: { name: 'Enrichments', description: 'Butter, oil, sugar, eggs, etc.', order: 6 },
  });
  const aidsCategory = await prisma.ingredientCategory.upsert({
    where: { name: 'Processing Aids' },
    update: {},
    create: { name: 'Processing Aids', description: 'Malt, ascorbic acid, etc.', order: 7 },
  });

  // --- Ingredients ---
  const flour = await prisma.ingredient.upsert({
    where: { name: 'Bread Flour' },
    update: {},
    create: { name: 'Bread Flour', ingredientCategoryId: flourCategory.id },
  });
  const wholeWheatFlour = await prisma.ingredient.upsert({
    where: { name: 'Whole Wheat Flour' },
    update: {},
    create: { name: 'Whole Wheat Flour', ingredientCategoryId: flourCategory.id },
  });
  const ryeFlour = await prisma.ingredient.upsert({
    where: { name: 'Rye Flour' },
    update: {},
    create: { name: 'Rye Flour', ingredientCategoryId: flourCategory.id, advanced: true },
  });
  const water = await prisma.ingredient.upsert({
    where: { name: 'Water' },
    update: {},
    create: { name: 'Water', ingredientCategoryId: liquidCategory.id },
  });
  const salt = await prisma.ingredient.upsert({
    where: { name: 'Salt' },
    update: {},
    create: { name: 'Salt', ingredientCategoryId: saltCategory.id },
  });
  const levain = await prisma.ingredient.upsert({
    where: { name: 'Levain' },
    update: {},
    create: { name: 'Levain', ingredientCategoryId: prefermentCategory.id },
  });
  const sunflowerSeeds = await prisma.ingredient.upsert({
    where: { name: 'Sunflower Seeds' },
    update: {},
    create: { name: 'Sunflower Seeds', ingredientCategoryId: inclusionsCategory.id },
  });
  const honey = await prisma.ingredient.upsert({
    where: { name: 'Honey' },
    update: {},
    create: { name: 'Honey', ingredientCategoryId: enrichmentsCategory.id, advanced: true },
  });

  // --- Step Types ---
  const prepType = await prisma.stepType.upsert({
    where: { name: 'Preparation' },
    update: {},
    create: { name: 'Preparation', description: 'Gather and prep ingredients.' },
  });
  const mixType = await prisma.stepType.upsert({
    where: { name: 'Mixing' },
    update: {},
    create: { name: 'Mixing', description: 'Mix dough ingredients.' },
  });
  const fermentType = await prisma.stepType.upsert({
    where: { name: 'Fermentation' },
    update: {},
    create: { name: 'Fermentation', description: 'Bulk fermentation.' },
  });
  const shapeType = await prisma.stepType.upsert({
    where: { name: 'Shaping' },
    update: {},
    create: { name: 'Shaping', description: 'Shape the dough.' },
  });
  const proofType = await prisma.stepType.upsert({
    where: { name: 'Proofing' },
    update: {},
    create: { name: 'Proofing', description: 'Final proof before baking.' },
  });
  const bakeType = await prisma.stepType.upsert({
    where: { name: 'Baking' },
    update: {},
    create: { name: 'Baking', description: 'Bake the dough.' },
  });
  const coolType = await prisma.stepType.upsert({
    where: { name: 'Cooling' },
    update: {},
    create: { name: 'Cooling', description: 'Cool the bread.' },
  });

  // --- Fields ---
  const totalWeightField = await prisma.field.upsert({
    where: { name: 'Total Dough Weight (g)' },
    update: {},
    create: { name: 'Total Dough Weight (g)', type: 'float', description: 'Total weight of finished dough.' },
  });
  const hydrationField = await prisma.field.upsert({
    where: { name: 'Hydration (%)' },
    update: {},
    create: { name: 'Hydration (%)', type: 'float', description: 'Total hydration percent.' },
  });
  const saltPctField = await prisma.field.upsert({
    where: { name: 'Salt (%)' },
    update: {},
    create: { name: 'Salt (%)', type: 'float', description: 'Salt percent.' },
  });
  const foldsField = await prisma.field.upsert({
    where: { name: 'Number of Folds' },
    update: {},
    create: { name: 'Number of Folds', type: 'integer', description: 'Number of folds during bulk fermentation.' },
  });
  const foldIntervalField = await prisma.field.upsert({
    where: { name: 'Fold Interval (minutes)' },
    update: {},
    create: { name: 'Fold Interval (minutes)', type: 'integer', description: 'Minutes between folds.' },
  });
  const foldTypeField = await prisma.field.upsert({
    where: { name: 'Fold Type (text)' },
    update: {},
    create: { name: 'Fold Type (text)', type: 'text', description: 'Type of fold.', advanced: true },
  });
  const initialBakeField = await prisma.field.upsert({
    where: { name: 'Initial Bake Duration (Covered/Steamed)' },
    update: {},
    create: { name: 'Initial Bake Duration (Covered/Steamed)', type: 'integer', description: 'Initial covered bake time.' },
  });
  const finalBakeField = await prisma.field.upsert({
    where: { name: 'Final Bake Duration (Uncovered)' },
    update: {},
    create: { name: 'Final Bake Duration (Uncovered)', type: 'integer', description: 'Final uncovered bake time.' },
  });
  const notesField = await prisma.field.upsert({
    where: { name: 'Notes' },
    update: {},
    create: { name: 'Notes', type: 'text', description: 'General notes.' },
  });
  const prefermentPctField = await prisma.field.upsert({
    where: { name: 'Preferment % of Total Dough Weight' },
    update: {},
    create: { name: 'Preferment % of Total Dough Weight', type: 'float', description: 'Percent of dough weight as preferment.' },
  });
  const prefermentHydrationField = await prisma.field.upsert({
    where: { name: 'Target Preferment Hydration (%)' },
    update: {},
    create: { name: 'Target Preferment Hydration (%)', type: 'float', description: 'Hydration of the preferment.' },
  });

  // --- Step Templates ---
  const mixDoughTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Mix Dough' },
    update: {},
    create: {
      name: 'Mix Dough',
      stepTypeId: mixType.id,
      description: 'Mix all main dough ingredients.',
      active: true,
      fields: {
        create: [
          { fieldId: totalWeightField.id },
          { fieldId: hydrationField.id },
          { fieldId: saltPctField.id },
          { fieldId: notesField.id },
        ],
      },
      ingredientRules: {
        create: [
          { ingredientCategoryId: flourCategory.id, required: true },
          { ingredientCategoryId: liquidCategory.id, required: false },
          { ingredientCategoryId: saltCategory.id, required: false },
          { ingredientCategoryId: inclusionsCategory.id, required: false },
        ],
      },
    },
  });

  const prefermentTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Activate Starter / Feed Levain' },
    update: {},
    create: {
      name: 'Activate Starter / Feed Levain',
      stepTypeId: prepType.id,
      description: 'Build and activate levain or other preferment.',
      active: true,
      fields: {
        create: [
          { fieldId: prefermentPctField.id },
          { fieldId: prefermentHydrationField.id },
          { fieldId: notesField.id },
        ],
      },
      ingredientRules: {
        create: [
          { ingredientCategoryId: flourCategory.id, required: true },
          { ingredientCategoryId: liquidCategory.id, required: true },
        ],
      },
    },
  });

  // --- Predefined Recipes ---
  const classicRecipe = await prisma.recipe.findFirst({ where: { name: 'Classic Everyday Sourdough' } });
  if (!classicRecipe) {
    await prisma.recipe.create({
      data: {
        name: 'Classic Everyday Sourdough',
        ownerId: systemUser.id,
        isPredefined: true,
        totalWeight: 1000,
        hydrationPct: 75,
        saltPct: 2,
        steps: {
          create: [
            {
              stepTemplateId: prefermentTemplate.id,
              order: 1,
              notes: 'Build levain overnight.',
              fields: {
                create: [
                  { fieldId: prefermentPctField.id, value: 20 },
                  { fieldId: prefermentHydrationField.id, value: 100 },
                ],
              },
              ingredients: {
                create: [
                  { ingredientId: flour.id, percentage: 50 },
                  { ingredientId: wholeWheatFlour.id, percentage: 50 },
                  { ingredientId: water.id, percentage: 100 },
                ],
              },
            },
            {
              stepTemplateId: mixDoughTemplate.id,
              order: 2,
              notes: 'Mix all ingredients.',
              fields: {
                create: [
                  { fieldId: hydrationField.id, value: 75 },
                  { fieldId: saltPctField.id, value: 2 },
                ],
              },
              ingredients: {
                create: [
                  { ingredientId: flour.id, percentage: 90 },
                  { ingredientId: wholeWheatFlour.id, percentage: 10 },
                  // Water and salt handled globally for standard recipes
                ],
              },
            },
          ],
        },
      },
    });
  }

  // --- Demo User for Requests ---
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@sourdough.app' },
    update: {},
    create: {
      email: 'demo@sourdough.app',
      role: 'user',
      emailVerified: true,
      isActive: true,
      notes: 'Demo user for sample entity requests.',
    },
  });

  // --- Sample Entity Requests ---
  await prisma.entityRequest.upsert({
    where: { id: 1 }, // Use upsert for demo; in production use unique constraint fields if any
    update: {},
    create: {
      userId: demoUser.id,
      type: 'ingredient',
      name: 'Spelt Flour',
      description: 'Request to add Spelt Flour as a new ingredient.',
      extra: {
        ingredientCategory: 'Flour',
        suggestedDescription: 'Ancient grain, mild nutty flavor',
      },
      status: 'pending',
    },
  });

  await prisma.entityRequest.upsert({
    where: { id: 2 },
    update: {},
    create: {
      userId: demoUser.id,
      type: 'stepType',
      name: 'Autolyse',
      description: 'Suggest adding Autolyse as a step type.',
      extra: {
        stepUsage: 'Rest flour and water before mixing other ingredients.',
        icon: '⏳'
      },
      status: 'pending',
    },
  });

  console.log(`Seeding finished.`);
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });