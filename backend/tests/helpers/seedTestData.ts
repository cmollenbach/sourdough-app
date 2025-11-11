// Test helper to seed only the essential data needed for tests
import prisma from '../../src/lib/prisma';
import { UserRole, ParameterDataType, StepRole } from '@prisma/client';

export async function seedEssentialData() {
  // Check if already seeded (step types and templates)
  const existingStepTypes = await prisma.stepType.count();
  const existingTemplates = await prisma.stepTemplate.count();
  
  if (existingStepTypes > 0 && existingTemplates > 0) {
    console.log('Essential data already seeded, skipping...');
    return;
  }

  console.log('Seeding essential test data...');

  // Create only the essential step types (needed for recipe/step tests)
  await prisma.stepType.createMany({
    data: [
      { name: 'Preferments', description: 'Preferment steps' },
      { name: 'Preparation', description: 'Preparation steps' },
      { name: 'Mixing', description: 'Mixing steps' },
      { name: 'Bulk Fermentation', description: 'Bulk fermentation steps' },
      { name: 'Shaping & Proofing', description: 'Shaping and proofing steps' },
      { name: 'Baking', description: 'Baking steps' },
    ],
    skipDuplicates: true,
  });

  // Create essential parameters
  await prisma.stepParameter.createMany({
    data: [
      { name: 'Duration (minutes)', type: ParameterDataType.NUMBER, defaultValue: '60' },
      { name: 'Temperature (°C)', type: ParameterDataType.NUMBER, defaultValue: '24' },
    ],
    skipDuplicates: true,
  });

  // Create essential ingredient categories
  await prisma.ingredientCategory.createMany({
    data: [
      { name: 'Flour', description: 'Flour category' },
      { name: 'Liquid', description: 'Liquid category' },
      { name: 'Salt', description: 'Salt category' },
      { name: 'Preferment', description: 'Preferment category' },
    ],
    skipDuplicates: true,
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
      skipDuplicates: true,
    });
  }

  // Create essential step templates (needed for meta route tests)
  // Always try to create templates (skipDuplicates handles existing ones)
  const stepTypes = await prisma.stepType.findMany();
  if (stepTypes.length > 0) {
    const preparationType = stepTypes.find(st => st.name === 'Preparation');
    const mixingType = stepTypes.find(st => st.name === 'Mixing');
    const bulkType = stepTypes.find(st => st.name === 'Bulk Fermentation');
    
    if (preparationType && mixingType && bulkType) {
      // Use individual creates with upsert pattern to ensure they exist
      const templateData = [
        {
          name: 'Autolyse',
          stepTypeId: preparationType.id,
          role: StepRole.AUTOLYSE,
          description: 'Mix flour and water, rest before adding salt and starter',
          order: 1,
          advanced: false,
          active: true,
        },
        {
          name: 'Mix',
          stepTypeId: mixingType.id,
          role: StepRole.MIX,
          description: 'Combine all ingredients',
          order: 2,
          advanced: false,
          active: true,
        },
        {
          name: 'Bulk Fermentation',
          stepTypeId: bulkType.id,
          role: StepRole.BULK,
          description: 'Let dough rise and develop',
          order: 3,
          advanced: false,
          active: true,
        },
      ];

      for (const template of templateData) {
        await prisma.stepTemplate.upsert({
          where: { name: template.name },
          update: {},
          create: template,
        });
      }
    }
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
  
  // DON'T delete ingredients, step types, parameters, or categories
  // These are essential reference data that tests expect to exist
  // They have stable IDs (1, 2, etc.) that tests rely on
}
