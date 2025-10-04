// tests/routes/recipes-crud.test.ts
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import express from 'express';
import cors from 'cors';
import { PrismaClient, IngredientCalculationMode } from '@prisma/client';
import authRoutes from '../../src/routes/auth';
import recipesRouter from '../../src/routes/recipes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { seedTestMetadata } from '../utils/seedTestData';

/**
 * COMPREHENSIVE RECIPE CRUD TESTS
 * 
 * Tests all CRUD operations for recipes with thorough coverage:
 * - CREATE: Simple, with steps, with ingredients, validation, auth
 * - READ: GET all, GET by ID, GET full, predefined templates
 * - UPDATE: Fields, steps, ingredients, ownership, validation
 * - DELETE: Soft delete, ownership, authorization
 * - CLONE: Template cloning
 * 
 * Target Coverage: 80%+ for recipe routes
 */

describe('Recipe CRUD Operations', () => {
  let app: express.Application;
  let prisma: PrismaClient;
  let authToken: string;
  let testUserId: number;
  let authToken2: string;
  let testUserId2: number;

  beforeAll(async () => {
    // Create Express app
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api", recipesRouter);
    app.use(errorHandler);

    prisma = new PrismaClient();
    await seedTestMetadata();
  });

  beforeEach(async () => {
    // Clean up test data - order matters for foreign keys!
    // First, find test users
    const testUsers = await prisma.user.findMany({
      where: { email: { startsWith: 'test-crud-' } },
      select: { id: true }
    });
    const testUserIds = testUsers.map(u => u.id);
    
    // Find all recipes owned by test users
    const testRecipes = await prisma.recipe.findMany({
      where: { ownerId: { in: testUserIds } },
      select: { id: true }
    });
    const testRecipeIds = testRecipes.map(r => r.id);
    
    // Find all steps in test recipes
    const testSteps = await prisma.recipeStep.findMany({
      where: { recipeId: { in: testRecipeIds } },
      select: { id: true }
    });
    const testStepIds = testSteps.map(s => s.id);
    
    // Delete in reverse dependency order
    await prisma.bakeStepParameterValue.deleteMany({});
    await prisma.bakeStepIngredient.deleteMany({});
    await prisma.bakeStep.deleteMany({});
    await prisma.bake.deleteMany({ where: { ownerId: { in: testUserIds } } });
    
    await prisma.recipeStepIngredient.deleteMany({
      where: { recipeStepId: { in: testStepIds } }
    });
    await prisma.recipeStepParameterValue.deleteMany({
      where: { recipeStepId: { in: testStepIds } }
    });
    await prisma.recipeStep.deleteMany({
      where: { recipeId: { in: testRecipeIds } }
    });
    await prisma.recipe.deleteMany({
      where: { ownerId: { in: testUserIds } }
    });
    
    // Now safe to delete users
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-crud-' } } });

    // Create two test users for ownership testing via auth routes
    // User 1
    const user1Email = `test-crud-user1-${Date.now()}@example.com`;
    const user1Password = 'password123';
    
    await request(app)
      .post('/api/auth/register')
      .send({ email: user1Email, password: user1Password });
    
    const loginResponse1 = await request(app)
      .post('/api/auth/login')
      .send({ email: user1Email, password: user1Password });
    
    authToken = loginResponse1.body.token;
    testUserId = loginResponse1.body.user.id;

    // User 2
    const user2Email = `test-crud-user2-${Date.now()}@example.com`;
    const user2Password = 'password456';
    
    await request(app)
      .post('/api/auth/register')
      .send({ email: user2Email, password: user2Password });
    
    const loginResponse2 = await request(app)
      .post('/api/auth/login')
      .send({ email: user2Email, password: user2Password });
    
    authToken2 = loginResponse2.body.token;
    testUserId2 = loginResponse2.body.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ========================================
  // CREATE TESTS
  // ========================================

  describe('POST /api/recipes - Create Recipe', () => {
    it('should create a simple recipe with minimal fields', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Simple Sourdough',
          notes: 'My first bread'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Simple Sourdough');
      expect(response.body.notes).toBe('My first bread');
      expect(response.body.ownerId).toBe(testUserId);
      expect(response.body.isPredefined).toBe(false);
      expect(response.body.active).toBe(true);
    });

    it('should create a recipe with target percentages', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Hydration Test',
          totalWeight: 1000,
          hydrationPct: 75,
          saltPct: 2
        });

      expect(response.status).toBe(201);
      expect(response.body.totalWeight).toBe(1000);
      expect(response.body.hydrationPct).toBe(75);
      expect(response.body.saltPct).toBe(2);
    });

    it('should create a recipe with steps', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recipe with Steps',
          steps: [
            {
              stepTemplateId: 122, // Autolyse template
              order: 1,
              notes: 'Mix flour and water'
            },
            {
              stepTemplateId: 123, // Mix template
              order: 2,
              notes: 'Add salt and starter'
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.steps).toHaveLength(2);
      expect(response.body.steps[0].stepTemplateId).toBe(122);
      expect(response.body.steps[0].order).toBe(1);
      expect(response.body.steps[1].stepTemplateId).toBe(123);
      expect(response.body.steps[1].order).toBe(2);
    });

    it('should create a recipe with steps and ingredients', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Full Recipe',
          totalWeight: 1000,
          hydrationPct: 70,
          steps: [
            {
              stepTemplateId: 122,
              order: 1,
              ingredients: [
                {
                  ingredientId: 1, // Flour
                  amount: 100,
                  calculationMode: 'PERCENTAGE' as IngredientCalculationMode
                },
                {
                  ingredientId: 2, // Water
                  amount: 70,
                  calculationMode: 'PERCENTAGE' as IngredientCalculationMode
                }
              ]
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.steps).toHaveLength(1);
      expect(response.body.steps[0].ingredients).toHaveLength(2);
      expect(response.body.steps[0].ingredients[0].ingredientId).toBe(1);
      expect(response.body.steps[0].ingredients[0].amount).toBe(100);
      expect(response.body.steps[0].ingredients[1].ingredientId).toBe(2);
      expect(response.body.steps[0].ingredients[1].amount).toBe(70);
    });

    // TODO: Re-enable when step parameters are seeded
    it.skip('should create a recipe with step parameter values', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recipe with Parameters',
          steps: [
            {
              stepTemplateId: 124, // Bulk fermentation
              order: 1,
              parameterValues: [
                {
                  parameterId: 1, // Duration parameter
                  value: '4 hours'
                }
              ]
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.steps[0].parameterValues).toHaveLength(1);
      expect(response.body.steps[0].parameterValues[0].parameterId).toBe(1);
      expect(response.body.steps[0].parameterValues[0].value).toBe('4 hours');
    });

    it('should reject recipe creation without authentication', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({ name: 'Unauthorized Recipe' });

      expect(response.status).toBe(401);
    });

    it('should handle validation errors for invalid data', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Empty name should fail validation
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle special characters in recipe name and notes', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recipe with émojis 🍞✨',
          notes: 'Special chars: <>&"\'こんにちは'
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Recipe with émojis 🍞✨');
      expect(response.body.notes).toBe('Special chars: <>&"\'こんにちは');
    });

    it('should reject steps that are not an array', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Steps',
          steps: 'not an array'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should create multiple recipes for the same user', async () => {
      const recipe1 = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Recipe 1' });

      const recipe2 = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Recipe 2' });

      expect(recipe1.status).toBe(201);
      expect(recipe2.status).toBe(201);
      expect(recipe1.body.id).not.toBe(recipe2.body.id);
      expect(recipe1.body.ownerId).toBe(recipe2.body.ownerId);
    });
  });

  // ========================================
  // READ TESTS - GET ALL RECIPES
  // ========================================

  describe('GET /api/recipes - Get All Recipes', () => {
    it('should return all recipes for the authenticated user', async () => {
      // Create recipes
      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Recipe 1' });

      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Recipe 2' });

      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      const userRecipes = response.body.filter((r: any) => !r.isPredefined);
      expect(userRecipes.length).toBe(2);
    });

    it('should not return recipes from other users', async () => {
      // User 1 creates a recipe
      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'User 1 Recipe' });

      // User 2 gets recipes
      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      const user2Recipes = response.body.filter((r: any) => !r.isPredefined);
      expect(user2Recipes.length).toBe(0);
    });

    it('should return predefined templates along with user recipes', async () => {
      // Create a predefined template
      await prisma.recipe.create({
        data: {
          name: 'Test Template',
          isPredefined: true,
          ownerId: testUserId,
          active: true
        }
      });

      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const templates = response.body.filter((r: any) => r.isPredefined);
      expect(templates.length).toBeGreaterThanOrEqual(1);
    });

    it('should not return soft-deleted recipes', async () => {
      // Create and delete a recipe
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Be Deleted' });

      const recipeId = createResponse.body.id;

      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const deletedRecipe = response.body.find((r: any) => r.id === recipeId);
      expect(deletedRecipe).toBeUndefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/recipes');

      expect(response.status).toBe(401);
    });

    it('should return correct recipe stub structure', async () => {
      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Recipe',
          totalWeight: 1000,
          hydrationPct: 75,
          saltPct: 2,
          notes: 'Test notes'
        });

      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const userRecipe = response.body.find((r: any) => r.name === 'Test Recipe');
      
      expect(userRecipe).toHaveProperty('id');
      expect(userRecipe).toHaveProperty('name');
      expect(userRecipe).toHaveProperty('totalWeight');
      expect(userRecipe).toHaveProperty('hydrationPct');
      expect(userRecipe).toHaveProperty('saltPct');
      expect(userRecipe).toHaveProperty('isPredefined');
      expect(userRecipe).toHaveProperty('createdAt');
    });
  });

  // ========================================
  // READ TESTS - GET SINGLE RECIPE (FULL)
  // ========================================

  describe('GET /api/recipes/:id/full - Get Full Recipe', () => {
    it('should return full recipe details with all steps and ingredients', async () => {
      // Create recipe with steps and ingredients
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Full Recipe',
          totalWeight: 1000,
          steps: [
            {
              stepTemplateId: 122,
              order: 1,
              ingredients: [
                {
                  ingredientId: 1,
                  amount: 100,
                  calculationMode: 'PERCENTAGE' as IngredientCalculationMode
                }
              ]
            }
          ]
        });

      const recipeId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/recipes/${recipeId}/full`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(recipeId);
      expect(response.body.name).toBe('Full Recipe');
      expect(response.body.totalWeight).toBe(1000);
      expect(response.body.steps).toHaveLength(1);
      expect(response.body.steps[0].ingredients).toHaveLength(1);
    });

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .get('/api/recipes/999999/full')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for another user\'s recipe', async () => {
      // User 1 creates recipe
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'User 1 Recipe' });

      const recipeId = createResponse.body.id;

      // User 2 tries to access it
      const response = await request(app)
        .get(`/api/recipes/${recipeId}/full`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(404);
    });

    it('should allow access to predefined templates', async () => {
      // Create predefined template
      const template = await prisma.recipe.create({
        data: {
          name: 'Public Template',
          isPredefined: true,
          ownerId: testUserId,
          active: true
        }
      });

      // User 2 should be able to access it
      const response = await request(app)
        .get(`/api/recipes/${template.id}/full`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(template.id);
      expect(response.body.isPredefined).toBe(true);
    });

    it('should return 400 for invalid recipe ID', async () => {
      const response = await request(app)
        .get('/api/recipes/invalid-id/full')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should not return soft-deleted recipes', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Delete' });

      const recipeId = createResponse.body.id;

      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get(`/api/recipes/${recipeId}/full`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return steps in correct order', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Ordered Recipe',
          steps: [
            { stepTemplateId: 124, order: 3 },
            { stepTemplateId: 122, order: 1 },
            { stepTemplateId: 123, order: 2 }
          ]
        });

      const response = await request(app)
        .get(`/api/recipes/${createResponse.body.id}/full`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.steps[0].order).toBe(1);
      expect(response.body.steps[1].order).toBe(2);
      expect(response.body.steps[2].order).toBe(3);
    });
  });

  // ========================================
  // READ TESTS - GET PREDEFINED BY NAME
  // ========================================

  describe('GET /api/recipes/predefined/by-name - Get Template by Name', () => {
    it('should return predefined template by name', async () => {
      await prisma.recipe.create({
        data: {
          name: 'Classic Sourdough Template',
          isPredefined: true,
          ownerId: testUserId,
          active: true
        }
      });

      const response = await request(app)
        .get('/api/recipes/predefined/by-name')
        .query({ name: 'Classic Sourdough Template' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Classic Sourdough Template');
      expect(response.body.isPredefined).toBe(true);
    });

    it('should return 404 for non-existent template name', async () => {
      const response = await request(app)
        .get('/api/recipes/predefined/by-name')
        .query({ name: 'Non-Existent Template' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 when name parameter is missing', async () => {
      const response = await request(app)
        .get('/api/recipes/predefined/by-name')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/name.*required/i);
    });

    it('should not return non-predefined recipes', async () => {
      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'User Recipe' });

      const response = await request(app)
        .get('/api/recipes/predefined/by-name')
        .query({ name: 'User Recipe' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ========================================
  // UPDATE TESTS
  // ========================================

  describe('PUT /api/recipes/:id - Update Recipe', () => {
    it('should update recipe basic fields', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Name',
          notes: 'Original notes',
          totalWeight: 1000
        });

      const recipeId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          notes: 'Updated notes',
          totalWeight: 1200,
          hydrationPct: 80,
          saltPct: 2.5
        });

      expect(response.status).toBe(200);
      expect(response.body.recipe.name).toBe('Updated Name');
      expect(response.body.recipe.notes).toBe('Updated notes');
      expect(response.body.recipe.totalWeight).toBe(1200);
      expect(response.body.recipe.hydrationPct).toBe(80);
      expect(response.body.recipe.saltPct).toBe(2.5);
    });

    it('should update recipe steps', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recipe with Steps',
          steps: [
            { stepTemplateId: 122, order: 1 }
          ]
        });

      const recipeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          steps: [
            {
              id: stepId,
              stepTemplateId: 122,
              order: 1,
              notes: 'Updated step notes'
            },
            {
              stepTemplateId: 123,
              order: 2,
              notes: 'New step'
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.recipe.steps).toHaveLength(2);
      expect(response.body.recipe.steps[0].notes).toBe('Updated step notes');
      expect(response.body.recipe.steps[1].notes).toBe('New step');
    });

    it('should delete steps not in update payload', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recipe',
          steps: [
            { stepTemplateId: 122, order: 1 },
            { stepTemplateId: 123, order: 2 }
          ]
        });

      const recipeId = createResponse.body.id;
      const firstStepId = createResponse.body.steps[0].id;

      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          steps: [
            {
              id: firstStepId,
              stepTemplateId: 122,
              order: 1
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.recipe.steps).toHaveLength(1);
      expect(response.body.recipe.steps[0].id).toBe(firstStepId);
    });

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .put('/api/recipes/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should return 404 when trying to update another user\'s recipe', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'User 1 Recipe' });

      const recipeId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ name: 'Hacked Name' });

      expect(response.status).toBe(404);
    });

    it('should return 403 when trying to update predefined template', async () => {
      const template = await prisma.recipe.create({
        data: {
          name: 'Template',
          isPredefined: true,
          ownerId: testUserId,
          active: true
        }
      });

      const response = await request(app)
        .put(`/api/recipes/${template.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Template' });

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/predefined/i);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/recipes/1')
        .send({ name: 'Updated' });

      expect(response.status).toBe(401);
    });

    it('should handle validation errors', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Original' });

      const response = await request(app)
        .put(`/api/recipes/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' }); // Empty name

      expect(response.status).toBe(400);
    });

    it('should update recipe ingredients', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recipe',
          steps: [
            {
              stepTemplateId: 122,
              order: 1,
              ingredients: [
                {
                  ingredientId: 1,
                  amount: 100,
                  calculationMode: 'PERCENTAGE' as IngredientCalculationMode
                }
              ]
            }
          ]
        });

      const recipeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;
      const ingredientId = createResponse.body.steps[0].ingredients[0].id;

      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          steps: [
            {
              id: stepId,
              stepTemplateId: 122,
              order: 1,
              ingredients: [
                {
                  id: ingredientId,
                  ingredientId: 1,
                  amount: 150, // Updated amount
                  calculationMode: 'PERCENTAGE' as IngredientCalculationMode
                },
                {
                  // New ingredient
                  ingredientId: 2,
                  amount: 75,
                  calculationMode: 'PERCENTAGE' as IngredientCalculationMode
                }
              ]
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.recipe.steps[0].ingredients).toHaveLength(2);
      expect(response.body.recipe.steps[0].ingredients[0].amount).toBe(150);
    });
  });

  // ========================================
  // DELETE TESTS
  // ========================================

  describe('DELETE /api/recipes/:id - Soft Delete Recipe', () => {
    it('should soft delete a recipe', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Delete' });

      const recipeId = createResponse.body.id;

      const deleteResponse = await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toMatch(/deleted/i);

      // Verify it's not returned in list
      const listResponse = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`);

      const deletedRecipe = listResponse.body.find((r: any) => r.id === recipeId);
      expect(deletedRecipe).toBeUndefined();

      // Verify it still exists in DB but is inactive
      const dbRecipe = await prisma.recipe.findUnique({
        where: { id: recipeId }
      });
      expect(dbRecipe).toBeDefined();
      expect(dbRecipe!.active).toBe(false);
    });

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .delete('/api/recipes/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 when trying to delete another user\'s recipe', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'User 1 Recipe' });

      const recipeId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid recipe ID', async () => {
      const response = await request(app)
        .delete('/api/recipes/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/recipes/1');

      expect(response.status).toBe(401);
    });

    it('should return 404 when trying to delete already deleted recipe', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Delete Twice' });

      const recipeId = createResponse.body.id;

      // First delete
      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Second delete attempt
      const response = await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ========================================
  // CLONE TESTS
  // ========================================

  describe('POST /api/recipes/:id/clone - Clone Template', () => {
    it('should clone a predefined template', async () => {
      const template = await prisma.recipe.create({
        data: {
          name: 'Template to Clone',
          isPredefined: true,
          ownerId: testUserId,
          active: true,
          totalWeight: 1000,
          hydrationPct: 75,
          notes: 'Template notes',
          steps: {
            create: [
              {
                stepTemplateId: 122,
                order: 1,
                notes: 'Step notes'
              }
            ]
          }
        }
      });

      const response = await request(app)
        .post(`/api/recipes/${template.id}/clone`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Template to Clone (Clone)');
      expect(response.body.isPredefined).toBe(false);
      expect(response.body.ownerId).toBe(testUserId);
      expect(response.body.totalWeight).toBe(1000);
      expect(response.body.hydrationPct).toBe(75);
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .post('/api/recipes/999999/clone')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 when trying to clone non-predefined recipe', async () => {
      const userRecipe = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'User Recipe' });

      const response = await request(app)
        .post(`/api/recipes/${userRecipe.body.id}/clone`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid template ID', async () => {
      const response = await request(app)
        .post('/api/recipes/invalid/clone')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/recipes/1/clone');

      expect(response.status).toBe(401);
    });

    it('should clone template with all steps and ingredients', async () => {
      const template = await prisma.recipe.create({
        data: {
          name: 'Complex Template',
          isPredefined: true,
          ownerId: testUserId,
          active: true,
          steps: {
            create: [
              {
                stepTemplateId: 122,
                order: 1,
                notes: 'Template step notes',
                ingredients: {
                  create: [
                    {
                      ingredientId: 1,
                      amount: 100,
                      calculationMode: IngredientCalculationMode.PERCENTAGE
                    }
                  ]
                }
              }
            ]
          }
        },
        include: {
          steps: {
            include: {
              ingredients: true,
              parameterValues: true
            }
          }
        }
      });

      const response = await request(app)
        .post(`/api/recipes/${template.id}/clone`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
      expect(response.body.id).not.toBe(template.id);
      
      // Verify the clone has its own data (not shared with template)
      const clonedRecipe = await prisma.recipe.findUnique({
        where: { id: response.body.id },
        include: {
          steps: {
            include: {
              ingredients: true,
              parameterValues: true
            }
          }
        }
      });

      expect(clonedRecipe).toBeDefined();
      expect(clonedRecipe!.steps).toHaveLength(1);
      expect(clonedRecipe!.steps[0].id).not.toBe(template.steps[0].id);
    });
  });

  // ========================================
  // EDGE CASES AND ERROR SCENARIOS
  // ========================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent recipe creation', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/recipes')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: `Concurrent Recipe ${i}` })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all recipes were created
      const listResponse = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`);

      const userRecipes = listResponse.body.filter((r: any) => !r.isPredefined);
      expect(userRecipes.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle large recipe notes', async () => {
      const largeNotes = 'x'.repeat(4000); // 4KB of notes

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Large Notes Recipe',
          notes: largeNotes
        });

      expect(response.status).toBe(201);
      expect(response.body.notes.length).toBe(4000);
    });

    it('should handle recipe with many steps', async () => {
      const steps = Array.from({ length: 20 }, (_, i) => ({
        stepTemplateId: 122 + (i % 3), // Rotate through template IDs
        order: i + 1,
        notes: `Step ${i + 1}`
      }));

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Many Steps Recipe',
          steps
        });

      expect(response.status).toBe(201);
      expect(response.body.steps).toHaveLength(20);
    });

    it('should handle boundary values for percentages', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Boundary Test',
          totalWeight: 0.1, // Very small
          hydrationPct: 0.5, // Very small (0 may be stored as null)
          saltPct: 10 // Maximum reasonable
        });

      expect(response.status).toBe(201);
      expect(response.body.hydrationPct).toBe(0.5);
    });

    it('should preserve data types through create and read cycle', async () => {
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Type Test',
          totalWeight: 1000.5,
          hydrationPct: 75.25,
          saltPct: 2.125
        });

      const readResponse = await request(app)
        .get(`/api/recipes/${createResponse.body.id}/full`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(typeof readResponse.body.totalWeight).toBe('number');
      expect(typeof readResponse.body.hydrationPct).toBe('number');
      expect(typeof readResponse.body.saltPct).toBe('number');
    });
  });
});
