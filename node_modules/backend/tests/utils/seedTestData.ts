/**
 * Database Seeding Utilities for Tests
 * 
 * Provides helper functions to seed the test database with metadata and test data.
 * Used to populate StepTemplates, Ingredients, and other reference data needed for tests.
 */

import prisma from '../../src/lib/prisma';
import { StepRole } from '@prisma/client';

/**
 * Seed step types (required for step templates)
 */
export async function seedStepTypes() {
  const stepTypes = [
    { name: 'Test Preparation', description: 'Preparation steps' },
    { name: 'Test Mixing', description: 'Mixing and combining ingredients' },
    { name: 'Test Fermentation', description: 'Fermentation and proofing' },
    { name: 'Test Shaping', description: 'Shaping the dough' },
    { name: 'Test Baking', description: 'Baking the bread' },
  ];

  const results = [];
  for (const stepType of stepTypes) {
    // Use upsert with unique name constraint
    const result = await prisma.stepType.upsert({
      where: { name: stepType.name }, // Upsert by name (unique field)
      update: { description: stepType.description },
      create: stepType,
    });
    results.push(result);
  }

  return results;
}

/**
 * Seed step templates used in tests
 * Creates common step templates that tests can reference by ID
 */
export async function seedStepTemplates() {
  // Ensure step types exist first and get their IDs
  const stepTypes = await seedStepTypes();
  
  // Find step type IDs by name
  const preparationId = stepTypes.find(st => st.name === 'Test Preparation')!.id;
  const mixingId = stepTypes.find(st => st.name === 'Test Mixing')!.id;
  const fermentationId = stepTypes.find(st => st.name === 'Test Fermentation')!.id;
  const shapingId = stepTypes.find(st => st.name === 'Test Shaping')!.id;

  const templates: Array<{
    name: string;
    stepTypeId: number;
    role: StepRole;
    description: string;
    order: number;
    advanced: boolean;
  }> = [
    {
      name: 'Test Autolyse',
      stepTypeId: preparationId,
      role: StepRole.AUTOLYSE,
      description: 'Mix flour and water, rest before adding salt and starter',
      order: 1,
      advanced: false,
    },
    {
      name: 'Test Mix',
      stepTypeId: mixingId,
      role: StepRole.MIX,
      description: 'Combine all ingredients',
      order: 2,
      advanced: false,
    },
    {
      name: 'Test Bulk Fermentation',
      stepTypeId: fermentationId,
      role: StepRole.BULK,
      description: 'Let dough rise and develop',
      order: 3,
      advanced: false,
    },
    {
      name: 'Test Stretch & Fold',
      stepTypeId: mixingId,
      role: StepRole.MIX,
      description: 'Build dough strength through folding',
      order: 4,
      advanced: false,
    },
    {
      name: 'Test Shape',
      stepTypeId: shapingId,
      role: StepRole.SHAPE,
      description: 'Form the final loaf shape',
      order: 5,
      advanced: false,
    },
    {
      name: 'Test Proof',
      stepTypeId: fermentationId,
      role: StepRole.PROOF,
      description: 'Final rise before baking',
      order: 6,
      advanced: false,
    },
  ];

  //  Use upsert to avoid conflicts if templates already exist
  const results = [];
  for (const template of templates) {
    const result = await prisma.stepTemplate.upsert({
      where: { name: template.name }, // Upsert by name (unique field)
      update: {
        stepTypeId: template.stepTypeId,
        role: template.role,
        description: template.description,
        order: template.order,
        advanced: template.advanced,
      },
      create: template,
    });
    results.push(result);
  }

  return results;
}

/**
 * Seed ingredient categories (required for ingredients)
 */
export async function seedIngredientCategories() {
  const categories = [
    { name: 'Test Flour', description: 'Flour products' },
    { name: 'Test Liquid', description: 'Liquids and hydration' },
    { name: 'Test Seasoning', description: 'Salt, sugar, spices' },
    { name: 'Test Leavening', description: 'Yeast, sourdough starter' },
  ];

  const results = [];
  for (const category of categories) {
    // Use upsert with unique name constraint
    const result = await prisma.ingredientCategory.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
    });
    results.push(result);
  }

  return results;
}

/**
 * Seed ingredients used in tests
 * Creates common ingredients that tests can reference by ID
 */
export async function seedIngredients() {
  // Ensure categories exist first and get their IDs
  const categories = await seedIngredientCategories();
  
  // Find category IDs by name
  const flourCat = categories.find(c => c.name === 'Test Flour');
  const liquidCat = categories.find(c => c.name === 'Test Liquid');
  const seasoningCat = categories.find(c => c.name === 'Test Seasoning');
  const leaveningCat = categories.find(c => c.name === 'Test Leavening');

  const ingredients = [
    {
      name: 'Test Bread Flour',
      ingredientCategoryId: flourCat!.id,
      description: 'High protein flour for bread baking',
    },
    {
      name: 'Test Water',
      ingredientCategoryId: liquidCat!.id,
      description: 'Filtered or tap water',
    },
    {
      name: 'Test Salt',
      ingredientCategoryId: seasoningCat!.id,
      description: 'Fine sea salt or kosher salt',
    },
    {
      name: 'Test Sourdough Starter',
      ingredientCategoryId: leaveningCat!.id,
      description: 'Active, fed sourdough starter',
    },
    {
      name: 'Test Whole Wheat Flour',
      ingredientCategoryId: flourCat!.id,
      description: 'Stone-ground whole wheat flour',
    },
  ];

  // Use upsert to avoid conflicts if ingredients already exist
  const results = [];
  for (const ingredient of ingredients) {
    const result = await prisma.ingredient.upsert({
      where: { name: ingredient.name }, // Upsert by name (unique field)
      update: {
        ingredientCategoryId: ingredient.ingredientCategoryId,
        description: ingredient.description,
      },
      create: ingredient,
    });
    results.push(result);
  }

  return results;
}

/**
 * Seed parameters used in tests
 * Creates common parameters for testing parameter value functionality
 */
export async function seedParameters() {
  const parameters = [
    {
      name: 'Test Temperature',
      type: 'NUMBER' as const,
      description: 'Target dough temperature',
      defaultValue: '78',
      advanced: false,
    },
    {
      name: 'Test Duration',
      type: 'NUMBER' as const,
      description: 'Time duration for step',
      defaultValue: '30',
      advanced: false,
    },
    {
      name: 'Test Humidity',
      type: 'NUMBER' as const,
      description: 'Ambient humidity level',
      defaultValue: '70',
      advanced: true,
    },
  ];

  // Use upsert to avoid conflicts if parameters already exist
  const results = [];
  for (const parameter of parameters) {
    const result = await prisma.stepParameter.upsert({
      where: { name: parameter.name }, // Upsert by name (unique field)
      update: {
        type: parameter.type,
        description: parameter.description,
        defaultValue: parameter.defaultValue,
        advanced: parameter.advanced,
      },
      create: parameter,
    });
    results.push(result);
  }

  return results;
}

/**
 * Get step template ID by name
 * Use this instead of hardcoded IDs in tests
 */
export async function getStepTemplateIdByName(name: string): Promise<number> {
  const template = await prisma.stepTemplate.findUnique({ where: { name } });
  if (!template) {
    throw new Error(`StepTemplate with name "${name}" not found. Did you run seedTestMetadata()?`);
  }
  return template.id;
}

/**
 * Get ingredient ID by name
 * Use this instead of hardcoded IDs in tests
 */
export async function getIngredientIdByName(name: string): Promise<number> {
  const ingredient = await prisma.ingredient.findUnique({ where: { name } });
  if (!ingredient) {
    throw new Error(`Ingredient with name "${name}" not found. Did you run seedTestMetadata()?`);
  }
  return ingredient.id;
}

/**
 * Get all test template IDs by name
 * Returns object with common template IDs for easy access
 */
export async function getTestTemplateIds() {
  const [autolyse, mix, bulk, stretchFold, shape, proof] = await Promise.all([
    getStepTemplateIdByName('Test Autolyse'),
    getStepTemplateIdByName('Test Mix'),
    getStepTemplateIdByName('Test Bulk Fermentation'),
    getStepTemplateIdByName('Test Stretch & Fold'),
    getStepTemplateIdByName('Test Shape'),
    getStepTemplateIdByName('Test Proof'),
  ]);

  return { autolyse, mix, bulk, stretchFold, shape, proof };
}

/**
 * Seed all test metadata (step templates + ingredients + parameters)
 * Call this in beforeAll() to prepare database for tests
 */
export async function seedTestMetadata() {
  const [templates, ingredients, parameters] = await Promise.all([
    seedStepTemplates(),
    seedIngredients(),
    seedParameters(),
  ]);

  return { templates, ingredients, parameters };
}

/**
 * Clean up test data
 * Removes all test-specific data while preserving metadata
 * Call this in afterEach() or afterAll()
 */
export async function cleanupTestData(preserveMetadata = true) {
  // Delete in correct order to respect foreign key constraints
  await prisma.bakeStepParameterValue.deleteMany({});
  await prisma.bakeStepIngredient.deleteMany({});
  await prisma.bakeStep.deleteMany({});
  await prisma.bake.deleteMany({});
  
  await prisma.recipeStepIngredient.deleteMany({});
  await prisma.recipeStepParameterValue.deleteMany({});
  await prisma.recipeStep.deleteMany({});
  await prisma.recipe.deleteMany({});
  
  await prisma.user.deleteMany({});

  // Optionally clean up metadata (for full teardown)
  if (!preserveMetadata) {
    await prisma.stepTemplate.deleteMany({});
    await prisma.ingredient.deleteMany({});
  }
}

/**
 * Create a test user
 * Returns the created user for use in tests
 */
export async function createTestUser(overrides: {
  email?: string;
  passwordHash?: string;
  displayName?: string;
} = {}) {
  const defaultUser = {
    email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
    passwordHash: '$2a$10$test.hash.for.testing.purposes.only',
    displayName: 'Test User',
  };

  const userData = {
    ...defaultUser,
    ...overrides,
  };

  // Use upsert to avoid duplicate key errors
  const user = await prisma.user.upsert({
    where: { email: userData.email },
    create: userData,
    update: {},
  });

  return user;
}

/**
 * Create a test recipe
 * Returns the created recipe with optional steps and ingredients
 */
export async function createTestRecipe(
  userId: number,
  overrides: {
    name?: string;
    totalWeight?: number;
    hydrationPct?: number;
    saltPct?: number;
    notes?: string;
    steps?: Array<{
      stepTemplateId: number;
      order: number;
      instructions?: string;
      ingredients?: Array<{
        ingredientId: number;
        amount: number;
        preparation?: string;
      }>;
    }>;
  } = {}
) {
  const defaultRecipe = {
    name: `Test Recipe ${Date.now()}`,
    ownerId: userId,
    totalWeight: 1000,
    hydrationPct: 75,
    saltPct: 2,
    notes: 'Test recipe notes',
  };

  const recipeData: any = {
    ...defaultRecipe,
    ...overrides,
    ownerId: userId, // Always use provided userId
  };

  // Handle steps if provided
  if (overrides.steps) {
    recipeData.steps = {
      create: overrides.steps.map(step => ({
        stepTemplateId: step.stepTemplateId,
        order: step.order,
        instructions: step.instructions || '',
        ingredients: step.ingredients
          ? {
              create: step.ingredients.map(ing => ({
                ingredientId: ing.ingredientId,
                amount: ing.amount,
                preparation: ing.preparation || '',
              })),
            }
          : undefined,
      })),
    };
  }

  const recipe = await prisma.recipe.create({
    data: recipeData,
    include: {
      steps: {
        include: {
          ingredients: true,
        },
      },
    },
  });

  return recipe;
}

/**
 * Create a test bake from a recipe
 * Returns the created bake with snapshot data
 * 
 * Note: For complex bakes with step snapshots, create manually using prisma.bake.create()
 */
export async function createTestBake(
  recipeId: number,
  userId: number,
  overrides: {
    notes?: string;
    rating?: number;
    active?: boolean;
  } = {}
) {
  // First get the recipe to snapshot its data
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    throw new Error(`Recipe ${recipeId} not found`);
  }

  const bake = await prisma.bake.create({
    data: {
      recipeId: recipe.id,
      ownerId: userId,
      active: overrides.active ?? true,
      notes: overrides.notes || '',
      rating: overrides.rating || null,
      // Snapshot recipe-level values
      recipeHydrationPctSnapshot: recipe.hydrationPct,
      recipeSaltPctSnapshot: recipe.saltPct,
      recipeTotalWeightSnapshot: recipe.totalWeight,
      startTimestamp: new Date(),
    },
  });

  return bake;
}

/**
 * Wait for async operations to complete
 * Useful for testing timing-dependent features
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique test email
 * Prevents conflicts in tests that create users
 */
export function generateTestEmail(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate random test data
 * Useful for testing with varied inputs
 */
export function generateRandomRecipeName(): string {
  const adjectives = ['Rustic', 'Artisan', 'Classic', 'Whole Wheat', 'Sourdough'];
  const nouns = ['Boule', 'Batard', 'Baguette', 'Loaf', 'Bread'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}
