// tests/routes/bakes-crud.test.ts
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import express from 'express';
import cors from 'cors';
import { PrismaClient, IngredientCalculationMode, StepExecutionStatus } from '@prisma/client';
import authRoutes from '../../src/routes/auth';
import recipesRouter from '../../src/routes/recipes';
import bakesRoutes from '../../src/routes/bakes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { seedTestMetadata, getTestTemplateIds, getIngredientIdByName } from '../utils/seedTestData';

/**
 * COMPREHENSIVE BAKE CRUD TESTS
 * 
 * Tests all CRUD operations for bakes with focus on snapshot pattern:
 * - CREATE: From recipe (snapshot verification), validation, auth
 * - READ: GET all, GET active only, GET by ID, ownership
 * - UPDATE: Notes, rating, complete, cancel, ownership
 * - Step Management: Start step, complete step, actual values
 * - SNAPSHOT: Verify recipe data is properly snapshotted
 * 
 * Target Coverage: 85%+ for bakes.ts (currently 10.2%)
 */

describe('Bake CRUD Operations', () => {
  let app: express.Application;
  let prisma: PrismaClient;
  let authToken: string;
  let testUserId: number;
  let authToken2: string;
  let testUserId2: number;
  let testRecipeId: number;
  let templateIds: Awaited<ReturnType<typeof getTestTemplateIds>>;
  let ingredientIds: { flour: number; water: number; salt: number };

  beforeAll(async () => {
    // Create Express app
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api", recipesRouter);
    app.use('/api/bakes', bakesRoutes);
    app.use(errorHandler);

    prisma = new PrismaClient();
    await seedTestMetadata();
    
    // Get template and ingredient IDs for tests
    templateIds = await getTestTemplateIds();
    ingredientIds = {
      flour: await getIngredientIdByName('Test Bread Flour'),
      water: await getIngredientIdByName('Test Water'),
      salt: await getIngredientIdByName('Test Salt'),
    };
  });

  beforeEach(async () => {
    // Clean up test data - proper order for foreign keys
    const testUsers = await prisma.user.findMany({
      where: { email: { startsWith: 'test-bake-' } },
      select: { id: true }
    });
    const testUserIds = testUsers.map(u => u.id);
    
    const testRecipes = await prisma.recipe.findMany({
      where: { ownerId: { in: testUserIds } },
      select: { id: true }
    });
    const testRecipeIds = testRecipes.map(r => r.id);
    
    const testSteps = await prisma.recipeStep.findMany({
      where: { recipeId: { in: testRecipeIds } },
      select: { id: true }
    });
    const testStepIds = testSteps.map(s => s.id);
    
    const testBakes = await prisma.bake.findMany({
      where: { ownerId: { in: testUserIds } },
      select: { id: true }
    });
    const testBakeIds = testBakes.map(b => b.id);
    
    const testBakeSteps = await prisma.bakeStep.findMany({
      where: { bakeId: { in: testBakeIds } },
      select: { id: true }
    });
    const testBakeStepIds = testBakeSteps.map(s => s.id);
    
    // Delete in reverse dependency order
    await prisma.bakeStepParameterValue.deleteMany({
      where: { bakeStepId: { in: testBakeStepIds } }
    });
    await prisma.bakeStepIngredient.deleteMany({
      where: { bakeStepId: { in: testBakeStepIds } }
    });
    await prisma.bakeStep.deleteMany({
      where: { bakeId: { in: testBakeIds } }
    });
    await prisma.bake.deleteMany({
      where: { ownerId: { in: testUserIds } }
    });
    
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
    
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-bake-' } } });

    // Create test users
    const user1Email = `test-bake-user1-${Date.now()}@example.com`;
    const user1Password = 'password123';
    
    await request(app)
      .post('/api/auth/register')
      .send({ email: user1Email, password: user1Password });
    
    const loginResponse1 = await request(app)
      .post('/api/auth/login')
      .send({ email: user1Email, password: user1Password });
    
    authToken = loginResponse1.body.token;
    testUserId = loginResponse1.body.user.id;

    const user2Email = `test-bake-user2-${Date.now()}@example.com`;
    const user2Password = 'password456';
    
    await request(app)
      .post('/api/auth/register')
      .send({ email: user2Email, password: user2Password });
    
    const loginResponse2 = await request(app)
      .post('/api/auth/login')
      .send({ email: user2Email, password: user2Password });
    
    authToken2 = loginResponse2.body.token;
    testUserId2 = loginResponse2.body.user.id;

    // Create a test recipe with steps and ingredients
    const recipeResponse = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Sourdough',
        totalWeight: 1000,
        hydrationPct: 75,
        saltPct: 2,
        steps: [
          {
            stepTemplateId: templateIds.autolyse,
            order: 1,
            notes: 'Mix flour and water',
            ingredients: [
              {
                ingredientId: ingredientIds.flour,
                amount: 100,
                calculationMode: IngredientCalculationMode.PERCENTAGE
              },
              {
                ingredientId: ingredientIds.water,
                amount: 75,
                calculationMode: IngredientCalculationMode.PERCENTAGE
              }
            ]
          },
          {
            stepTemplateId: templateIds.mix,
            order: 2,
            notes: 'Add salt and starter',
            ingredients: [
              {
                ingredientId: ingredientIds.salt,
                amount: 2,
                calculationMode: IngredientCalculationMode.PERCENTAGE
              }
            ]
          }
        ]
      });

    testRecipeId = recipeResponse.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ========================================
  // CREATE TESTS
  // ========================================

  describe('POST /api/bakes - Create Bake from Recipe', () => {
    it('should create a bake from a recipe and snapshot all data', async () => {
      const response = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId: testRecipeId,
          notes: 'My first bake'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.ownerId).toBe(testUserId);
      expect(response.body.recipeId).toBe(testRecipeId);
      expect(response.body.notes).toBe('My first bake');
      expect(response.body.active).toBe(true);
      expect(response.body.startTimestamp).toBeDefined();
      
      // Verify recipe snapshots
      expect(response.body.recipeTotalWeightSnapshot).toBe(1000);
      expect(response.body.recipeHydrationPctSnapshot).toBe(75);
      expect(response.body.recipeSaltPctSnapshot).toBe(2);
      
      // Verify steps were created
      expect(response.body.steps).toHaveLength(2);
      expect(response.body.steps[0].order).toBe(1);
      expect(response.body.steps[0].status).toBe(StepExecutionStatus.PENDING);
      expect(response.body.steps[1].order).toBe(2);
    });

    it('should create a bake with default notes if not provided', async () => {
      const response = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      expect(response.status).toBe(201);
      expect(response.body.notes).toBe('Bake of Test Sourdough');
    });

    it('should snapshot ingredients from recipe steps', async () => {
      const response = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      expect(response.status).toBe(201);
      expect(response.body.steps[0].ingredients).toHaveLength(2);
      expect(response.body.steps[0].ingredients[0].plannedPercentage).toBe(100);
      expect(response.body.steps[0].ingredients[1].plannedPercentage).toBe(75);
      expect(response.body.steps[1].ingredients).toHaveLength(1);
      expect(response.body.steps[1].ingredients[0].plannedPercentage).toBe(2);
    });

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: 999999 });

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/recipe not found/i);
    });

    it('should return 400 if recipeId is missing', async () => {
      const response = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/recipe id.*required/i);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/bakes')
        .send({ recipeId: testRecipeId });

      expect(response.status).toBe(401);
    });

    it('should create multiple bakes from the same recipe', async () => {
      const bake1 = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: 'Bake 1' });

      const bake2 = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: 'Bake 2' });

      expect(bake1.status).toBe(201);
      expect(bake2.status).toBe(201);
      expect(bake1.body.id).not.toBe(bake2.body.id);
      expect(bake1.body.recipeId).toBe(bake2.body.recipeId);
    });
  });

  // ========================================
  // READ TESTS
  // ========================================

  describe('GET /api/bakes - Get All Bakes', () => {
    it('should return all bakes for the authenticated user', async () => {
      // Create some bakes
      await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: 'Bake 1' });

      await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: 'Bake 2' });

      const response = await request(app)
        .get('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0]).toHaveProperty('stepCount');
    });

    it('should not return bakes from other users', async () => {
      // User 1 creates a bake
      await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      // User 2 gets bakes
      const response = await request(app)
        .get('/api/bakes')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/bakes');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/bakes/active - Get Active Bakes', () => {
    it('should return only active bakes', async () => {
      // Create an active bake
      const activeBake = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: 'Active' });

      // Create and complete a bake
      const completedBake = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: 'Completed' });

      await request(app)
        .put(`/api/bakes/${completedBake.body.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      // Get active bakes
      const response = await request(app)
        .get('/api/bakes/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(activeBake.body.id);
      expect(response.body[0].active).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/bakes/active');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/bakes/:bakeId - Get Single Bake', () => {
    it('should return full bake details with steps and ingredients', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(bakeId);
      expect(response.body.steps).toHaveLength(2);
      expect(response.body.steps[0].ingredients).toBeDefined();
    });

    it('should return 404 for non-existent bake', async () => {
      const response = await request(app)
        .get('/api/bakes/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 for another user\'s bake', async () => {
      // User 1 creates bake
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      // User 2 tries to access it
      const response = await request(app)
        .get(`/api/bakes/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/bakes/1');

      expect(response.status).toBe(401);
    });
  });

  // ========================================
  // UPDATE TESTS - Notes & Rating
  // ========================================

  describe('PUT /api/bakes/:bakeId/notes - Update Bake Notes', () => {
    it('should update bake notes', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: 'Original notes' });

      const bakeId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/bakes/${bakeId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Updated notes' });

      expect(response.status).toBe(200);
      expect(response.body.notes).toBe('Updated notes');
    });

    it('should allow clearing notes (null)', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: 'Original notes' });

      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: null });

      expect(response.status).toBe(200);
      expect(response.body.notes).toBeNull();
    });

    it('should return 404 for non-existent bake', async () => {
      const response = await request(app)
        .put('/api/bakes/999999/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Test' });

      expect(response.status).toBe(404);
    });

    it('should return 404 when updating another user\'s bake', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/notes`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ notes: 'Hacked notes' });

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/bakes/1/notes')
        .send({ notes: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/bakes/:bakeId/rating - Update Bake Rating', () => {
    it('should update bake rating', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 5 });

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(5);
    });

    it('should accept ratings 1-5', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;

      for (let rating = 1; rating <= 5; rating++) {
        const response = await request(app)
          .put(`/api/bakes/${bakeId}/rating`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ rating });

        expect(response.status).toBe(200);
        expect(response.body.rating).toBe(rating);
      }
    });

    it('should return 404 for non-existent bake', async () => {
      const response = await request(app)
        .put('/api/bakes/999999/rating')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 5 });

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/bakes/1/rating')
        .send({ rating: 5 });

      expect(response.status).toBe(401);
    });
  });

  // ========================================
  // UPDATE TESTS - Complete & Cancel
  // ========================================

  describe('PUT /api/bakes/:bakeId/complete - Complete Bake', () => {
    it('should mark bake as complete', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.active).toBe(false);
      expect(response.body.finishTimestamp).toBeDefined();
    });

    it('should return 400 if bake is already inactive', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      // Complete it once
      await request(app)
        .put(`/api/bakes/${createResponse.body.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to complete again
      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/already inactive/i);
    });

    it('should return 404 for non-existent bake', async () => {
      const response = await request(app)
        .put('/api/bakes/999999/complete')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/bakes/1/complete');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/bakes/:bakeId/cancel - Cancel Bake', () => {
    it('should cancel an active bake', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.active).toBe(false);
      expect(response.body.finishTimestamp).toBeDefined();
    });

    it('should allow canceling already inactive bake', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      await request(app)
        .put(`/api/bakes/${createResponse.body.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent bake', async () => {
      const response = await request(app)
        .put('/api/bakes/999999/cancel')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/bakes/1/cancel');

      expect(response.status).toBe(401);
    });
  });

  // ========================================
  // STEP MANAGEMENT TESTS
  // ========================================

  describe('PUT /api/bakes/:bakeId/steps/:stepId/start - Start Step', () => {
    it('should start a pending step', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(StepExecutionStatus.IN_PROGRESS);
      expect(response.body.startTimestamp).toBeDefined();
    });

    it('should return 400 when starting step in inactive bake', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      // Complete the bake
      await request(app)
        .put(`/api/bakes/${bakeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to start step
      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/inactive bake/i);
    });

    it('should return 404 for non-existent bake', async () => {
      const response = await request(app)
        .put('/api/bakes/999999/steps/1/start')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/bakes/1/steps/1/start');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/bakes/:bakeId/steps/:stepId/complete - Complete Step', () => {
    it('should complete a step and record notes/deviations', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Step completed successfully',
          deviations: 'Used slightly more water'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(StepExecutionStatus.COMPLETED);
      expect(response.body.finishTimestamp).toBeDefined();
      expect(response.body.notes).toBe('Step completed successfully');
      expect(response.body.deviations).toBe('Used slightly more water');
    });

    it('should return 400 when completing step in inactive bake', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      // Complete the bake
      await request(app)
        .put(`/api/bakes/${bakeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to complete step
      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/inactive bake/i);
    });

    it('should return 404 for non-existent step', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/steps/999999/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/bakes/1/steps/1/complete')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  // ========================================
  // EDGE CASES AND DATA INTEGRITY
  // ========================================

  describe('Data Integrity and Edge Cases', () => {
    it('should preserve snapshot data even if recipe changes', async () => {
      // Create bake from recipe
      const bakeResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const originalHydration = bakeResponse.body.recipeHydrationPctSnapshot;

      // Update the recipe
      await request(app)
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ hydrationPct: 80 });

      // Get the bake again
      const getResponse = await request(app)
        .get(`/api/bakes/${bakeResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Snapshot should still have original value
      expect(getResponse.body.recipeHydrationPctSnapshot).toBe(originalHydration);
      expect(getResponse.body.recipeHydrationPctSnapshot).toBe(75);
    });

    it('should handle large notes (4KB+)', async () => {
      const largeNotes = 'x'.repeat(8000);

      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: largeNotes });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.notes.length).toBe(8000);
    });

    it('should handle concurrent bake creation from same recipe', async () => {
      const promises = Array.from({ length: 3 }, (_, i) =>
        request(app)
          .post('/api/bakes')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ recipeId: testRecipeId, notes: `Concurrent bake ${i}` })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      const allBakes = await request(app)
        .get('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(allBakes.body.length).toBeGreaterThanOrEqual(3);
    });

    it('should maintain step order from recipe', async () => {
      const response = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      expect(response.body.steps[0].order).toBe(1);
      expect(response.body.steps[1].order).toBe(2);
      expect(response.body.steps[0].order).toBeLessThan(response.body.steps[1].order);
    });
  });

  // ========================================
  // ADDITIONAL COVERAGE TESTS
  // ========================================

  describe('Step Skip Functionality', () => {
    it('should skip a step and set status to SKIPPED', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/skip`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(StepExecutionStatus.SKIPPED);
      expect(response.body.finishTimestamp).toBeDefined();
    });

    it('should return 400 when skipping step in inactive bake', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      // Complete the bake
      await request(app)
        .put(`/api/bakes/${bakeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to skip step
      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/skip`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/inactive bake/i);
    });

    it('should return 404 for skipping step in non-existent bake', async () => {
      const response = await request(app)
        .put('/api/bakes/999999/steps/1/skip')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/bakes/1/steps/1/skip');

      expect(response.status).toBe(401);
    });
  });

  describe('Step Note Updates', () => {
    it('should update step notes individually', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/note`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Dough felt very elastic' });

      expect(response.status).toBe(200);
      expect(response.body.notes).toBe('Dough felt very elastic');
    });

    it('should return 400 if notes field is missing', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/note`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/notes.*required/i);
    });

    it('should return 400 when updating notes in inactive bake', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      await request(app)
        .put(`/api/bakes/${bakeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/note`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Late note' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/inactive bake/i);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/bakes/1/steps/1/note')
        .send({ notes: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('Step Deviations Updates', () => {
    it('should update step deviations', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/deviations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deviations: 'Used 10g more water' });

      expect(response.status).toBe(200);
      expect(response.body.deviations).toBe('Used 10g more water');
    });

    it('should allow null deviations', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/deviations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deviations: null });

      expect(response.status).toBe(200);
    });

    it('should return 400 if deviations field is missing', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/deviations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/deviations.*required/i);
    });

    it('should return 400 when updating deviations in inactive bake', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      await request(app)
        .put(`/api/bakes/${bakeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/deviations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deviations: 'Late deviation' });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/bakes/1/steps/1/deviations')
        .send({ deviations: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('Validation Edge Cases', () => {
    it('should reject invalid rating values (< 1)', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 0 });

      // Note: Validation should be in validation middleware, but if not, database will reject
      expect([400, 500]).toContain(response.status);
    });

    it('should reject invalid rating values (> 5)', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 6 });

      expect([400, 500]).toContain(response.status);
    });

    it('should handle non-numeric bake ID', async () => {
      const response = await request(app)
        .get('/api/bakes/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 404]).toContain(response.status);
    });

    it('should handle non-numeric step ID', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/steps/invalid-id/start`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should handle empty notes string (uses default)', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: '' });

      expect(createResponse.status).toBe(201);
      // Empty notes triggers default: "Bake of {recipeName}"
      expect(createResponse.body.notes).toBe('Bake of Test Sourdough');
    });

    it('should handle very long notes (10KB+)', async () => {
      const longNotes = 'x'.repeat(12000);

      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: longNotes });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.notes.length).toBe(12000);
    });
  });

  describe('Error Path Coverage', () => {
    it('should handle step not belonging to bake', async () => {
      // Create two bakes
      const bake1 = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bake2 = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      // Try to start bake2's step using bake1's ID
      const response = await request(app)
        .put(`/api/bakes/${bake1.body.id}/steps/${bake2.body.steps[0].id}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should fail (Prisma error or 404)
      expect([404, 500]).toContain(response.status);
    });

    it('should handle database errors gracefully on create', async () => {
      // Try to create bake with negative recipe ID (invalid)
      const response = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: -1 });

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should return 404 for completing non-existent step', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const response = await request(app)
        .put(`/api/bakes/${createResponse.body.id}/steps/999999/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Test' });

      expect(response.status).toBe(404);
    });

    it('should return 404 for updating notes on non-existent bake', async () => {
      const response = await request(app)
        .put('/api/bakes/999999/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('Complete User Workflows', () => {
    it('should support complete bake workflow: create → start step → complete step → finish bake', async () => {
      // 1. Create bake
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId, notes: 'Weekend bake' });

      expect(createResponse.status).toBe(201);
      const bakeId = createResponse.body.id;
      const step1Id = createResponse.body.steps[0].id;
      const step2Id = createResponse.body.steps[1].id;

      // 2. Start first step
      const startStep1 = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${step1Id}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(startStep1.status).toBe(200);
      expect(startStep1.body.status).toBe(StepExecutionStatus.IN_PROGRESS);

      // 3. Complete first step
      const completeStep1 = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${step1Id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Smooth dough', deviations: 'Added 5g more water' });

      expect(completeStep1.status).toBe(200);
      expect(completeStep1.body.status).toBe(StepExecutionStatus.COMPLETED);

      // 4. Start second step
      const startStep2 = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${step2Id}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(startStep2.status).toBe(200);

      // 5. Complete second step
      const completeStep2 = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${step2Id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Well incorporated' });

      expect(completeStep2.status).toBe(200);

      // 6. Add rating
      const addRating = await request(app)
        .put(`/api/bakes/${bakeId}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 5 });

      expect(addRating.status).toBe(200);

      // 7. Mark bake complete
      const completeBake = await request(app)
        .put(`/api/bakes/${bakeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(completeBake.status).toBe(200);
      expect(completeBake.body.active).toBe(false);

      // 8. Verify bake no longer in active list
      const activeBakes = await request(app)
        .get('/api/bakes/active')
        .set('Authorization', `Bearer ${authToken}`);

      const isInActive = activeBakes.body.some((b: any) => b.id === bakeId);
      expect(isInActive).toBe(false);

      // 9. Verify bake is in all bakes list
      const allBakes = await request(app)
        .get('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`);

      const isInAll = allBakes.body.some((b: any) => b.id === bakeId);
      expect(isInAll).toBe(true);
    });

    it('should support partial workflow: create → skip some steps → complete', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const step1Id = createResponse.body.steps[0].id;
      const step2Id = createResponse.body.steps[1].id;

      // Start and complete first step
      await request(app)
        .put(`/api/bakes/${bakeId}/steps/${step1Id}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      await request(app)
        .put(`/api/bakes/${bakeId}/steps/${step1Id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Skip second step
      const skipResponse = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${step2Id}/skip`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(skipResponse.status).toBe(200);
      expect(skipResponse.body.status).toBe(StepExecutionStatus.SKIPPED);

      // Complete bake
      const completeResponse = await request(app)
        .put(`/api/bakes/${bakeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(completeResponse.status).toBe(200);
    });

    it('should support cancelled workflow: create → start → cancel', async () => {
      const createResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: testRecipeId });

      const bakeId = createResponse.body.id;
      const stepId = createResponse.body.steps[0].id;

      // Start first step
      await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      // Cancel bake
      const cancelResponse = await request(app)
        .put(`/api/bakes/${bakeId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.active).toBe(false);

      // Verify cannot start new steps
      const tryStart = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${createResponse.body.steps[1].id}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(tryStart.status).toBe(400);
    });
  });
});
