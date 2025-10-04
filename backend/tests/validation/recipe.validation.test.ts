/**
 * Integration Tests for Recipe Route Validation
 * 
 * Tests validation middleware on recipe endpoints
 */

import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { 
  createTestApp, 
  testData, 
  assertions,
  hasFieldError,
  getFieldErrorMessage,
  extractValidationErrors
} from '../utils/validationTestHelpers';
import { validateBody, validateParams } from '../../src/middleware/validation';
import { 
  createRecipeSchema, 
  updateRecipeSchema, 
  recipeIdParamSchema 
} from '../../src/validation/recipeSchemas';

describe('Recipe Validation - Create Recipe', () => {
  const app = createTestApp('post', '/recipes', [validateBody(createRecipeSchema)]);

  describe('Valid Input', () => {
    it('should accept valid recipe with all fields', async () => {
      const response = await request(app)
        .post('/recipes')
        .send(testData.validRecipe);

      assertions.isSuccess(response);
    });

    it('should accept recipe with only required name', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Simple Recipe',
        });

      assertions.isSuccess(response);
    });

    it('should accept null for optional numeric fields', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Test Recipe',
          totalWeight: null,
          hydrationPct: null,
          saltPct: null,
        });

      assertions.isSuccess(response);
    });

    it('should trim whitespace from name', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: '  Test Recipe  ',
        });

      assertions.isSuccess(response);
      expect(response.body.body.name).toBe('Test Recipe');
    });

    it('should accept hydration at boundary (500%)', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'High Hydration',
          hydrationPct: 500,
        });

      assertions.isSuccess(response);
    });

    it('should accept salt at boundary (10%)', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Salty Bread',
          saltPct: 10,
        });

      assertions.isSuccess(response);
    });

    it('should accept totalWeight at boundary (100,000g)', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Big Batch',
          totalWeight: 100000,
        });

      assertions.isSuccess(response);
    });

    it('should accept notes at max length (5000 chars)', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Recipe with Notes',
          notes: 'a'.repeat(5000),
        });

      assertions.isSuccess(response);
    });

    it('should accept empty notes', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Recipe',
          notes: '',
        });

      assertions.isSuccess(response);
    });
  });

  describe('Invalid Name', () => {
    it('should reject missing name', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          totalWeight: 1000,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'name');
      expect(getFieldErrorMessage(response, 'name')).toContain('required');
    });

    it('should reject empty name', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: '',
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'name');
      expect(getFieldErrorMessage(response, 'name')).toContain('required');
    });

    it('should reject name exceeding max length (255 chars)', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'a'.repeat(256),
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'name');
      expect(getFieldErrorMessage(response, 'name')).toContain('255 characters');
    });
  });

  describe('Invalid Total Weight', () => {
    it('should reject negative total weight', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Test',
          totalWeight: -100,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'totalWeight');
      expect(getFieldErrorMessage(response, 'totalWeight')).toContain('positive');
    });

    it('should reject zero total weight', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Test',
          totalWeight: 0,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'totalWeight');
    });

    it('should reject total weight exceeding max (100,000g)', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Test',
          totalWeight: 100001,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'totalWeight');
      expect(getFieldErrorMessage(response, 'totalWeight')).toContain('100,000');
    });
  });

  describe('Invalid Hydration Percentage', () => {
    it('should reject negative hydration', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Test',
          hydrationPct: -10,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'hydrationPct');
      expect(getFieldErrorMessage(response, 'hydrationPct')).toContain('negative');
    });

    it('should reject hydration exceeding max (500%)', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Test',
          hydrationPct: 501,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'hydrationPct');
      expect(getFieldErrorMessage(response, 'hydrationPct')).toContain('500');
    });
  });

  describe('Invalid Salt Percentage', () => {
    it('should reject negative salt', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Test',
          saltPct: -1,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'saltPct');
      expect(getFieldErrorMessage(response, 'saltPct')).toContain('negative');
    });

    it('should reject salt exceeding max (10%)', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Test',
          saltPct: 11,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'saltPct');
      expect(getFieldErrorMessage(response, 'saltPct')).toContain('10');
    });
  });

  describe('Invalid Notes', () => {
    it('should reject notes exceeding max length (5000 chars)', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Test',
          notes: 'a'.repeat(5001),
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'notes');
      expect(getFieldErrorMessage(response, 'notes')).toContain('5,000');
    });
  });

  describe('Multiple Errors', () => {
    it('should return all validation errors at once', async () => {
      const response = await request(app)
        .post('/recipes')
        .send(testData.invalidRecipe);

      assertions.isValidationError(response);
      // Should have errors for: empty name, negative weight, high hydration, high salt
      const errors = extractValidationErrors(response);
      expect(errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Unknown Fields', () => {
    it('should strip unknown fields', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Test Recipe',
          unknownField: 'should be removed',
          anotherUnknown: 123,
        });

      assertions.isSuccess(response);
      expect(response.body.body.unknownField).toBeUndefined();
      expect(response.body.body.anotherUnknown).toBeUndefined();
    });
  });
});

describe('Recipe Validation - Update Recipe', () => {
  const app = createTestApp('put', '/recipes/:id', [
    validateParams(recipeIdParamSchema),
    validateBody(updateRecipeSchema)
  ]);

  describe('Valid Input', () => {
    it('should accept valid recipe ID param', async () => {
      const response = await request(app)
        .put('/recipes/1')
        .send({
          name: 'Updated Recipe',
        });

      assertions.isSuccess(response);
      expect(response.body.params.id).toBe(1);
    });

    it('should accept partial update (only name)', async () => {
      const response = await request(app)
        .put('/recipes/1')
        .send({
          name: 'New Name',
        });

      assertions.isSuccess(response);
    });

    it('should accept partial update (only hydration)', async () => {
      const response = await request(app)
        .put('/recipes/1')
        .send({
          hydrationPct: 80,
        });

      assertions.isSuccess(response);
    });

    it('should accept empty body (all fields optional)', async () => {
      const response = await request(app)
        .put('/recipes/1')
        .send({});

      assertions.isSuccess(response);
    });
  });

  describe('Invalid Recipe ID Param', () => {
    it('should reject non-numeric ID', async () => {
      const response = await request(app)
        .put('/recipes/abc')
        .send({
          name: 'Updated',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid URL parameters');
    });

    it('should reject negative ID', async () => {
      const response = await request(app)
        .put('/recipes/-1')
        .send({
          name: 'Updated',
        });

      expect(response.status).toBe(400);
    });

    it('should reject zero ID', async () => {
      const response = await request(app)
        .put('/recipes/0')
        .send({
          name: 'Updated',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Invalid Body Fields', () => {
    it('should reject empty name if provided', async () => {
      const response = await request(app)
        .put('/recipes/1')
        .send({
          name: '',
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'name');
    });

    it('should reject invalid hydration if provided', async () => {
      const response = await request(app)
        .put('/recipes/1')
        .send({
          hydrationPct: 600,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'hydrationPct');
    });

    it('should validate all provided fields', async () => {
      const response = await request(app)
        .put('/recipes/1')
        .send({
          totalWeight: -100,
          hydrationPct: 600,
          saltPct: 15,
        });

      assertions.isValidationError(response);
      const errors = extractValidationErrors(response);
      expect(errors.length).toBe(3);
    });
  });
});

describe('Recipe Validation - Recipe ID Parameter', () => {
  const app = createTestApp('get', '/recipes/:id', [validateParams(recipeIdParamSchema)]);

  describe('Valid IDs', () => {
    it('should accept positive integer ID', async () => {
      const response = await request(app).get('/recipes/1');
      assertions.isSuccess(response);
      expect(response.body.params.id).toBe(1);
    });

    it('should accept large integer ID', async () => {
      const response = await request(app).get('/recipes/999999');
      assertions.isSuccess(response);
      expect(response.body.params.id).toBe(999999);
    });
  });

  describe('Invalid IDs', () => {
    it('should reject non-numeric ID', async () => {
      const response = await request(app).get('/recipes/abc');
      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid URL parameters');
    });

    it('should reject negative ID', async () => {
      const response = await request(app).get('/recipes/-1');
      expect(response.status).toBe(400);
    });

    it('should reject zero ID', async () => {
      const response = await request(app).get('/recipes/0');
      expect(response.status).toBe(400);
    });

    it('should reject decimal ID', async () => {
      const response = await request(app).get('/recipes/1.5');
      expect(response.status).toBe(400);
    });
  });
});
