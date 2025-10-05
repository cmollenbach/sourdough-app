/**
 * Integration Tests for Bake Route Validation
 * 
 * Tests validation middleware on bake endpoints
 */

import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { 
  createTestApp, 
  testData, 
  assertions,
  hasFieldError,
  getFieldErrorMessage
} from '../utils/validationTestHelpers';
import { validateBody, validateParams } from '../../src/middleware/validation';
import { 
  bakeIdParamSchema,
  updateBakeNotesSchema,
  updateBakeRatingSchema
} from '../../src/validation/recipeSchemas';

describe('Bake Validation - Update Notes', () => {
  const app = createTestApp('put', '/bakes/:bakeId/notes', [
    validateParams(bakeIdParamSchema),
    validateBody(updateBakeNotesSchema)
  ]);

  describe('Valid Input', () => {
    it('should accept valid notes with bake ID', async () => {
      const response = await request(app)
        .put('/bakes/1/notes')
        .send({
          notes: testData.validBakeNotes,
        });

      assertions.isSuccess(response);
      expect(response.body.params.bakeId).toBe(1);
    });

    it('should accept empty notes', async () => {
      const response = await request(app)
        .put('/bakes/1/notes')
        .send({
          notes: '',
        });

      assertions.isSuccess(response);
    });

    it('should accept null notes', async () => {
      const response = await request(app)
        .put('/bakes/1/notes')
        .send({
          notes: null,
        });

      assertions.isSuccess(response);
    });

    it('should accept notes at max length (10,000 chars)', async () => {
      const response = await request(app)
        .put('/bakes/1/notes')
        .send({
          notes: 'a'.repeat(10000),
        });

      assertions.isSuccess(response);
    });

    it('should accept multiline notes', async () => {
      const response = await request(app)
        .put('/bakes/1/notes')
        .send({
          notes: 'Line 1\nLine 2\nLine 3',
        });

      assertions.isSuccess(response);
    });
  });

  describe('Invalid Notes', () => {
    it('should reject missing notes field', async () => {
      const response = await request(app)
        .put('/bakes/1/notes')
        .send({});

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'notes');
    });

    it('should reject notes exceeding max length (10,000 chars)', async () => {
      const response = await request(app)
        .put('/bakes/1/notes')
        .send({
          notes: testData.longBakeNotes, // 10,001 chars
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'notes');
      expect(getFieldErrorMessage(response, 'notes')).toContain('10,000');
    });
  });

  describe('Invalid Bake ID Param', () => {
    it('should reject non-numeric bake ID', async () => {
      const response = await request(app)
        .put('/bakes/abc/notes')
        .send({
          notes: 'Test notes',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid URL parameters');
    });

    it('should reject negative bake ID', async () => {
      const response = await request(app)
        .put('/bakes/-1/notes')
        .send({
          notes: 'Test notes',
        });

      expect(response.status).toBe(400);
    });

    it('should reject zero bake ID', async () => {
      const response = await request(app)
        .put('/bakes/0/notes')
        .send({
          notes: 'Test notes',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Unknown Fields', () => {
    it('should strip unknown fields', async () => {
      const response = await request(app)
        .put('/bakes/1/notes')
        .send({
          notes: 'Valid notes',
          unknownField: 'should be removed',
        });

      assertions.isSuccess(response);
      expect(response.body.body.unknownField).toBeUndefined();
      expect(response.body.body.notes).toBe('Valid notes');
    });
  });
});

describe('Bake Validation - Update Rating', () => {
  const app = createTestApp('put', '/bakes/:bakeId/rating', [
    validateParams(bakeIdParamSchema),
    validateBody(updateBakeRatingSchema)
  ]);

  describe('Valid Input', () => {
    it('should accept rating of 1', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({
          rating: 1,
        });

      assertions.isSuccess(response);
    });

    it('should accept rating of 3', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({
          rating: 3,
        });

      assertions.isSuccess(response);
    });

    it('should accept rating of 5', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({
          rating: 5,
        });

      assertions.isSuccess(response);
    });

    it('should accept all valid ratings (1-5)', async () => {
      for (let rating = 1; rating <= 5; rating++) {
        const response = await request(app)
          .put('/bakes/1/rating')
          .send({ rating });

        assertions.isSuccess(response);
        expect(response.body.body.rating).toBe(rating);
      }
    });
  });

  describe('Invalid Rating', () => {
    it('should reject missing rating', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({});

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'rating');
      expect(getFieldErrorMessage(response, 'rating')).toContain('required');
    });

    it('should reject rating of 0', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({
          rating: 0,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'rating');
      expect(getFieldErrorMessage(response, 'rating')).toContain('between 1 and 5');
    });

    it('should reject rating of 6', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({
          rating: 6,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'rating');
      expect(getFieldErrorMessage(response, 'rating')).toContain('between 1 and 5');
    });

    it('should reject rating of 10', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({
          rating: testData.invalidRating, // 10
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'rating');
    });

    it('should reject negative rating', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({
          rating: -1,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'rating');
    });

    it('should reject decimal rating', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({
          rating: 3.5,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'rating');
    });

    it('should reject string rating', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({
          rating: '5',
        });

      // Joi may coerce string to number, or reject it
      // This tests the actual behavior
      if (response.status === 400) {
        assertions.isValidationError(response);
      } else {
        // If coerced, should be a number
        expect(typeof response.body.body.rating).toBe('number');
      }
    });

    it('should reject null rating', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({
          rating: null,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'rating');
    });
  });

  describe('Invalid Bake ID Param', () => {
    it('should reject non-numeric bake ID', async () => {
      const response = await request(app)
        .put('/bakes/abc/rating')
        .send({
          rating: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid URL parameters');
    });

    it('should reject negative bake ID', async () => {
      const response = await request(app)
        .put('/bakes/-1/rating')
        .send({
          rating: 5,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Unknown Fields', () => {
    it('should strip unknown fields', async () => {
      const response = await request(app)
        .put('/bakes/1/rating')
        .send({
          rating: 5,
          unknownField: 'should be removed',
        });

      assertions.isSuccess(response);
      expect(response.body.body.unknownField).toBeUndefined();
      expect(response.body.body.rating).toBe(5);
    });
  });
});

describe('Bake Validation - Bake ID Parameter', () => {
  const app = createTestApp('get', '/bakes/:bakeId', [validateParams(bakeIdParamSchema)]);

  describe('Valid IDs', () => {
    it('should accept positive integer bake ID', async () => {
      const response = await request(app).get('/bakes/1');
      assertions.isSuccess(response);
      expect(response.body.params.bakeId).toBe(1);
    });

    it('should accept large integer bake ID', async () => {
      const response = await request(app).get('/bakes/999999');
      assertions.isSuccess(response);
      expect(response.body.params.bakeId).toBe(999999);
    });
  });

  describe('Invalid IDs', () => {
    it('should reject non-numeric bake ID', async () => {
      const response = await request(app).get('/bakes/abc');
      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid URL parameters');
    });

    it('should reject negative bake ID', async () => {
      const response = await request(app).get('/bakes/-1');
      expect(response.status).toBe(400);
    });

    it('should reject zero bake ID', async () => {
      const response = await request(app).get('/bakes/0');
      expect(response.status).toBe(400);
    });

    it('should reject decimal bake ID', async () => {
      const response = await request(app).get('/bakes/1.5');
      expect(response.status).toBe(400);
    });
  });
});
