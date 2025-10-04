/**
 * Step Template Admin Routes Tests
 * 
 * Tests for admin-only step template management:
 * - PUT /api/steps/templates/:id (update template)
 * - DELETE /api/steps/templates/:id (delete template)
 * 
 * Coverage target: 90%+ for routes/steps.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import stepRoutes from '../../src/routes/steps';
import authRoutes from '../../src/routes/auth';
import { errorHandler } from '../../src/middleware/errorHandler';
import prisma from '../../src/lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/steps', stepRoutes);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Step Template Admin Routes', () => {
  let adminToken: string;
  let regularUserToken: string;
  let adminUserId: number;
  let regularUserId: number;
  let testTemplateId: number;

  beforeAll(async () => {
    // Create admin user
    const adminRegister = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!',
        confirmPassword: 'AdminPass123!',
      });
    
    adminUserId = adminRegister.body.user.id;
    adminToken = adminRegister.body.token;

    // Update admin user to have ADMIN role
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: 'ADMIN' },
    });

    // Re-login to get token with ADMIN role
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!',
      });
    
    adminToken = adminLogin.body.token;

    // Create regular user
    const userRegister = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: 'UserPass123!',
        confirmPassword: 'UserPass123!',
      });
    
    regularUserId = userRegister.body.user.id;
    regularUserToken = userRegister.body.token;
  });

  beforeEach(async () => {
    // Clean up any existing test templates (delete by name pattern to catch all test templates)
    // First delete related records to avoid foreign key constraints
    try {
      // Delete parameters and ingredient rules for test templates first
      const testTemplates = await prisma.stepTemplate.findMany({
        where: {
          OR: [
            { name: { startsWith: 'Test' } },
            { name: { startsWith: 'Never Used' } },
            { name: { startsWith: 'Name Only' } },
            { name: { startsWith: 'Stretch' } },
            { name: { startsWith: 'Long Description' } },
          ],
        },
        select: { id: true },
      });
      
      const testTemplateIds = testTemplates.map(t => t.id);
      
      if (testTemplateIds.length > 0) {
        await prisma.stepTemplateParameter.deleteMany({
          where: { stepTemplateId: { in: testTemplateIds } },
        });
        await prisma.stepTemplateIngredientRule.deleteMany({
          where: { stepTemplateId: { in: testTemplateIds } },
        });
        await prisma.stepTemplate.deleteMany({
          where: { id: { in: testTemplateIds } },
        });
      }
    } catch (error) {
      // Ignore cleanup errors
      console.log('Cleanup warning:', error);
    }

    // Create a test template for each test with unique name to avoid conflicts
    const template = await prisma.stepTemplate.create({
      data: {
        name: `Test Template ${Date.now()}`,
        description: 'A template for testing',
        stepTypeId: 1, // Assuming step type with ID 1 exists from seed
        advanced: false,
        role: 'OTHER', // Required field - using OTHER for generic test template
      },
    });
    testTemplateId = template.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.recipeStepIngredient.deleteMany({});
    await prisma.recipeStepParameterValue.deleteMany({});
    await prisma.recipeStep.deleteMany({ where: { recipe: { ownerId: { in: [adminUserId, regularUserId] } } } });
    await prisma.recipe.deleteMany({ where: { ownerId: { in: [adminUserId, regularUserId] } } });
    await prisma.account.deleteMany({ where: { userId: { in: [adminUserId, regularUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [adminUserId, regularUserId] } } });
    
    // Clean up test templates (only those created in tests, not seed data)
    await prisma.stepTemplate.deleteMany({
      where: {
        name: { in: ['Test Template', 'Updated Template', 'Template to Delete'] },
      },
    });
  });

  // =====================================================
  // PUT /api/steps/templates/:id - UPDATE TEMPLATE
  // =====================================================

  describe('PUT /api/steps/templates/:id', () => {
    describe('Successful Updates', () => {
      it('should update template name and description as admin', async () => {
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Updated Template',
            description: 'Updated description',
          });

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testTemplateId);
        expect(response.body.name).toBe('Updated Template');
        expect(response.body.description).toBe('Updated description');

        // Verify in database
        const updatedTemplate = await prisma.stepTemplate.findUnique({
          where: { id: testTemplateId },
        });
        expect(updatedTemplate?.name).toBe('Updated Template');
        expect(updatedTemplate?.description).toBe('Updated description');
      });

      it('should update only name, keeping description unchanged', async () => {
        const originalDescription = 'A template for testing';
        const uniqueName = `Name Only Update ${Date.now()}`;
        
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: uniqueName,
            description: originalDescription,
          });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe(uniqueName);
        expect(response.body.description).toBe(originalDescription);
      });

      it('should handle special characters in name and description', async () => {
        const specialName = `Stretch & Fold™ ${Date.now()}`;
        const specialDescription = 'Perform S&F every 30min @ 75°F (24°C) — до 4 часа';

        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: specialName,
            description: specialDescription,
          });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe(specialName);
        expect(response.body.description).toBe(specialDescription);
      });

      it('should handle very long descriptions', async () => {
        const longDescription = 'A'.repeat(1000); // 1000 characters
        const uniqueName = `Long Description Template ${Date.now()}`;

        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: uniqueName,
            description: longDescription,
          });

        expect(response.status).toBe(200);
        expect(response.body.description).toBe(longDescription);
        expect(response.body.description.length).toBe(1000);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 if name is missing', async () => {
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Description without name',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('name and description are required');
      });

      it('should return 400 if description is missing', async () => {
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Name without description',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('name and description are required');
      });

      it('should return 400 if both name and description are missing', async () => {
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('name and description are required');
      });

      it('should return 400 if name is not a string', async () => {
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 12345,
            description: 'Valid description',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('name and description are required');
      });

      it('should return 400 if description is not a string', async () => {
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Valid name',
            description: ['array', 'not', 'string'],
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('name and description are required');
      });

      it('should return 400 if name is empty string', async () => {
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '',
            description: 'Valid description',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('name and description are required');
      });

      it('should return 400 if description is empty string', async () => {
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Valid name',
            description: '',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('name and description are required');
      });
    });

    describe('Authorization & Authentication', () => {
      it('should return 401 if no token provided', async () => {
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .send({
            name: 'Unauthorized Update',
            description: 'Should fail',
          });

        expect(response.status).toBe(401);
      });

      it('should return 403 if regular user (non-admin) tries to update', async () => {
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({
            name: 'Forbidden Update',
            description: 'Should fail',
          });

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('Admin');
      });

      it('should return 401 if invalid token provided', async () => {
        const response = await request(app)
          .put(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', 'Bearer invalid-token-xyz')
          .send({
            name: 'Invalid Token Update',
            description: 'Should fail',
          });

        expect(response.status).toBe(401);
      });
    });

    describe('Error Handling', () => {
      it('should return 404 if template does not exist', async () => {
        const nonExistentId = 999999;

        const response = await request(app)
          .put(`/api/steps/templates/${nonExistentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Non-existent Template',
            description: 'Should fail',
          });

        expect(response.status).toBe(404);
      });

      it('should return 400 if template ID is not a number', async () => {
        const response = await request(app)
          .put('/api/steps/templates/not-a-number')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Invalid ID',
            description: 'Should fail',
          });

        expect(response.status).toBe(400);
      });

      it('should return 404 if template ID is negative', async () => {
        const response = await request(app)
          .put('/api/steps/templates/-1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Negative ID',
            description: 'Should fail',
          });

        expect(response.status).toBe(404); // Negative ID treated as "not found"
      });
    });
  });

  // =====================================================
  // DELETE /api/steps/templates/:id - DELETE TEMPLATE
  // =====================================================

  describe('DELETE /api/steps/templates/:id', () => {
    describe('Successful Deletions', () => {
      it('should delete an unused template as admin', async () => {
        const response = await request(app)
          .delete(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(204);
        expect(response.body).toEqual({});

        // Verify template is deleted
        const deletedTemplate = await prisma.stepTemplate.findUnique({
          where: { id: testTemplateId },
        });
        expect(deletedTemplate).toBeNull();
      });

      it('should successfully delete template that was never used', async () => {
        const unusedTemplate = await prisma.stepTemplate.create({
          data: {
            name: 'Never Used Template',
            description: 'This template is never referenced',
            stepTypeId: 1,
            advanced: false,
            role: 'OTHER',
          },
        });

        const response = await request(app)
          .delete(`/api/steps/templates/${unusedTemplate.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(204);

        // Verify deletion
        const deleted = await prisma.stepTemplate.findUnique({
          where: { id: unusedTemplate.id },
        });
        expect(deleted).toBeNull();
      });
    });

    describe('Prevention of Deletion When In Use', () => {
      it('should return 400 if template is used by a recipe', async () => {
        // Create a recipe using the test template
        const recipe = await prisma.recipe.create({
          data: {
            name: 'Recipe Using Template',
            ownerId: adminUserId,
            steps: {
              create: {
                order: 1,
                description: 'Step using template',
                stepTemplateId: testTemplateId,
              },
            },
          },
        });

        const response = await request(app)
          .delete(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('Cannot delete template');
        expect(response.body.error.message).toContain('currently used');

        // Verify template still exists
        const template = await prisma.stepTemplate.findUnique({
          where: { id: testTemplateId },
        });
        expect(template).not.toBeNull();

        // Cleanup
        await prisma.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
        await prisma.recipe.delete({ where: { id: recipe.id } });
      });

      it('should return 400 if template is used by multiple recipes', async () => {
        // Create multiple recipes using the same template
        const recipe1 = await prisma.recipe.create({
          data: {
            name: 'Recipe 1 Using Template',
            ownerId: adminUserId,
            steps: {
              create: {
                order: 1,
                description: 'Step 1',
                stepTemplateId: testTemplateId,
              },
            },
          },
        });

        const recipe2 = await prisma.recipe.create({
          data: {
            name: 'Recipe 2 Using Template',
            ownerId: regularUserId,
            steps: {
              create: {
                order: 1,
                description: 'Step 2',
                stepTemplateId: testTemplateId,
              },
            },
          },
        });

        const response = await request(app)
          .delete(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('Cannot delete template');

        // Cleanup
        await prisma.recipeStep.deleteMany({ where: { recipeId: { in: [recipe1.id, recipe2.id] } } });
        await prisma.recipe.deleteMany({ where: { id: { in: [recipe1.id, recipe2.id] } } });
      });

      it('should allow deletion after removing all recipe references', async () => {
        // Create a recipe using the template
        const recipe = await prisma.recipe.create({
          data: {
            name: 'Temporary Recipe',
            ownerId: adminUserId,
            steps: {
              create: {
                order: 1,
                description: 'Temporary step',
                stepTemplateId: testTemplateId,
              },
            },
          },
        });

        // First attempt should fail
        const failResponse = await request(app)
          .delete(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(failResponse.status).toBe(400);

        // Delete the recipe (removing reference)
        await prisma.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
        await prisma.recipe.delete({ where: { id: recipe.id } });

        // Second attempt should succeed
        const successResponse = await request(app)
          .delete(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(successResponse.status).toBe(204);

        // Verify deletion
        const deleted = await prisma.stepTemplate.findUnique({
          where: { id: testTemplateId },
        });
        expect(deleted).toBeNull();
      });
    });

    describe('Authorization & Authentication', () => {
      it('should return 401 if no token provided', async () => {
        const response = await request(app)
          .delete(`/api/steps/templates/${testTemplateId}`);

        expect(response.status).toBe(401);
      });

      it('should return 403 if regular user (non-admin) tries to delete', async () => {
        const response = await request(app)
          .delete(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${regularUserToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('Admin');

        // Verify template still exists
        const template = await prisma.stepTemplate.findUnique({
          where: { id: testTemplateId },
        });
        expect(template).not.toBeNull();
      });

      it('should return 401 if invalid token provided', async () => {
        const response = await request(app)
          .delete(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', 'Bearer invalid-token-abc');

        expect(response.status).toBe(401);
      });
    });

    describe('Error Handling', () => {
      it('should return 404 if template does not exist', async () => {
        const nonExistentId = 999999;

        const response = await request(app)
          .delete(`/api/steps/templates/${nonExistentId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
      });

      it('should return 400 if template ID is not a number', async () => {
        const response = await request(app)
          .delete('/api/steps/templates/not-a-number')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
      });

      it('should return 404 if template ID is zero', async () => {
        const response = await request(app)
          .delete('/api/steps/templates/0')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404); // ID 0 treated as "not found"
      });

      it('should return 404 if template ID is negative', async () => {
        const response = await request(app)
          .delete('/api/steps/templates/-5')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404); // Negative ID treated as "not found"
      });
    });

    describe('Idempotency', () => {
      it('should return 404 on second delete attempt (not idempotent)', async () => {
        // First delete
        const firstResponse = await request(app)
          .delete(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(firstResponse.status).toBe(204);

        // Second delete attempt
        const secondResponse = await request(app)
          .delete(`/api/steps/templates/${testTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(secondResponse.status).toBe(404);
      });
    });
  });
});

