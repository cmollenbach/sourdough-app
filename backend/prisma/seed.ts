// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- 1. CLEANUP ---
  console.log('Cleaning up existing data...');
  await prisma.recipeParameterValue.deleteMany({});
  await prisma.recipeStepParameterValue.deleteMany({});
  await prisma.recipeStepIngredient.deleteMany({});
  await prisma.recipeStep.deleteMany({});
  await prisma.recipe.deleteMany({ where: { isPredefined: true } });
  await prisma.stepTemplateParameter.deleteMany({});
  await prisma.stepTemplateIngredientRule.deleteMany({});
  await prisma.stepTemplate.deleteMany({});
  await prisma.ingredient.deleteMany({});
  await prisma.ingredientCategory.deleteMany({});
  await prisma.stepType.deleteMany({});
  await prisma.stepParameter.deleteMany({});
  await prisma.recipeParameter.deleteMany({});
  console.log('Cleanup complete.');

  // --- 2. SEED SYSTEM DATA ---
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

  // Ingredient Categories
  console.log('Seeding Ingredient Categories...');
  const flourCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Flour' }, update: {}, create: { name: 'Flour', order: 1 }});
  const liquidCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Liquid' }, update: {}, create: { name: 'Liquid', order: 2 }});
  const saltCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Salt' }, update: {}, create: { name: 'Salt', order: 3 }});
  const prefermentCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Preferment/Starter' }, update: {}, create: { name: 'Preferment/Starter', order: 4 }});
  const inclusionsCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Inclusions' }, update: {}, create: { name: 'Inclusions', order: 5 }});
  const enrichmentsCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Enrichments' }, update: {}, create: { name: 'Enrichments', order: 6 }});

  // Ingredients
  console.log('Seeding Ingredients...');
  const apFlour = await prisma.ingredient.upsert({ where: { name: 'All-Purpose Flour' }, update: {}, create: { name: 'All-Purpose Flour', ingredientCategoryId: flourCategory.id }});
  const breadFlour = await prisma.ingredient.upsert({ where: { name: 'Bread Flour' }, update: {}, create: { name: 'Bread Flour', ingredientCategoryId: flourCategory.id }});
  const wholeWheatFlour = await prisma.ingredient.upsert({ where: { name: 'Whole Wheat Flour' }, update: {}, create: { name: 'Whole Wheat Flour', ingredientCategoryId: flourCategory.id }});
  const ryeFlour = await prisma.ingredient.upsert({ where: { name: 'Rye Flour' }, update: {}, create: { name: 'Rye Flour', ingredientCategoryId: flourCategory.id, advanced: true }});
  const speltFlour = await prisma.ingredient.upsert({ where: { name: 'Spelt Flour' }, update: {}, create: { name: 'Spelt Flour', ingredientCategoryId: flourCategory.id, advanced: true }});
  const water = await prisma.ingredient.upsert({ where: { name: 'Water' }, update: {}, create: { name: 'Water', ingredientCategoryId: liquidCategory.id }});
  const salt = await prisma.ingredient.upsert({ where: { name: 'Salt' }, update: {}, create: { name: 'Salt', ingredientCategoryId: saltCategory.id }});
  const levain = await prisma.ingredient.upsert({ where: { name: 'Active Sourdough Starter' }, update: {}, create: { name: 'Active Sourdough Starter', ingredientCategoryId: prefermentCategory.id }});
  const oliveOil = await prisma.ingredient.upsert({ where: { name: 'Olive Oil' }, update: {}, create: { name: 'Olive Oil', ingredientCategoryId: enrichmentsCategory.id, advanced: true }});
  const rolledOats = await prisma.ingredient.upsert({ where: { name: 'Rolled Oats' }, update: {}, create: { name: 'Rolled Oats', ingredientCategoryId: inclusionsCategory.id, advanced: true }});
  const cheddarCheese = await prisma.ingredient.upsert({ where: { name: 'Cheddar Cheese' }, update: {}, create: { name: 'Cheddar Cheese', ingredientCategoryId: inclusionsCategory.id, advanced: true }});
  const jalapenos = await prisma.ingredient.upsert({ where: { name: 'Pickled Jalapeños' }, update: {}, create: { name: 'Pickled Jalapeños', ingredientCategoryId: inclusionsCategory.id, advanced: true }});

  // Step Types
  console.log('Seeding Step Types...');
  const prepType = await prisma.stepType.upsert({ where: { name: 'Preparation' }, update: {}, create: { name: 'Preparation' }});
  const mixType = await prisma.stepType.upsert({ where: { name: 'Mixing' }, update: {}, create: { name: 'Mixing' }});
  const fermentType = await prisma.stepType.upsert({ where: { name: 'Fermentation' }, update: {}, create: { name: 'Fermentation' }});
  const shapeType = await prisma.stepType.upsert({ where: { name: 'Shaping' }, update: {}, create: { name: 'Shaping' }});
  const proofType = await prisma.stepType.upsert({ where: { name: 'Proofing' }, update: {}, create: { name: 'Proofing' }});
  const bakeType = await prisma.stepType.upsert({ where: { name: 'Baking' }, update: {}, create: { name: 'Baking' }});
  const coolType = await prisma.stepType.upsert({ where: { name: 'Cooling' }, update: {}, create: { name: 'Cooling' }});

  // Step Parameters
  console.log('Seeding Step Parameters...');
  const durationParam = await prisma.stepParameter.upsert({ where: { name: 'Duration (minutes)' }, update: {}, create: { name: 'Duration (minutes)', type: 'integer' }});
  const tempParam = await prisma.stepParameter.upsert({ where: { name: 'Temperature (°C)' }, update: {}, create: { name: 'Temperature (°C)', type: 'integer' }});
  const numFoldsParam = await prisma.stepParameter.upsert({ where: { name: 'Number of Folds' }, update: {}, create: { name: 'Number of Folds', type: 'integer' }});
  const foldTypeParam = await prisma.stepParameter.upsert({ where: { name: 'Fold Type' }, update: {}, create: { name: 'Fold Type', type: 'text', advanced: true }});
  const prefermentPctParam = await prisma.stepParameter.upsert({ where: { name: 'Preferment % of Total Flour' }, update: {}, create: { name: 'Preferment % of Total Flour', type: 'float', advanced: true }});
  const prefermentHydrationParam = await prisma.stepParameter.upsert({ where: { name: 'Preferment Hydration (%)' }, update: {}, create: { name: 'Preferment Hydration (%)', type: 'float', advanced: true }});

  // Step Templates
  console.log('Seeding Step Templates...');
  const feedStarterTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Feed Starter (Build Levain)' }, update: {}, create: { name: 'Feed Starter (Build Levain)', stepTypeId: prepType.id, order: 1, parameters: { create: [{ parameterId: prefermentPctParam.id }, { parameterId: prefermentHydrationParam.id }]}}});
  const autolyseTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Autolyse' }, update: {}, create: { name: 'Autolyse', stepTypeId: prepType.id, advanced: true, order: 2, parameters: { create: [{ parameterId: durationParam.id }]}}});
  const mixTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Mix' }, update: {}, create: { name: 'Mix', stepTypeId: mixType.id, order: 3 }});
  const stretchFoldTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Stretch and Fold' }, update: {}, create: { name: 'Stretch and Fold', stepTypeId: fermentType.id, order: 4, parameters: { create: [{ parameterId: numFoldsParam.id }]}}});
  const bulkFermentTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Bulk Ferment' }, update: {}, create: { name: 'Bulk Ferment', stepTypeId: fermentType.id, order: 5, parameters: { create: [{ parameterId: durationParam.id }]}}});
  const shapeTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Shape' }, update: {}, create: { name: 'Shape', stepTypeId: shapeType.id, order: 6 }});
  const finalProofTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Final Proof' }, update: {}, create: { name: 'Final Proof', stepTypeId: proofType.id, order: 7, parameters: { create: [{ parameterId: durationParam.id }, { parameterId: tempParam.id }]}}});
  const bakeTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Bake' }, update: {}, create: { name: 'Bake', stepTypeId: bakeType.id, order: 8, parameters: { create: [{ parameterId: durationParam.id }, { parameterId: tempParam.id }]}}});
  const coolTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Cool' }, update: {}, create: { name: 'Cool', stepTypeId: coolType.id, order: 9, parameters: { create: [{ parameterId: durationParam.id }]}}});
  const cookPorridgeTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Cook Porridge' }, update: {}, create: { name: 'Cook Porridge', stepTypeId: prepType.id, advanced: true, order: 10 }});
  const laminationTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Lamination' }, update: {}, create: { name: 'Lamination', stepTypeId: fermentType.id, advanced: true, order: 11 }});
  const coilFoldTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Coil Folds' }, update: {}, create: { name: 'Coil Folds', stepTypeId: fermentType.id, advanced: true, order: 12, parameters: { create: [{ parameterId: numFoldsParam.id }, { parameterId: foldTypeParam.id }]}}});
  
  // Recipe Parameters Metadata
  const recipeParameters = [
    { name: 'name', label: 'Recipe Name', type: 'string', order: 1, visible: true, required: true },
    { name: 'description', label: 'Description', type: 'text', order: 2, visible: true },
    { name: 'totalWeight', label: 'Total Dough Weight (g)', type: 'number', order: 3, visible: true, required: true },
    { name: 'hydrationPct', label: 'Hydration (%)', type: 'number', order: 4, visible: true, required: true },
    { name: 'saltPct', label: 'Salt (%)', type: 'number', order: 5, visible: true, required: true },
    { name: 'notes', label: 'Notes', type: 'text', order: 6, visible: true }
  ];
  for (const param of recipeParameters) {
    await prisma.recipeParameter.upsert({ where: { name: param.name }, update: {}, create: param });
  }
  const recipeParamMap = (await prisma.recipeParameter.findMany()).reduce((acc, param) => {
    acc[param.name] = param.id;
    return acc;
  }, {} as Record<string, number>);
  console.log("Seeded recipe parameters metadata.");

  // --- 3. SEED RECIPE TEMPLATES ---
  console.log("Seeding Recipe Templates...");

  // --- Add ingredient rules to step templates ---
  await prisma.stepTemplate.update({
    where: { id: feedStarterTemplate.id },
    data: {
      ingredientRules: {
        create: [
          { ingredientCategoryId: flourCategory.id },
          { ingredientCategoryId: liquidCategory.id },
          { ingredientCategoryId: prefermentCategory.id },
        ]
      }
    }
  });
  await prisma.stepTemplate.update({
    where: { id: autolyseTemplate.id },
    data: {
      ingredientRules: {
        create: [
          { ingredientCategoryId: flourCategory.id },
          { ingredientCategoryId: liquidCategory.id },
        ]
      }
    }
  });
  await prisma.stepTemplate.update({
    where: { id: mixTemplate.id },
    data: {
      ingredientRules: {
        create: [
          { ingredientCategoryId: flourCategory.id },
          { ingredientCategoryId: liquidCategory.id },
          { ingredientCategoryId: saltCategory.id },
          { ingredientCategoryId: prefermentCategory.id },
          { ingredientCategoryId: enrichmentsCategory.id },
          { ingredientCategoryId: inclusionsCategory.id },
        ]
      }
    }
  });
  await prisma.stepTemplate.update({
    where: { id: laminationTemplate.id },
    data: {
      ingredientRules: {
        create: [
          { ingredientCategoryId: inclusionsCategory.id },
        ]
      }
    }
  });
  await prisma.stepTemplate.update({
    where: { id: cookPorridgeTemplate.id },
    data: {
      ingredientRules: {
        create: [
          { ingredientCategoryId: inclusionsCategory.id },
          { ingredientCategoryId: liquidCategory.id },
        ]
      }
    }
  });
  // Add more as needed for other templates...

  // Recipe 1: Simple Base Recipe
  await prisma.recipe.create({
    data: {
      ownerId: systemUser.id,
      isPredefined: true,
      parameterValues: { create: [
        { parameterId: recipeParamMap.name, value: 'Simple Base Recipe' },
        { parameterId: recipeParamMap.description, value: 'The most basic starting point. A simple, reliable recipe to build upon.' },
        { parameterId: recipeParamMap.totalWeight, value: '1000' },
        { parameterId: recipeParamMap.hydrationPct, value: '72' },
        { parameterId: recipeParamMap.saltPct, value: '2' },
      ]},
      steps: { create: [
        { stepTemplateId: feedStarterTemplate.id, order: 1, notes: 'Build your levain to be 10% of the total flour weight.',
          parameterValues: { create: [ { parameterId: prefermentPctParam.id, value: '10' }, { parameterId: prefermentHydrationParam.id, value: '100' } ]},
          ingredients: { create: [ { ingredientId: breadFlour.id, percentage: 50 }, { ingredientId: wholeWheatFlour.id, percentage: 50 } ]}},
        { stepTemplateId: mixTemplate.id, order: 2, notes: 'Mix final dough ingredients. The levain will be added automatically.', ingredients: { create: [
          { ingredientId: breadFlour.id, percentage: 100 }, { ingredientId: water.id, percentage: 72 }, { ingredientId: salt.id, percentage: 2 } ]}},
      ]}
    }
  });
  console.log('Created: Simple Base Recipe');

  // Recipe 2: Simple Overnight Loaf
  await prisma.recipe.create({
    data: {
      ownerId: systemUser.id,
      isPredefined: true,
      parameterValues: { create: [
        { parameterId: recipeParamMap.name, value: 'Simple Overnight Loaf' },
        { parameterId: recipeParamMap.description, value: 'A forgiving, no-fuss recipe that relies on time more than technique.' },
        { parameterId: recipeParamMap.totalWeight, value: '960' },
        { parameterId: recipeParamMap.hydrationPct, value: '70' },
        { parameterId: recipeParamMap.saltPct, value: '2' },
      ]},
      steps: { create: [
        { stepTemplateId: feedStarterTemplate.id, order: 1 },
        { stepTemplateId: mixTemplate.id, order: 2, notes: 'Mix all ingredients in the evening.', ingredients: { create: [
          { ingredientId: apFlour.id, percentage: 100 }, { ingredientId: water.id, percentage: 70 }, { ingredientId: levain.id, percentage: 20 }, { ingredientId: salt.id, percentage: 2 } ]}},
        { stepTemplateId: bulkFermentTemplate.id, order: 3, notes: 'Leave covered on the counter for 8-12 hours.', parameterValues: { create: [{ parameterId: durationParam.id, value: '600' }]}},
        { stepTemplateId: shapeTemplate.id, order: 4, notes: 'In the morning, gently fold into a round ball.' },
        { stepTemplateId: finalProofTemplate.id, order: 5, notes: 'Rest for 1 hour while oven preheats.', parameterValues: { create: [{ parameterId: durationParam.id, value: '60' }, {parameterId: tempParam.id, value: '22'}]}},
        { stepTemplateId: bakeTemplate.id, order: 6, notes: 'Bake covered for 25 mins, then uncovered for 20-25 mins.', parameterValues: { create: [{ parameterId: durationParam.id, value: '45' }, {parameterId: tempParam.id, value: '230'}]}},
      ]}
    }
  });
  console.log('Created: Simple Overnight Loaf');

  // Recipe 3: Classic Country Loaf
  await prisma.recipe.create({
    data: {
      ownerId: systemUser.id,
      isPredefined: true,
      parameterValues: { create: [
        { parameterId: recipeParamMap.name, value: 'Classic Country Loaf' },
        { parameterId: recipeParamMap.description, value: 'A foundational recipe that teaches the core rhythm of sourdough baking and the "stretch and fold" technique.'},
        { parameterId: recipeParamMap.totalWeight, value: '1000' },
        { parameterId: recipeParamMap.hydrationPct, value: '75' },
        { parameterId: recipeParamMap.saltPct, value: '2' },
      ]},
      steps: { create: [
        { stepTemplateId: feedStarterTemplate.id, order: 1 },
        { stepTemplateId: autolyseTemplate.id, order: 2, notes: 'Mix flours and water, rest for 60 mins.', parameterValues: { create: [{ parameterId: durationParam.id, value: '60' }]}, ingredients: { create: [ { ingredientId: breadFlour.id, percentage: 90 }, { ingredientId: wholeWheatFlour.id, percentage: 10 }, { ingredientId: water.id, percentage: 75 } ]}},
        { stepTemplateId: mixTemplate.id, order: 3, notes: 'Add starter and salt, mix to combine.', ingredients: { create: [ { ingredientId: levain.id, percentage: 20 }, { ingredientId: salt.id, percentage: 2 } ]}},
        { stepTemplateId: stretchFoldTemplate.id, order: 4, notes: 'Perform 4 sets of folds, 30 mins apart.', parameterValues: { create: [{ parameterId: numFoldsParam.id, value: '4' }]}},
        { stepTemplateId: bulkFermentTemplate.id, order: 5, notes: 'Rest for 2-3 hours after last fold.', parameterValues: { create: [{ parameterId: durationParam.id, value: '150' }]}},
        { stepTemplateId: shapeTemplate.id, order: 6 },
        { stepTemplateId: finalProofTemplate.id, order: 7, notes: 'Cover and refrigerate for 12-18 hours.', parameterValues: { create: [{ parameterId: durationParam.id, value: '840' }, {parameterId: tempParam.id, value: '4'}]}},
        { stepTemplateId: bakeTemplate.id, order: 8, notes: 'Bake from fridge, 20 mins covered, 20-25 mins uncovered.', parameterValues: { create: [{ parameterId: durationParam.id, value: '45' }, {parameterId: tempParam.id, value: '230'}]}},
      ]}
    }
  });
  console.log('Created: Classic Country Loaf');

  // Recipe 4: Soft Sourdough Sandwich Loaf
  await prisma.recipe.create({
    data: {
      ownerId: systemUser.id,
      isPredefined: true,
      parameterValues: { create: [
        { parameterId: recipeParamMap.name, value: 'Soft Sandwich Loaf' },
        { parameterId: recipeParamMap.description, value: 'Includes olive oil to produce a softer, more tender crumb perfect for sandwiches.'},
        { parameterId: recipeParamMap.totalWeight, value: '1050' },
        { parameterId: recipeParamMap.hydrationPct, value: '65' },
        { parameterId: recipeParamMap.saltPct, value: '2' },
      ]},
      steps: { create: [
        { stepTemplateId: feedStarterTemplate.id, order: 1 },
        { stepTemplateId: mixTemplate.id, order: 2, ingredients: { create: [ { ingredientId: breadFlour.id, percentage: 100 }, { ingredientId: water.id, percentage: 65 }, { ingredientId: levain.id, percentage: 30 }, { ingredientId: oliveOil.id, percentage: 5 }, { ingredientId: salt.id, percentage: 2 } ]}},
        { stepTemplateId: stretchFoldTemplate.id, order: 3, parameterValues: { create: [{ parameterId: numFoldsParam.id, value: '4' }]}},
        { stepTemplateId: bulkFermentTemplate.id, order: 4, parameterValues: { create: [{ parameterId: durationParam.id, value: '240' }]}},
        { stepTemplateId: shapeTemplate.id, order: 5 },
        { stepTemplateId: finalProofTemplate.id, order: 6, notes: 'Cover and refrigerate for 12-18 hours.', parameterValues: { create: [{ parameterId: durationParam.id, value: '840' }, {parameterId: tempParam.id, value: '4'}]}},
        { stepTemplateId: bakeTemplate.id, order: 7, parameterValues: { create: [{ parameterId: durationParam.id, value: '40' }, {parameterId: tempParam.id, value: '230'}]}},
      ]}
    }
  });
  console.log('Created: Soft Sourdough Sandwich Loaf');

  // Recipe 5: High-Hydration Challenge
  await prisma.recipe.create({
    data: {
      ownerId: systemUser.id,
      isPredefined: true,
      parameterValues: { create: [
        { parameterId: recipeParamMap.name, value: 'High-Hydration Challenge (85%)' },
        { parameterId: recipeParamMap.description, value: 'Master handling wet dough for a super open, custardy crumb. Requires gentle hands.'},
        { parameterId: recipeParamMap.totalWeight, value: '1000' },
        { parameterId: recipeParamMap.hydrationPct, value: '85' },
        { parameterId: recipeParamMap.saltPct, value: '2.2' },
      ]},
      steps: { create: [
        { stepTemplateId: feedStarterTemplate.id, order: 1 },
        { stepTemplateId: autolyseTemplate.id, order: 2, parameterValues: { create: [{ parameterId: durationParam.id, value: '90'}]}, ingredients: { create: [ { ingredientId: breadFlour.id, percentage: 90 }, { ingredientId: ryeFlour.id, percentage: 10 }, { ingredientId: water.id, percentage: 85 } ]}},
        { stepTemplateId: mixTemplate.id, order: 3, ingredients: { create: [ { ingredientId: levain.id, percentage: 20 }, { ingredientId: salt.id, percentage: 2.2 } ]}},
        { stepTemplateId: coilFoldTemplate.id, order: 4, notes: 'Use wet hands. Perform 5 gentle coil folds, 30 mins apart.', parameterValues: { create: [{ parameterId: numFoldsParam.id, value: '5' }, { parameterId: foldTypeParam.id, value: 'Coil Fold' }]}},
        { stepTemplateId: bulkFermentTemplate.id, order: 5, parameterValues: { create: [{ parameterId: durationParam.id, value: '180' }]}},
        { stepTemplateId: shapeTemplate.id, order: 6, notes: 'Be very gentle. Use a bench scraper and plenty of flour.'},
        { stepTemplateId: finalProofTemplate.id, order: 7, notes: 'Refrigerate for 12-16 hours.', parameterValues: { create: [{ parameterId: durationParam.id, value: '840' }, {parameterId: tempParam.id, value: '4'}]}},
        { stepTemplateId: bakeTemplate.id, order: 8, notes: 'Bake extra hot, 20 mins covered, 25 mins uncovered.', parameterValues: { create: [{ parameterId: durationParam.id, value: '45' }, {parameterId: tempParam.id, value: '260'}]}},
      ]}
    }
  });
  console.log('Created: High-Hydration Challenge (85%)');

  // Recipe 6: Oat Porridge Loaf
  await prisma.recipe.create({
    data: {
      ownerId: systemUser.id,
      isPredefined: true,
      parameterValues: { create: [
        { parameterId: recipeParamMap.name, value: 'Oat Porridge Loaf' },
        { parameterId: recipeParamMap.description, value: 'Adds a cooked porridge for an incredibly moist, soft crumb and a longer shelf life.'},
        { parameterId: recipeParamMap.totalWeight, value: '1100' },
        { parameterId: recipeParamMap.hydrationPct, value: '78' },
        { parameterId: recipeParamMap.saltPct, value: '2' },
      ]},
      steps: { create: [
        { stepTemplateId: feedStarterTemplate.id, order: 1 },
        { stepTemplateId: cookPorridgeTemplate.id, order: 2, notes: 'Cook oats with 2x weight in water until absorbed. Cool completely.', ingredients: { create: [ { ingredientId: rolledOats.id, percentage: 20 } ]}},
        { stepTemplateId: autolyseTemplate.id, order: 3, parameterValues: { create: [{ parameterId: durationParam.id, value: '60' }]}, ingredients: { create: [ { ingredientId: breadFlour.id, percentage: 80 }, { ingredientId: wholeWheatFlour.id, percentage: 20 }, { ingredientId: water.id, percentage: 78 } ]}},
        { stepTemplateId: mixTemplate.id, order: 4, ingredients: { create: [ { ingredientId: levain.id, percentage: 20 }, { ingredientId: salt.id, percentage: 2 } ]}},
        { stepTemplateId: laminationTemplate.id, order: 5, notes: 'After 1 hour, laminate the dough and spread the cooled porridge on top before folding.'},
        { stepTemplateId: coilFoldTemplate.id, order: 6, notes: 'Perform 3 gentle coil folds to incorporate.', parameterValues: { create: [{ parameterId: numFoldsParam.id, value: '3' }, { parameterId: foldTypeParam.id, value: 'Coil Fold' }]}},
        { stepTemplateId: bulkFermentTemplate.id, order: 7, parameterValues: { create: [{ parameterId: durationParam.id, value: '180' }]}},
        { stepTemplateId: shapeTemplate.id, order: 8},
        { stepTemplateId: finalProofTemplate.id, order: 9, parameterValues: { create: [{ parameterId: durationParam.id, value: '840' }, {parameterId: tempParam.id, value: '4'}]}},
        { stepTemplateId: bakeTemplate.id, order: 10, parameterValues: { create: [{ parameterId: durationParam.id, value: '50' }, {parameterId: tempParam.id, value: '230'}]}},
      ]}
    }
  });
  console.log('Created: Oat Porridge Loaf');

  // Recipe 7: Jalapeño-Cheddar Loaf
  await prisma.recipe.create({
    data: {
      ownerId: systemUser.id,
      isPredefined: true,
      parameterValues: { create: [
        { parameterId: recipeParamMap.name, value: 'Jalapeño-Cheddar Loaf' },
        { parameterId: recipeParamMap.description, value: 'Learn to add a large volume of savory inclusions using the lamination technique.'},
        { parameterId: recipeParamMap.totalWeight, value: '1200' },
        { parameterId: recipeParamMap.hydrationPct, value: '75' },
        { parameterId: recipeParamMap.saltPct, value: '2' },
      ]},
      steps: { create: [
        { stepTemplateId: feedStarterTemplate.id, order: 1},
        { stepTemplateId: autolyseTemplate.id, order: 2, parameterValues: { create: [{ parameterId: durationParam.id, value: '60'}]}, ingredients: { create: [ { ingredientId: breadFlour.id, percentage: 90 }, { ingredientId: speltFlour.id, percentage: 10 }, { ingredientId: water.id, percentage: 75 } ]}},
        { stepTemplateId: mixTemplate.id, order: 3, ingredients: { create: [ { ingredientId: levain.id, percentage: 20 }, { ingredientId: salt.id, percentage: 2 } ]}},
        { stepTemplateId: stretchFoldTemplate.id, order: 4, notes: 'Perform 2 sets of folds to build initial strength.', parameterValues: { create: [{ parameterId: numFoldsParam.id, value: '2' }]}},
        { stepTemplateId: laminationTemplate.id, order: 5, notes: 'Laminate dough and sprinkle evenly with cheese and jalapeños before folding.', ingredients: { create: [ { ingredientId: cheddarCheese.id, percentage: 25 }, { ingredientId: jalapenos.id, percentage: 10 }]}},
        { stepTemplateId: bulkFermentTemplate.id, order: 6, parameterValues: { create: [{ parameterId: durationParam.id, value: '150' }]}},
        { stepTemplateId: shapeTemplate.id, order: 7},
        { stepTemplateId: finalProofTemplate.id, order: 8, parameterValues: { create: [{ parameterId: durationParam.id, value: '840' }, {parameterId: tempParam.id, value: '4'}]}},
        { stepTemplateId: bakeTemplate.id, order: 9, parameterValues: { create: [{ parameterId: durationParam.id, value: '45' }, {parameterId: tempParam.id, value: '230'}]}},
      ]}
    }
  });
  console.log('Created: Jalapeño-Cheddar Loaf');


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