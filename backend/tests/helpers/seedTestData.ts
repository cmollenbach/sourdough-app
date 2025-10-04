// Test helper to seed only the essential data needed for tests
import prisma from '../../src/lib/prisma';
import { UserRole, ParameterDataType } from '@prisma/client';

export async function seedEssentialData() {
  // Check if already seeded
  const existingStepTypes = await prisma.stepType.count();
  if (existingStepTypes > 0) {
    console.log('Essential data already seeded, skipping...');
    return;
  }

  console.log('Seeding essential test data...');

  // Create only the essential step types (needed for recipe/step tests)
  const stepTypes = await prisma.stepType.createMany({
    data: [
      { name: 'Preferments', description: 'Preferment steps' },
      { name: 'Preparation', description: 'Preparation steps' },
      { name: 'Mixing', description: 'Mixing steps' },
      { name: 'Bulk Fermentation', description: 'Bulk fermentation steps' },
      { name: 'Shaping & Proofing', description: 'Shaping and proofing steps' },
      { name: 'Baking', description: 'Baking steps' },
    ],
  });

  // Create essential parameters
  await prisma.stepParameter.createMany({
    data: [
      { name: 'Duration (minutes)', type: ParameterDataType.NUMBER, defaultValue: '60' },
      { name: 'Temperature (°C)', type: ParameterDataType.NUMBER, defaultValue: '24' },
    ],
  });

  // Create essential ingredient categories
  await prisma.ingredientCategory.createMany({
    data: [
      { name: 'Flour', description: 'Flour category' },
      { name: 'Liquid', description: 'Liquid category' },
      { name: 'Salt', description: 'Salt category' },
      { name: 'Preferment', description: 'Preferment category' },
    ],
  });

  // Create a few essential ingredients
  const flourCat = await prisma.ingredientCategory.findFirst({ where: { name: 'Flour' } });
  const liquidCat = await prisma.ingredientCategory.findFirst({ where: { name: 'Liquid' } });
  
  if (flourCat && liquidCat) {
    await prisma.ingredient.createMany({
      data: [
        { name: 'Bread Flour', ingredientCategoryId: flourCat.id },
        { name: 'Water', ingredientCategoryId: liquidCat.id },
      ],
    });
  }

  console.log('Essential test data seeded successfully');
}

export async function cleanupTestData() {
  // Clean up in reverse order of dependencies
  await prisma.recipeStepParameterValue.deleteMany({});
  await prisma.recipeStepIngredient.deleteMany({});
  await prisma.bakeStepParameterValue.deleteMany({});
  await prisma.bakeStepIngredient.deleteMany({});
  await prisma.bakeStep.deleteMany({});
  await prisma.recipeStep.deleteMany({});
  await prisma.bake.deleteMany({});
  await prisma.recipe.deleteMany({});
  await prisma.stepTemplateParameter.deleteMany({});
  await prisma.stepTemplateIngredientRule.deleteMany({});
  await prisma.stepTemplate.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.ingredient.deleteMany({});
  
  // Don't delete step types, parameters, or categories - they're reusable
}
