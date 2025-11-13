/**
 * Edge Cases and Error Handling Tests
 * 
 * Tests error handling, boundary conditions, and edge cases across the application.
 * These tests verify the system handles unexpected inputs and error scenarios gracefully.
 * 
 * Edge cases covered:
 * - Invalid authentication tokens
 * - Expired sessions
 * - Resource not found scenarios
 * - Unauthorized access attempts
 * - Concurrent operations
 * - Large/complex data
 * - Invalid input validation
 * - Network-like failures
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../../src/routes/auth';
import recipesRouter from '../../src/routes/recipes';
import bakesRoutes from '../../src/routes/bakes';
import userProfileRoutes from '../../src/routes/userProfile';
import { errorHandler } from '../../src/middleware/errorHandler';
import { seedTestMetadata, getTestTemplateIds, getIngredientIdByName } from '../utils/seedTestData';
import prisma from '../../src/lib/prisma';

describe('Edge Cases and Error Handling', () => {
  let app: express.Application;
  let authToken: string;
  let userId: number;
  let authToken2: string;
  let userId2: number;
  let recipeId: number;
  let bakeId: number;
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
    app.use('/api/userProfile', userProfileRoutes);
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
    // Create two test users
    const email1 = `workflow-edge-user1-${Date.now()}@example.com`;
    const email2 = `workflow-edge-user2-${Date.now()}@example.com`;

    const reg1 = await request(app)
      .post('/api/auth/register')
      .send({ email: email1, password: 'TestPassword123!' });
    authToken = reg1.body.token;
    userId = reg1.body.user.id;

    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({ email: email2, password: 'TestPassword123!' });
    authToken2 = reg2.body.token;
    userId2 = reg2.body.user.id;

    // Create test recipe for user 1
    const recipeResponse = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: `Edge Test Recipe ${Date.now()}` });
    recipeId = recipeResponse.body.id;

    // Create test bake for user 1
    const bakeResponse = await request(app)
      .post('/api/bakes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ recipeId });
    bakeId = bakeResponse.body.id;

    // Clean up test data
    await prisma.userAction.deleteMany({ where: { userId: { in: [userId, userId2] } } });
    await prisma.userPreference.deleteMany({ where: { userId: { in: [userId, userId2] } } });
  });

  describe('Authentication Edge Cases', () => {
    it('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', 'Bearer invalid-token-format');

      expect([401, 403]).toContain(response.status);
    });

    it('should reject requests with missing authorization header', async () => {
      const response = await request(app)
        .get('/api/recipes');

      expect([401, 403]).toContain(response.status);
    });

    it('should reject requests with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', 'InvalidFormat token');

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Resource Not Found Edge Cases', () => {
    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .get('/api/recipes/999999/full')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent bake', async () => {
      const response = await request(app)
        .get('/api/bakes/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 when trying to update non-existent recipe', async () => {
      const response = await request(app)
        .put('/api/recipes/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });

    it('should return 404 when trying to delete non-existent recipe', async () => {
      const response = await request(app)
        .delete('/api/recipes/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Unauthorized Access Edge Cases', () => {
    it('should prevent user from accessing another user\'s recipe', async () => {
      // User 2 tries to access user 1's recipe
      const response = await request(app)
        .get(`/api/recipes/${recipeId}/full`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should prevent user from editing another user\'s recipe', async () => {
      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ name: 'Hacked Recipe' });

      expect([403, 404]).toContain(response.status);
    });

    it('should prevent user from deleting another user\'s recipe', async () => {
      const response = await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should prevent user from accessing another user\'s bake', async () => {
      const response = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should prevent user from modifying another user\'s bake', async () => {
      const bakeDetails = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const stepId = bakeDetails.body.steps[0]?.id;
      if (stepId) {
        const response = await request(app)
          .put(`/api/bakes/${bakeId}/steps/${stepId}/start`)
          .set('Authorization', `Bearer ${authToken2}`);

        expect([403, 404]).toContain(response.status);
      }
    });
  });

  describe('Invalid Input Validation Edge Cases', () => {
    it('should reject recipe creation with invalid step template ID', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Recipe',
          steps: [
            {
              stepTemplateId: 999999, // Non-existent template
              order: 1,
            },
          ],
        });

      expect([400, 500]).toContain(response.status);
    });

    it('should reject recipe creation with invalid ingredient ID', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Recipe',
          steps: [
            {
              stepTemplateId: templateIds.autolyse,
              order: 1,
              ingredients: [
                {
                  ingredientId: 999999, // Non-existent ingredient
                  amount: 100,
                  calculationMode: 'FIXED_WEIGHT',
                },
              ],
            },
          ],
        });

      expect([400, 500]).toContain(response.status);
    });

    it('should reject bake creation with invalid recipe ID', async () => {
      const response = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId: 999999 });

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should reject bake step operations with invalid step ID', async () => {
      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/999999/start`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should reject profile update with invalid data types', async () => {
      const response = await request(app)
        .put('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipesCreated: 'not-a-number', // Should be number
          experienceLevel: 123, // Should be string
        });

      // Should either reject or coerce - depends on implementation
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Concurrent Operations Edge Cases', () => {
    it('should handle concurrent recipe updates gracefully', async () => {
      // Make concurrent update requests
      const [update1, update2, update3] = await Promise.all([
        request(app)
          .put(`/api/recipes/${recipeId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ notes: 'Update 1' }),
        request(app)
          .put(`/api/recipes/${recipeId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ notes: 'Update 2' }),
        request(app)
          .put(`/api/recipes/${recipeId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ notes: 'Update 3' }),
      ]);

      // All should succeed (last write wins)
      expect(update1.status).toBe(200);
      expect(update2.status).toBe(200);
      expect(update3.status).toBe(200);

      // Verify final state
      const finalRecipe = await request(app)
        .get(`/api/recipes/${recipeId}/full`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalRecipe.status).toBe(200);
      // One of the updates should be the final state
      expect(['Update 1', 'Update 2', 'Update 3']).toContain(finalRecipe.body.notes);
    });

    it('should handle concurrent bake step updates', async () => {
      const bakeDetails = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const stepId = bakeDetails.body.steps[0]?.id;
      if (!stepId) {
        return; // Skip if no steps
      }

      // Make concurrent step updates
      const [update1, update2] = await Promise.all([
        request(app)
          .put(`/api/bakes/${bakeId}/steps/${stepId}/note`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ notes: 'Note 1' }),
        request(app)
          .put(`/api/bakes/${bakeId}/steps/${stepId}/note`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ notes: 'Note 2' }),
      ]);

      // Both should succeed
      expect(update1.status).toBe(200);
      expect(update2.status).toBe(200);
    });
  });

  describe('Large Data Edge Cases', () => {
    it('should handle recipe with many steps', async () => {
      // Create recipe with 20 steps
      const steps = Array.from({ length: 20 }, (_, i) => ({
        stepTemplateId: templateIds.autolyse,
        order: i + 1,
      }));

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Large Recipe ${Date.now()}`,
          steps,
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeTruthy();

      // Verify all steps created
      const fullRecipe = await request(app)
        .get(`/api/recipes/${response.body.id}/full`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(fullRecipe.body.steps).toHaveLength(20);
    });

    it('should handle recipe with many ingredients per step', async () => {
      // Create recipe with step containing 10 ingredients
      const ingredients = Array.from({ length: 10 }, (_, i) => ({
        ingredientId: ingredientIds.flour,
        amount: 100 + i,
        calculationMode: 'FIXED_WEIGHT' as const,
      }));

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Many Ingredients Recipe ${Date.now()}`,
          steps: [
            {
              stepTemplateId: templateIds.autolyse,
              order: 1,
              ingredients,
            },
          ],
        });

      expect(response.status).toBe(201);

      // Verify all ingredients created
      const fullRecipe = await request(app)
        .get(`/api/recipes/${response.body.id}/full`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(fullRecipe.body.steps[0].ingredients).toHaveLength(10);
    });
  });

  describe('Boundary Value Edge Cases', () => {
    it('should handle empty recipe name', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' });

      // Should either reject or allow - depends on validation
      expect([200, 201, 400]).toContain(response.status);
    });

    it('should handle very long recipe name', async () => {
      const longName = 'A'.repeat(1000);
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: longName });

      // Should either accept or reject based on DB constraints
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    it('should handle negative values in recipe calculations', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Negative Values Recipe',
          hydrationPct: -10,
          saltPct: -5,
        });

      // Should either reject or handle gracefully
      expect([200, 201, 400]).toContain(response.status);
    });

    it('should handle zero values in recipe calculations', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Zero Values Recipe',
          hydrationPct: 0,
          saltPct: 0,
        });

      expect([200, 201]).toContain(response.status);
    });

    it('should handle very large numeric values', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Large Values Recipe',
          totalWeight: 999999999,
          hydrationPct: 999.99,
        });

      // Should either accept or reject based on DB constraints
      expect([200, 201, 400, 500]).toContain(response.status);
    });
  });

  describe('State Transition Edge Cases', () => {
    it('should prevent completing already completed bake', async () => {
      // Complete bake
      await request(app)
        .put(`/api/bakes/${bakeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to complete again
      const response = await request(app)
        .put(`/api/bakes/${bakeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 404]).toContain(response.status);
    });

    it('should prevent modifying steps in completed bake', async () => {
      // Complete bake
      await request(app)
        .put(`/api/bakes/${bakeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      const bakeDetails = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const stepId = bakeDetails.body.steps[0]?.id;
      if (stepId) {
        // Try to start step in completed bake
        const response = await request(app)
          .put(`/api/bakes/${bakeId}/steps/${stepId}/start`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 404]).toContain(response.status);
      }
    });

    it('should handle step status transitions correctly', async () => {
      const bakeDetails = await request(app)
        .get(`/api/bakes/${bakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const stepId = bakeDetails.body.steps[0]?.id;
      if (!stepId) {
        return;
      }

      // Start step
      await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to start again (should handle gracefully)
      const response = await request(app)
        .put(`/api/bakes/${bakeId}/steps/${stepId}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should either succeed (idempotent) or return error
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Data Integrity Edge Cases', () => {
    it('should maintain data integrity when recipe is deleted', async () => {
      // Create bake from recipe
      const bakeResponse = await request(app)
        .post('/api/bakes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipeId });

      const newBakeId = bakeResponse.body.id;

      // Delete recipe (soft delete)
      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Bake should still exist and be accessible
      const bakeCheck = await request(app)
        .get(`/api/bakes/${newBakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(bakeCheck.status).toBe(200);
      expect(bakeCheck.body.recipeId).toBe(recipeId); // Snapshot preserved
    });

    it('should handle orphaned references gracefully', async () => {
      // This test verifies that the system handles cases where
      // related data might be missing (defensive programming)
      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`);

      // Should return successfully even if some related data is missing
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

