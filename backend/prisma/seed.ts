// backend/prisma/seed.ts

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
  const flourCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Flour' }, update: {}, create: { name: 'Flour', order: 1 } });
  const liquidCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Liquid' }, update: {}, create: { name: 'Liquid', order: 2 } });
  const saltCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Salt' }, update: {}, create: { name: 'Salt', order: 3 } });
  const prefermentCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Preferment/Starter' }, update: {}, create: { name: 'Preferment/Starter', order: 4 } });
  const inclusionsCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Inclusions' }, update: {}, create: { name: 'Inclusions', order: 5 } });
  const enrichmentsCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Enrichments' }, update: {}, create: { name: 'Enrichments', order: 6 } });
  
  console.log('Seeded Ingredient Categories');

  // --- Ingredients ---
  const flour = await prisma.ingredient.upsert({ where: { name: 'Bread Flour' }, update: {}, create: { name: 'Bread Flour', ingredientCategoryId: flourCategory.id } });
  const wholeWheatFlour = await prisma.ingredient.upsert({ where: { name: 'Whole Wheat Flour' }, update: {}, create: { name: 'Whole Wheat Flour', ingredientCategoryId: flourCategory.id } });
  const water = await prisma.ingredient.upsert({ where: { name: 'Water' }, update: {}, create: { name: 'Water', ingredientCategoryId: liquidCategory.id } });
  const salt = await prisma.ingredient.upsert({ where: { name: 'Salt' }, update: {}, create: { name: 'Salt', ingredientCategoryId: saltCategory.id } });
  const levain = await prisma.ingredient.upsert({ where: { name: 'Levain' }, update: {}, create: { name: 'Levain', ingredientCategoryId: prefermentCategory.id } });
  
  console.log('Seeded Ingredients');

  // --- Step Types ---
  const prepType = await prisma.stepType.upsert({ where: { name: 'Preparation' }, update: {}, create: { name: 'Preparation' } });
  const mixType = await prisma.stepType.upsert({ where: { name: 'Mixing' }, update: {}, create: { name: 'Mixing' } });
  const fermentType = await prisma.stepType.upsert({ where: { name: 'Fermentation' }, update: {}, create: { name: 'Fermentation' } });
  const bakeType = await prisma.stepType.upsert({ where: { name: 'Baking' }, update: {}, create: { name: 'Baking' } });
  
  console.log('Seeded Step Types');

  // --- Step-Level Parameters ---
  // Note: We have removed recipe-level concepts like "Hydration (%)" from here.
  const notesField = await prisma.stepParameter.upsert({ where: { name: 'Notes' }, update: {}, create: { name: 'Notes', type: 'text', description: 'General notes.' } });
  const durationField = await prisma.stepParameter.upsert({ where: { name: 'Duration (minutes)' }, update: {}, create: { name: 'Duration (minutes)', type: 'integer', description: 'Duration of the step in minutes.' } });
  const tempField = await prisma.stepParameter.upsert({ where: { name: 'Dough Temperature (C)' }, update: {}, create: { name: 'Dough Temperature (C)', type: 'integer', description: 'Target dough temperature.' } });
  
  console.log('Seeded Step Parameters');

  // --- Recipe-Level Parameters ---
  const recipeParameters = [
    { name: 'name', label: 'Recipe Name', type: 'string', order: 1, required: true, defaultValue: 'Untitled Recipe' },
    { name: 'totalWeight', label: 'Total Dough Weight (g)', type: 'number', order: 2, required: true, defaultValue: '1000' },
    { name: 'hydrationPct', label: 'Target Hydration (%)', type: 'number', order: 3, required: true, defaultValue: '75' },
    { name: 'saltPct', label: 'Salt (%)', type: 'number', order: 4, required: true, defaultValue: '2' },
    { name: 'notes', label: 'Recipe Notes', type: 'text', order: 5, required: false },
  ];
  
  const recipeParamRecords = [];
  for (const param of recipeParameters) {
    const record = await prisma.recipeParameter.upsert({ where: { name: param.name }, update: {}, create: param });
    recipeParamRecords.push(record);
  }
  console.log("Seeded Recipe Parameters.");

  // --- Step Templates ---
  const mixDoughTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Mix Dough' },
    update: {},
    create: {
      name: 'Mix Dough',
      stepTypeId: mixType.id,
      description: 'Mix all main dough ingredients.',
      parameters: { create: [{ parameterId: notesField.id }, { parameterId: durationField.id }] },
      ingredientRules: { create: [{ ingredientCategoryId: flourCategory.id, required: true }, { ingredientCategoryId: liquidCategory.id, required: true }, { ingredientCategoryId: saltCategory.id, required: true }] },
    },
  });

  const bulkFermentTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Bulk Fermentation' },
    update: {},
    create: {
      name: 'Bulk Fermentation',
      stepTypeId: fermentType.id,
      description: 'First fermentation phase with folds.',
      parameters: { create: [{ parameterId: notesField.id }, { parameterId: durationField.id }, { parameterId: tempField.id }] },
    },
  });
  console.log('Seeded Step Templates');

  // --- Predefined Recipe ---
  const classicRecipeName = 'Classic Everyday Sourdough';
  const existingRecipe = await prisma.recipe.findFirst({
    where: { parameterValues: { some: { parameter: { name: 'name' }, value: classicRecipeName } } }
  });

  if (!existingRecipe) {
    await prisma.recipe.create({
      data: {
        ownerId: systemUser.id,
        isPredefined: true,
        parameterValues: {
          create: [
            { parameterId: recipeParamRecords.find(p => p.name === 'name')!.id, value: classicRecipeName },
            { parameterId: recipeParamRecords.find(p => p.name === 'totalWeight')!.id, value: '950' },
            { parameterId: recipeParamRecords.find(p => p.name === 'hydrationPct')!.id, value: '78' },
            { parameterId: recipeParamRecords.find(p => p.name === 'saltPct')!.id, value: '2.2' },
            { parameterId: recipeParamRecords.find(p => p.name === 'notes')!.id, value: 'A versatile and reliable country loaf.' },
          ]
        },
        steps: {
          create: [
            {
              stepTemplateId: mixDoughTemplate.id,
              order: 1,
              notes: 'Mix until just combined (shaggy mass).',
              parameterValues: { create: [{ parameterId: durationField.id, value: '15' }] },
              ingredients: {
                create: [
                  { ingredientId: flour.id, percentage: 90 },
                  { ingredientId: wholeWheatFlour.id, percentage: 10 },
                  { ingredientId: water.id, percentage: 78 },
                  { ingredientId: salt.id, percentage: 2.2 },
                  { ingredientId: levain.id, percentage: 20 },
                ]
              }
            },
            {
              stepTemplateId: bulkFermentTemplate.id,
              order: 2,
              notes: 'Perform 4 sets of folds every 30 minutes for the first 2 hours.',
              parameterValues: { create: [{ parameterId: durationField.id, value: '240' }, { parameterId: tempField.id, value: '25' }] },
            }
          ]
        }
      }
    });
    console.log(`Created recipe: ${classicRecipeName}`);
  } else {
    console.log(`${classicRecipeName} recipe already exists.`);
  }

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