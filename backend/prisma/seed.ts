// prisma/seed.ts
import {
  PrismaClient,
  UserRole,
  ParameterDataType,
  IngredientCalculationMode,
  // StepExecutionStatus, // Not used in seed, but good to have if needed
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- 1. CLEANUP ---
  console.log('Cleaning up existing data...');
  await prisma.recipeStepParameterValue.deleteMany({});
  await prisma.recipeStepIngredient.deleteMany({});
  await prisma.recipeStep.deleteMany({});
  await prisma.recipe.deleteMany({ where: { isPredefined: true } });
  await prisma.stepTemplateParameter.deleteMany({});
  await prisma.stepTemplateIngredientRule.deleteMany({});
  await prisma.stepTemplate.deleteMany({});
  await prisma.stepType.deleteMany({});
  await prisma.stepParameter.deleteMany({});
  await prisma.user.deleteMany({ where: { email: 'system@sourdough.app' } });
  console.log('Cleanup complete.');

  // --- 2. SEED SYSTEM DATA ---
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@sourdough.app' },
    update: {},
    create: {
      email: 'system@sourdough.app',
      role: UserRole.ADMIN, // Using UserRole enum
      emailVerified: true,
      isActive: true,
      notes: 'System user for predefined recipes and system data.',
    },
  });
  console.log(`Upserted system user: ${systemUser.email}`);

  // --- Ingredient Categories ---
  console.log('Seeding Ingredient Categories...');
  const flourCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Flour' }, update: {}, create: { name: 'Flour', order: 1 } });
  const liquidCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Liquid' }, update: {}, create: { name: 'Liquid', order: 2 } });
  const saltCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Salt' }, update: {}, create: { name: 'Salt', order: 3 } });
  const prefermentCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Preferment' }, update: {}, create: { name: 'Preferment', order: 4, description: 'Sourdough starter, levain, or other preferments.' } });
  const inclusionsCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Inclusions' }, update: {}, create: { name: 'Inclusions', order: 5, description: 'Fruits, nuts, seeds, cheese, etc.' } });
  const enrichmentsCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Enrichments' }, update: {}, create: { name: 'Enrichments', order: 6, description: 'Fats, sugars, and dairy.' } });

  // --- Ingredients ---
  console.log('Seeding Ingredients...');
  // Non-Advanced
  const breadFlour = await prisma.ingredient.upsert({ where: { name: 'Bread Flour' }, update: {}, create: { name: 'Bread Flour', ingredientCategoryId: flourCategory.id, order: 1 } });
  const wholeWheatFlour = await prisma.ingredient.upsert({ where: { name: 'Whole Wheat Flour' }, update: {}, create: { name: 'Whole Wheat Flour', ingredientCategoryId: flourCategory.id, order: 2 } });
  const water = await prisma.ingredient.upsert({ where: { name: 'Water' }, update: {}, create: { name: 'Water', ingredientCategoryId: liquidCategory.id, order: 1 } });
  const salt = await prisma.ingredient.upsert({ where: { name: 'Fine Sea Salt' }, update: {}, create: { name: 'Fine Sea Salt', ingredientCategoryId: saltCategory.id, order: 1 } });
  const starter = await prisma.ingredient.upsert({ where: { name: 'Sourdough Starter' }, update: {}, create: { name: 'Sourdough Starter', ingredientCategoryId: prefermentCategory.id, order: 1 } });
  // Advanced
  const ryeFlour = await prisma.ingredient.upsert({ where: { name: 'Rye Flour' }, update: {}, create: { name: 'Rye Flour', ingredientCategoryId: flourCategory.id, advanced: true, order: 3 } });
  const speltFlour = await prisma.ingredient.upsert({ where: { name: 'Spelt Flour' }, update: {}, create: { name: 'Spelt Flour', ingredientCategoryId: flourCategory.id, advanced: true, order: 4 } });
  const oliveOil = await prisma.ingredient.upsert({ where: { name: 'Olive Oil' }, update: {}, create: { name: 'Olive Oil', ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 1 } });
  const honey = await prisma.ingredient.upsert({ where: { name: 'Honey' }, update: {}, create: { name: 'Honey', ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 2 } });
  const milk = await prisma.ingredient.upsert({ where: { name: 'Milk' }, update: {}, create: { name: 'Milk', ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 3 } });
  const butter = await prisma.ingredient.upsert({ where: { name: 'Butter' }, update: {}, create: { name: 'Butter', ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 4 } });
  const egg = await prisma.ingredient.upsert({ where: { name: 'Egg' }, update: {}, create: { name: 'Egg', ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 5 } });


  // --- Step Types (for grouping templates) ---
  console.log('Seeding Step Types...');
  const prepType = await prisma.stepType.upsert({ where: { name: 'Preparation' }, update: {}, create: { name: 'Preparation', description: 'Steps taken before mixing the main dough.', order: 1 } });
  const mixType = await prisma.stepType.upsert({ where: { name: 'Mixing' }, update: {}, create: { name: 'Mixing', description: 'Combining ingredients to form the dough.', order: 2 } });
  const bulkType = await prisma.stepType.upsert({ where: { name: 'Bulk Fermentation' }, update: {}, create: { name: 'Bulk Fermentation', description: 'The first rise of the dough, where strength and flavor develop.', order: 3 } });
  const shapeProofType = await prisma.stepType.upsert({ where: { name: 'Shaping & Proofing' }, update: {}, create: { name: 'Shaping & Proofing', description: 'Forming the loaf and the final rise.', order: 4 } });
  const bakeType = await prisma.stepType.upsert({ where: { name: 'Baking' }, update: {}, create: { name: 'Baking', description: 'Baking the loaf.', order: 5 } });

  // --- Step Parameters (the "Fields" for steps) ---
  console.log('Seeding Step Parameters...');
  const durationParam = await prisma.stepParameter.upsert({ where: { name: 'Duration (minutes)' }, update: {}, create: { name: 'Duration (minutes)', type: ParameterDataType.NUMBER, helpText: 'How long this step should last.', defaultValue: '60' } });
  const tempParam = await prisma.stepParameter.upsert({ where: { name: 'Temperature (°C)' }, update: {}, create: { name: 'Temperature (°C)', type: ParameterDataType.NUMBER, helpText: 'Target temperature for the dough or environment.', defaultValue: '24' } });
  const numFoldsParam = await prisma.stepParameter.upsert({ where: { name: 'Number of Folds' }, update: {}, create: { name: 'Number of Folds', type: ParameterDataType.NUMBER, advanced: true, helpText: 'How many sets of folds to perform.', defaultValue: '4' } });

  // --- Recipe Parameters (the "Fields" for recipes) ---
  // RecipeParameter table has been removed from the schema. No parameters to seed here.

  // --- Step Templates ---
  console.log('Seeding Step Templates...');
  // Non-Advanced Templates
  const prefermentTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Preferment' }, update: {}, create: {
      name: 'Preferment', stepTypeId: prepType.id, order: 1, description: 'Build the levain or starter.',
      ingredientRules: { create: [{ ingredientCategoryId: prefermentCategory.id, required: true }] }
    }
  });
  const mixTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Final Mix' }, update: {}, create: {
      name: 'Final Mix', stepTypeId: mixType.id, order: 2, description: 'Combine all ingredients for the final dough.',
      ingredientRules: { create: [{ ingredientCategoryId: flourCategory.id, required: true }, { ingredientCategoryId: liquidCategory.id, required: true }, { ingredientCategoryId: saltCategory.id, required: true }] }
    }
  });
  const bulkFermentTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Bulk Ferment' }, update: {}, create: {
      name: 'Bulk Ferment', stepTypeId: bulkType.id, order: 3, description: 'The first rise.',
      parameters: { create: [{ parameterId: durationParam.id }, { parameterId: tempParam.id }] }
    }
  });
  const shapeTemplate = await prisma.stepTemplate.upsert({ where: { name: 'Shape' }, update: {}, create: { name: 'Shape', stepTypeId: shapeProofType.id, order: 4, description: 'Shape the dough into its final form.' } });
  const proofTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Final Proof' }, update: {}, create: {
      name: 'Final Proof', stepTypeId: shapeProofType.id, order: 5, description: 'The final rise before baking.',
      parameters: { create: [{ parameterId: durationParam.id }, { parameterId: tempParam.id }] }
    }
  });
  const bakeTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Bake' }, update: {}, create: {
      name: 'Bake', stepTypeId: bakeType.id, order: 6, description: 'Bake the loaf.',
      parameters: { create: [{ parameterId: durationParam.id }, { parameterId: tempParam.id }] }
    }
  });

  // Advanced Templates
  const autolyseTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Autolyse' }, update: {}, create: {
      name: 'Autolyse', stepTypeId: prepType.id, order: 7, advanced: true, description: 'Resting flour and water before adding salt and starter.',
      parameters: { create: [{ parameterId: durationParam.id }] },
      ingredientRules: { create: [{ ingredientCategoryId: flourCategory.id, required: true }, { ingredientCategoryId: liquidCategory.id, required: true }] }
    }
  });
  const stretchFoldTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Stretch & Fold' }, update: {}, create: {
      name: 'Stretch & Fold', stepTypeId: bulkType.id, order: 8, advanced: true, description: 'A gentle method of developing gluten.',
      parameters: { create: [{ parameterId: numFoldsParam.id }] }
    }
  });
  const laminationTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Lamination' }, update: {}, create: {
      name: 'Lamination', stepTypeId: bulkType.id, order: 9, advanced: true, description: 'Stretch the dough thin to incorporate additions.',
      ingredientRules: { create: [{ ingredientCategoryId: inclusionsCategory.id }] }
    }
  });
  const enrichTemplate = await prisma.stepTemplate.upsert({
    where: { name: 'Add Enrichments' }, update: {}, create: {
      name: 'Add Enrichments', stepTypeId: mixType.id, order: 10, advanced: true, description: 'Incorporate fats, sugars, or dairy.',
      ingredientRules: { create: [{ ingredientCategoryId: enrichmentsCategory.id }] }
    }
  });
  const restTemplate = await prisma.stepTemplate.upsert({ // Added Rest Template
    where: { name: 'Rest' }, update: {}, create: {
      name: 'Rest', stepTypeId: bakeType.id, order: 11, description: 'Resting the loaf after baking to allow the crumb to set.',
      parameters: { create: [{ parameterId: durationParam.id }] }
    }
  });

  // --- 3. SEED RECIPE TEMPLATES ---
  console.log("Seeding Recipe Templates...");

  // 1. Base Template
  const baseRecipe = await prisma.recipe.create({
    data: {
      name: 'Base Template',
      notes: 'The simplest starting point for any recipe.',
      ownerId: systemUser.id, isPredefined: true, totalWeight: 1000, hydrationPct: 70, saltPct: 2,
      steps: { create: [{ stepTemplateId: prefermentTemplate.id, order: 1 }, { stepTemplateId: mixTemplate.id, order: 2 }] }
    }
  });
  console.log(`Created: ${baseRecipe.id} - Base Template`);

  // --- Basic Recipes ---
  const firstLoaf = await prisma.recipe.create({
    data: {
      name: "My First Sourdough Loaf",
      notes: "A simple, reliable recipe for beginners based on the 1-2-3 method.",
      ownerId: systemUser.id, isPredefined: true, totalWeight: 909, hydrationPct: 67, saltPct: 2,
      steps: {
        create: [
          { stepTemplateId: prefermentTemplate.id, order: 1, ingredients: { create: [{ ingredientId: starter.id, amount: 15, calculationMode: IngredientCalculationMode.PERCENTAGE }] } },
          { stepTemplateId: mixTemplate.id, order: 2, ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }, { ingredientId: water.id, amount: 67, calculationMode: IngredientCalculationMode.PERCENTAGE }, { ingredientId: salt.id, amount: 2, calculationMode: IngredientCalculationMode.PERCENTAGE }] } },
          { stepTemplateId: bulkFermentTemplate.id, order: 3, parameterValues: { create: [{ parameterId: durationParam.id, value: 240 }, { parameterId: tempParam.id, value: 24 }] } },
          { stepTemplateId: shapeTemplate.id, order: 4 },
          { stepTemplateId: proofTemplate.id, order: 5, parameterValues: { create: [{ parameterId: durationParam.id, value: 720 }, { parameterId: tempParam.id, value: 4 }] } },
          { stepTemplateId: bakeTemplate.id, order: 6, parameterValues: { create: [{ parameterId: durationParam.id, value: 45 }, { parameterId: tempParam.id, value: 230 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${firstLoaf.id} - My First Sourdough Loaf`);

  const basicWholeWheat = await prisma.recipe.create({
    data: {
      name: "Simple Whole Wheat",
      notes: "A slightly heartier loaf with the nutty flavor of whole wheat.",
      ownerId: systemUser.id, isPredefined: true, totalWeight: 1020, hydrationPct: 72, saltPct: 2,
      steps: {
        create: [
          { stepTemplateId: prefermentTemplate.id, order: 1, ingredients: { create: [{ ingredientId: starter.id, amount: 20, calculationMode: IngredientCalculationMode.PERCENTAGE }] } },
          {
            stepTemplateId: mixTemplate.id, order: 2, ingredients: {
              create: [{ ingredientId: breadFlour.id, amount: 70, calculationMode: IngredientCalculationMode.PERCENTAGE }, { ingredientId: wholeWheatFlour.id, amount: 30, calculationMode: IngredientCalculationMode.PERCENTAGE }, { ingredientId: water.id, amount: 72, calculationMode: IngredientCalculationMode.PERCENTAGE }, { ingredientId: salt.id, amount: 2, calculationMode: IngredientCalculationMode.PERCENTAGE }]
            }
          },
          { stepTemplateId: bulkFermentTemplate.id, order: 3, parameterValues: { create: [{ parameterId: durationParam.id, value: 240 }, { parameterId: tempParam.id, value: 24 }] } },
          { stepTemplateId: shapeTemplate.id, order: 4 },
          { stepTemplateId: proofTemplate.id, order: 5, parameterValues: { create: [{ parameterId: durationParam.id, value: 720 }, { parameterId: tempParam.id, value: 4 }] } },
          { stepTemplateId: bakeTemplate.id, order: 6, parameterValues: { create: [{ parameterId: durationParam.id, value: 45 }, { parameterId: tempParam.id, value: 230 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${basicWholeWheat.id} - Simple Whole Wheat`);

  const sameDay = await prisma.recipe.create({
    data: {
      name: "Same-Day Sourdough",
      notes: "For when you want fresh bread tonight. A higher percentage of levain speeds up the process.",
      ownerId: systemUser.id, isPredefined: true, totalWeight: 1060, hydrationPct: 70, saltPct: 2,
      steps: {
        create: [
          { stepTemplateId: prefermentTemplate.id, order: 1, ingredients: { create: [{ ingredientId: starter.id, amount: 40, calculationMode: IngredientCalculationMode.PERCENTAGE }] } },
          { stepTemplateId: mixTemplate.id, order: 2, ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }, { ingredientId: water.id, amount: 70, calculationMode: IngredientCalculationMode.PERCENTAGE }, { ingredientId: salt.id, amount: 2, calculationMode: IngredientCalculationMode.PERCENTAGE }] } },
          { stepTemplateId: bulkFermentTemplate.id, order: 3, parameterValues: { create: [{ parameterId: durationParam.id, value: 180 }, { parameterId: tempParam.id, value: 26 }] } },
          { stepTemplateId: shapeTemplate.id, order: 4 },
          { stepTemplateId: proofTemplate.id, order: 5, parameterValues: { create: [{ parameterId: durationParam.id, value: 120 }, { parameterId: tempParam.id, value: 26 }] } },
          { stepTemplateId: bakeTemplate.id, order: 6, parameterValues: { create: [{ parameterId: durationParam.id, value: 40 }, { parameterId: tempParam.id, value: 240 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${sameDay.id} - Same-Day Sourdough`);

  // --- Advanced Recipes ---
  const highHydration = await prisma.recipe.create({
    data: {
      name: "High Hydration Challenge",
      notes: "Mastering wet dough for an open, airy crumb. Requires gentle handling.",
      ownerId: systemUser.id, isPredefined: true, totalWeight: 1035, hydrationPct: 85, saltPct: 2.2,
      steps: {
        create: [
          { stepTemplateId: prefermentTemplate.id, order: 1, ingredients: { create: [{ ingredientId: starter.id, amount: 20, calculationMode: IngredientCalculationMode.PERCENTAGE }] } },
          {
            stepTemplateId: autolyseTemplate.id, order: 2, /* advanced: true, */ parameterValues: { create: [{ parameterId: durationParam.id, value: 60 }] }, // Removed advanced from RecipeStep
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }, { ingredientId: water.id, amount: 85, calculationMode: IngredientCalculationMode.PERCENTAGE }] }
          },
          { stepTemplateId: mixTemplate.id, order: 3, ingredients: { create: [{ ingredientId: salt.id, amount: 2.2, calculationMode: IngredientCalculationMode.PERCENTAGE }] } },
          { stepTemplateId: stretchFoldTemplate.id, order: 4, /* advanced: true, */ parameterValues: { create: [{ parameterId: numFoldsParam.id, value: 4 }] } }, // Removed advanced from RecipeStep
          { stepTemplateId: bulkFermentTemplate.id, order: 5, parameterValues: { create: [{ parameterId: durationParam.id, value: 180 }, { parameterId: tempParam.id, value: 26 }] } },
          { stepTemplateId: shapeTemplate.id, order: 6 },
          { stepTemplateId: proofTemplate.id, order: 7, parameterValues: { create: [{ parameterId: durationParam.id, value: 720 }, { parameterId: tempParam.id, value: 4 }] } },
          { stepTemplateId: bakeTemplate.id, order: 8, parameterValues: { create: [{ parameterId: durationParam.id, value: 45 }, { parameterId: tempParam.id, value: 250 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${highHydration.id} - High Hydration Challenge`);

  const panettone = await prisma.recipe.create({
    data: {
      name: "Sourdough Panettone",
      notes: "A decadent, highly enriched dough. A true test of a baker's skill.",
      ownerId: systemUser.id, isPredefined: true, totalWeight: 1200, hydrationPct: 60, saltPct: 1.5,
      steps: {
        create: [
          { stepTemplateId: prefermentTemplate.id, order: 1, notes: 'Primo Impasto: Let this first dough ferment for 10-12 hours.', ingredients: { create: [{ ingredientId: starter.id, amount: 20, calculationMode: IngredientCalculationMode.PERCENTAGE }] } },
          {
            stepTemplateId: enrichTemplate.id, order: 2, /* advanced: true, */ notes: 'Secondo Impasto: Add final ingredients.', // Removed advanced from RecipeStep
            ingredients: { create: [
              { ingredientId: breadFlour.id, amount: 80, calculationMode: IngredientCalculationMode.PERCENTAGE },
              { ingredientId: water.id, amount: 40, calculationMode: IngredientCalculationMode.PERCENTAGE },
              { ingredientId: salt.id, amount: 1.5, calculationMode: IngredientCalculationMode.PERCENTAGE },
              { ingredientId: honey.id, amount: 75, calculationMode: IngredientCalculationMode.FIXED_WEIGHT }, // Example: 75g
              { ingredientId: butter.id, amount: 150, calculationMode: IngredientCalculationMode.FIXED_WEIGHT }, // Example: 150g
              { ingredientId: egg.id, amount: 100, calculationMode: IngredientCalculationMode.FIXED_WEIGHT } // Example: 100g (approx 2 large eggs)
            ] }
          },
          { stepTemplateId: laminationTemplate.id, order: 3, /* advanced: true, */ notes: 'Fold in candied fruits and nuts.' }, // Removed advanced from RecipeStep
          { stepTemplateId: proofTemplate.id, order: 4, parameterValues: { create: [{ parameterId: durationParam.id, value: 480 }, { parameterId: tempParam.id, value: 28 }] } },
          { stepTemplateId: bakeTemplate.id, order: 5, notes: 'Hang upside down to cool after baking.', parameterValues: { create: [{ parameterId: durationParam.id, value: 50 }, { parameterId: tempParam.id, value: 175 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${panettone.id} - Sourdough Panettone`);

  const danishRye = await prisma.recipe.create({
    data: {
      name: "Danish Rye (Rugbrød)",
      notes: "A dense, hearty, and wholesome loaf, central to Danish cuisine. No kneading required.",
      ownerId: systemUser.id, isPredefined: true, totalWeight: 1115, hydrationPct: 87.5, saltPct: 3.75,
      steps: {
        create: [
          { stepTemplateId: prefermentTemplate.id, order: 1, ingredients: { create: [{ ingredientId: starter.id, amount: 50, calculationMode: IngredientCalculationMode.PERCENTAGE }] } },
          {
            stepTemplateId: mixTemplate.id, order: 2, notes: 'Mix into a thick, sticky paste.',
            ingredients: { create: [{ ingredientId: ryeFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }, { ingredientId: water.id, amount: 87.5, calculationMode: IngredientCalculationMode.PERCENTAGE }, { ingredientId: salt.id, amount: 3.75, calculationMode: IngredientCalculationMode.PERCENTAGE }] }
          },
          { stepTemplateId: proofTemplate.id, order: 3, notes: 'Proof in a loaf pan.', parameterValues: { create: [{ parameterId: durationParam.id, value: 240 }, { parameterId: tempParam.id, value: 24 }] } },
          { stepTemplateId: bakeTemplate.id, order: 4, parameterValues: { create: [{ parameterId: durationParam.id, value: 60 }, { parameterId: tempParam.id, value: 190 }] } },
          { stepTemplateId: restTemplate.id, order: 5, notes: 'MUST rest for at least 24 hours before slicing.', parameterValues: { create: [{ parameterId: durationParam.id, value: 1440 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${danishRye.id} - Danish Rye (Rugbrød)`);

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