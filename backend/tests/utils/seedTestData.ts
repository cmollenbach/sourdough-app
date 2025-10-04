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
    { id: 1, name: 'Test Preparation', description: 'Preparation steps' },
    { id: 2, name: 'Test Mixing', description: 'Mixing and combining ingredients' },
    { id: 3, name: 'Test Fermentation', description: 'Fermentation and proofing' },
    { id: 4, name: 'Test Shaping', description: 'Shaping the dough' },
    { id: 5, name: 'Test Baking', description: 'Baking the bread' },
  ];

  for (const stepType of stepTypes) {
    // Use upsert with unique name constraint
    await prisma.stepType.upsert({
      where: { name: stepType.name }, // Upsert by name (unique field)
      update: stepType,
      create: stepType,
    });
  }

  return stepTypes;
}

/**
 * Seed step templates used in tests
 * Creates common step templates that tests can reference by ID
 */
export async function seedStepTemplates() {
  // Ensure step types exist first
  await seedStepTypes();

  const templates: Array<{
    id: number;
    name: string;
    stepTypeId: number;
    role: StepRole;
    description: string;
    order: number;
    advanced: boolean;
  }> = [
    {
      id: 122,
      name: 'Test Autolyse',
      stepTypeId: 1,
      role: StepRole.AUTOLYSE,
      description: 'Mix flour and water, rest before adding salt and starter',
      order: 1,
      advanced: false,
    },
    {
      id: 123,
      name: 'Test Mix',
      stepTypeId: 2,
      role: StepRole.MIX,
      description: 'Combine all ingredients',
      order: 2,
      advanced: false,
    },
    {
      id: 124,
      name: 'Test Bulk Fermentation',
      stepTypeId: 3,
      role: StepRole.BULK,
      description: 'Let dough rise and develop',
      order: 3,
      advanced: false,
    },
    {
      id: 125,
      name: 'Test Stretch & Fold',
      stepTypeId: 2,
      role: StepRole.MIX,
      description: 'Build dough strength through folding',
      order: 4,
      advanced: false,
    },
    {
      id: 126,
      name: 'Test Shape',
      stepTypeId: 4,
      role: StepRole.SHAPE,
      description: 'Form the final loaf shape',
      order: 5,
      advanced: false,
    },
    {
      id: 127,
      name: 'Test Proof',
      stepTypeId: 3,
      role: StepRole.PROOF,
      description: 'Final rise before baking',
      order: 6,
      advanced: false,
    },
  ];

  //  Use upsert to avoid conflicts if templates already exist
  for (const template of templates) {
    await prisma.stepTemplate.upsert({
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
  }

  return templates;
}

/**
 * Seed ingredient categories (required for ingredients)
 */
export async function seedIngredientCategories() {
  const categories = [
    { id: 1, name: 'Test Flour', description: 'Flour products' },
    { id: 2, name: 'Test Liquid', description: 'Liquids and hydration' },
    { id: 3, name: 'Test Seasoning', description: 'Salt, sugar, spices' },
    { id: 4, name: 'Test Leavening', description: 'Yeast, sourdough starter' },
  ];

  for (const category of categories) {
    // Use upsert with unique name constraint
    await prisma.ingredientCategory.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
  }

  return categories;
}

/**
 * Seed ingredients used in tests
 * Creates common ingredients that tests can reference by ID
 */
export async function seedIngredients() {
  // Ensure categories exist first
  await seedIngredientCategories();

  const ingredients = [
    {
      id: 1,
      name: 'Test Bread Flour',
      ingredientCategoryId: 1,
      description: 'High protein flour for bread baking',
    },
    {
      id: 2,
      name: 'Test Water',
      ingredientCategoryId: 2,
      description: 'Filtered or tap water',
    },
    {
      id: 3,
      name: 'Test Salt',
      ingredientCategoryId: 3,
      description: 'Fine sea salt or kosher salt',
    },
    {
      id: 4,
      name: 'Test Sourdough Starter',
      ingredientCategoryId: 4,
      description: 'Active, fed sourdough starter',
    },
    {
      id: 5,
      name: 'Test Whole Wheat Flour',
      ingredientCategoryId: 1,
      description: 'Stone-ground whole wheat flour',
    },
  ];

  // Use upsert to avoid conflicts if ingredients already exist
  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: ingredient.name }, // Upsert by name (unique field)
      update: {
        ingredientCategoryId: ingredient.ingredientCategoryId,
        description: ingredient.description,
      },
      create: ingredient,
    });
  }

  return ingredients;
}

/**
 * Seed parameters used in tests
 * Creates common parameters for testing parameter value functionality
 */
export async function seedParameters() {
  const parameters = [
    {
      id: 1,
      name: 'Test Temperature',
      type: 'NUMBER' as const,
      description: 'Target dough temperature',
      defaultValue: '78',
      advanced: false,
    },
    {
      id: 2,
      name: 'Test Duration',
      type: 'NUMBER' as const,
      description: 'Time duration for step',
      defaultValue: '30',
      advanced: false,
    },
    {
      id: 3,
      name: 'Test Humidity',
      type: 'NUMBER' as const,
      description: 'Ambient humidity level',
      defaultValue: '70',
      advanced: true,
    },
  ];

  // Use upsert to avoid conflicts if parameters already exist
  for (const parameter of parameters) {
    await prisma.stepParameter.upsert({
      where: { name: parameter.name }, // Upsert by name (unique field)
      update: {
        type: parameter.type,
        description: parameter.description,
        defaultValue: parameter.defaultValue,
        advanced: parameter.advanced,
      },
      create: parameter,
    });
  }

  return parameters;
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
    email: `test-${Date.now()}@example.com`,
    passwordHash: '$2a$10$test.hash.for.testing.purposes.only',
    displayName: 'Test User',
  };

  const user = await prisma.user.create({
    data: {
      ...defaultUser,
      ...overrides,
    },
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
