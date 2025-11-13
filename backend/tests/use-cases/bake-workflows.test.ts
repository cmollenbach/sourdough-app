/**
 * Bake Tracking Workflow Tests
 * 
 * Tests complete bake tracking workflows from starting a bake
 * through completion. These tests verify the snapshot pattern
 * and step-by-step tracking functionality.
 * 
 * Workflows covered:
 * - Start bake from recipe (snapshot verification)
 * - Track bake steps (start, complete, skip)
 * - Record actual parameter values
 * - Update step notes
 * - Complete bake
 * - Cancel bake
 * - Rate completed bake
 * - View bake history
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import express from 'express';
import cors from 'cors';
import { PrismaClient, StepExecutionStatus } from '@prisma/client';
import authRoutes from '../../src/routes/auth';
import recipesRouter from '../../src/routes/recipes';
import bakesRoutes from '../../src/routes/bakes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { seedTestMetadata, getTestTemplateIds, getIngredientIdByName } from '../utils/seedTestData';
import prisma from '../../src/lib/prisma';

describe('Bake Tracking Workflows', () => {
  let app: express.Application;
  let authToken: string;
  let userId: number;
  let recipeId: number;
  let templateIds: Awaited<ReturnType<typeof getTestTemplateIds>>;
  let ingredientIds: { flour: number; water: number; salt: number };

  beforeAll(async () => {
    // Create Express app
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api', recipesRouter);
    app.use('/api/bakes', bakesRoutes);
    app.use(errorHandler);

    // Seed test metadata
    await seedTestMetadata();
    templateIds = await getTestTemplateIds();
    ingredientIds = {
      flour: await getIngredientIdByName('Test Bread Flour'),
      water: await getIngredientIdByName('Test Water'),
      salt: await getIngredientIdByName('Test Salt'),
    };
  });

  beforeEach(async () => {
    // Create test user
    const email = `workflow-bake-${Date.now()}@example.com`;
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'TestPassword123!' });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;

    // Create test recipe with steps
    const recipeResponse = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Bake Test Recipe ${Date.now()}`,
        steps: [
          {
            stepTemplateId: templateIds.autolyse,
            order: 1,
            ingredients: [
              {
                ingredientId: ingredientIds.flour,
                amount: 500,
                calculationMode: 'FIXED_WEIGHT',
              },
            ],
          },
          {
            stepTemplateId: templateIds.mix,
            order: 2,
            ingredients: [
              {
                ingredientId: ingredientIds.salt,
                amount: 10,
                calculationMode: 'FIXED_WEIGHT',
              },
            ],
          },
        ],
      });

    recipeId = recipeResponse.body.id;

    // Clean up any existing test bakes
    await prisma.bakeStepParameterValue.deleteMany({});
    await prisma.bakeStepIngredient.deleteMany({});
    await prisma.bakeStep.deleteMany({});
    await prisma.bake.deleteMany({ where: { ownerId: userId } });
  });

  describe('Complete Bake Lifecycle Workflow', () => {
    it('should allow user to start, track, and complete a bake', async () => {
      // Step 1: Start a bake from recipe
      const startBakeResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId,
          notes: 'Starting my first bake!',
        });

      expect(startBakeResponse.status).toBe(201);
      expect(startBakeResponse.body).toHaveProperty('id');
      const bakeId = startBakeResponse.body.id;

      // Step 2: Verify bake was created with snapshot
      const bakeDetails = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(bakeDetails.status).toBe(200);
      expect(bakeDetails.body.recipeId).toBe(recipeId);
      expect(bakeDetails.body.steps).toHaveLength(2); // Snapshot should have 2 steps
      expect(bakeDetails.body.steps[0].status).toBe('PENDING');

      // Step 3: Start first step
      const startStepResponse = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${bakeDetails.body.steps[0].id}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(startStepResponse.status).toBe(200);

      // Step 4: Verify step status changed
      const verifyStart = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(verifyStart.body.steps[0].status).toBe('IN_PROGRESS');

      // Step 5: Complete first step
      const completeStepResponse = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${bakeDetails.body.steps[0].id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Autolyse completed successfully',
        });

      expect(completeStepResponse.status).toBe(200);

      // Step 6: Start and complete second step
      const startStep2 = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${bakeDetails.body.steps[1].id}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(startStep2.status).toBe(200);

      const completeStep2 = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${bakeDetails.body.steps[1].id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Mixing done',
        });

      expect(completeStep2.status).toBe(200);

      // Step 7: Complete the bake
      const completeBakeResponse = await request(app)
        .put(`/api/bakes/${bakeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(completeBakeResponse.status).toBe(200);

      // Step 8: Set rating and notes via separate endpoints
      await request(app)
        .put(`/api/bakes/${bakeId}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 5 });

      await request(app)
        .put(`/api/bakes/${bakeId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Great bake!' });

      // Step 9: Verify bake is completed
      const finalBake = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalBake.body.finishTimestamp).toBeTruthy();
      expect(finalBake.body.rating).toBe(5);
      expect(finalBake.body.notes).toBe('Great bake!');
    });
  });

  describe('Bake Snapshot Pattern Workflow', () => {
    it('should snapshot recipe data when bake is created', async () => {
      // Get original recipe
      const originalRecipe = await request(app)
        .get(`/api/recipes/${recipeId}/full`)
        .set('Authorization', `Bearer ${authToken}`);

      const originalStepCount = originalRecipe.body.steps.length;
      const originalFirstStepIngredients = originalRecipe.body.steps[0].ingredients.length;

      // Start bake
      const bakeResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId });

      const bakeId = bakeResponse.body.id;

      // Modify original recipe
      await request(app)
        .put(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Modified Recipe Name',
        });

      // Add step to original recipe
      await request(app)
        .put(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          steps: [
            ...originalRecipe.body.steps,
            {
              stepTemplateId: templateIds.bulk,
              order: 3,
            },
          ],
        });

      // Verify bake still has original snapshot
      const bakeDetails = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(bakeDetails.body.steps).toHaveLength(originalStepCount);
      expect(bakeDetails.body.steps[0].ingredients).toHaveLength(originalFirstStepIngredients);
    });
  });

  describe('Bake Step Tracking Workflow', () => {
    it('should allow skipping steps', async () => {
      // Start bake
      const bakeResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId });

      const bakeId = bakeResponse.body.id;
      const bakeDetails = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const stepId = bakeDetails.body.steps[0].id;

      // Skip first step
      const skipResponse = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/skip`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(skipResponse.status).toBe(200);

      // Add notes via separate endpoint
      await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/note`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Skipping autolyse today' });

      // Verify step is skipped
      const verifySkip = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(verifySkip.body.steps[0].status).toBe('SKIPPED');
      expect(verifySkip.body.steps[0].notes).toBe('Skipping autolyse today');
    });

    it('should allow updating step notes', async () => {
      // Start bake and step
      const bakeResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId });

      const bakeId = bakeResponse.body.id;
      const bakeDetails = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const stepId = bakeDetails.body.steps[0].id;

      await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      // Update step notes
      const updateNotes = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/note`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Updated step notes with more details',
        });

      expect(updateNotes.status).toBe(200);

      // Verify notes updated
      const verifyNotes = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(verifyNotes.body.steps[0].notes).toBe('Updated step notes with more details');
    });
  });

  describe('Bake Cancellation Workflow', () => {
    it('should allow canceling an active bake', async () => {
      // Start bake
      const bakeResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId });

      const bakeId = bakeResponse.body.id;

      // Start a step
      const bakeDetails = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      await request(app)
        .put(`/api/bakes/${bakeId}/steps/${bakeDetails.body.steps[0].id}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      // Cancel bake
      const cancelResponse = await request(app)
        .put(`/api/bakes/${bakeId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(cancelResponse.status).toBe(200);

      // Add notes via separate endpoint
      await request(app)
        .put(`/api/bakes/${bakeId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Had to cancel due to emergency' });

      // Verify bake is canceled
      const canceledBake = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(canceledBake.body.finishTimestamp).toBeTruthy();
      expect(canceledBake.body.notes).toBe('Had to cancel due to emergency');
    });
  });

  describe('Bake History and Filtering Workflow', () => {
    it('should list active and completed bakes separately', async () => {
      // Create multiple bakes
      const bake1 = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId });

      const bake2 = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId });

      // Complete one bake
      await request(app)
        .put(`/api/bakes/${bake1.body.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      await request(app)
        .put(`/api/bakes/${bake1.body.id}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 4 });

      // Get active bakes
      const activeBakes = await request(app)
        .get('/api/bakes/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(activeBakes.status).toBe(200);
      expect(Array.isArray(activeBakes.body)).toBe(true);
      expect(activeBakes.body.length).toBeGreaterThanOrEqual(1);
      activeBakes.body.forEach((bake: any) => {
        expect(bake.active).toBe(true);
        expect(bake.finishTimestamp).toBeNull();
      });

      // Get all bakes
      const allBakes = await request(app)
        .get('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(allBakes.status).toBe(200);
      expect(Array.isArray(allBakes.body)).toBe(true);
      expect(allBakes.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Bake Ownership Workflow', () => {
    it('should prevent user from accessing another user\'s bake', async () => {
      // User 1 creates bake
      const bakeResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId });

      const bakeId = bakeResponse.body.id;

      // Create user 2
      const email2 = `workflow-bake-user2-${Date.now()}@example.com`;
      const reg2 = await request(app)
        .post('/api/auth/register')
        .send({ email: email2, password: 'TestPassword123!' });
      const authToken2 = reg2.body.token;

      // User 2 tries to access user 1's bake
      const unauthorizedAccess = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect([403, 404]).toContain(unauthorizedAccess.status);
    });
  });
});

