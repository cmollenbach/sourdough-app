/**
 * Test Utilities for Validation Testing
 * 
 * Provides helper functions for testing validation middleware
 */

import request from 'supertest';
import express, { Application } from 'express';
import { expect } from '@jest/globals';
import { validateBody, validateParams, validateQuery } from '../../src/middleware/validation';
import { errorHandler } from '../../src/middleware/errorHandler';
import Joi from 'joi';

/**
 * Creates a minimal Express app for testing validation middleware
 */
export function createTestApp(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  validationMiddleware?: any[]
): Application {
  const app = express();
  app.use(express.json());

  const middlewares = validationMiddleware || [];
  
  // Create route with validation
  const handler = (req: any, res: any) => {
    res.status(200).json({ 
      success: true, 
      body: req.body,
      params: req.params,
      query: req.query
    });
  };

  switch (method) {
    case 'get':
      app.get(path, ...middlewares, handler);
      break;
    case 'post':
      app.post(path, ...middlewares, handler);
      break;
    case 'put':
      app.put(path, ...middlewares, handler);
      break;
    case 'patch':
      app.patch(path, ...middlewares, handler);
      break;
    case 'delete':
      app.delete(path, ...middlewares, handler);
      break;
  }

  // Add error handler
  app.use(errorHandler);

  return app;
}

/**
 * Test a validation schema directly (unit test helper)
 */
export function testSchema(schema: Joi.Schema, data: any) {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
}

/**
 * Extract validation error details from response
 */
export function extractValidationErrors(response: any) {
  // Error handler returns: { success: false, error: { message, statusCode, details } }
  if (response.body.error && response.body.error.details && response.body.error.details.details) {
    return response.body.error.details.details.map((detail: any) => ({
      field: detail.field,
      message: detail.message,
    }));
  }
  return [];
}

/**
 * Check if response has validation error for a specific field
 */
export function hasFieldError(response: any, fieldName: string): boolean {
  const errors = extractValidationErrors(response);
  return errors.some((error: any) => error.field === fieldName);
}

/**
 * Get validation error message for a specific field
 */
export function getFieldErrorMessage(response: any, fieldName: string): string | null {
  const errors = extractValidationErrors(response);
  const fieldError = errors.find((error: any) => error.field === fieldName);
  return fieldError ? fieldError.message : null;
}

/**
 * Common test data generators
 */
export const testData = {
  validEmail: 'test@example.com',
  invalidEmail: 'not-an-email',
  validPassword: 'password123',
  shortPassword: 'short',
  longPassword: 'a'.repeat(129), // 129 chars (exceeds 128 max)
  
  validRecipe: {
    name: 'Test Recipe',
    totalWeight: 1000,
    hydrationPct: 75,
    saltPct: 2,
    notes: 'Test notes',
  },
  
  invalidRecipe: {
    name: '', // Empty name
    totalWeight: -100, // Negative weight
    hydrationPct: 600, // Exceeds 500% max
    saltPct: 15, // Exceeds 10% max
  },
  
  validBakeNotes: 'This bake went well!',
  longBakeNotes: 'a'.repeat(10001), // Exceeds 10,000 chars
  
  validRating: 5,
  invalidRating: 10, // Exceeds max of 5
};

/**
 * JWT token generator for authenticated requests (mock)
 */
export function generateMockToken(userId = 1): string {
  // In real tests, you'd generate a proper JWT
  // For now, return a mock token
  return 'mock-jwt-token';
}

/**
 * Assertion helpers
 */
export const assertions = {
  /**
   * Assert response is a validation error
   */
  isValidationError(response: any) {
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Validation error');
    expect(response.body.error.details).toBeDefined();
    expect(response.body.error.details.details).toBeDefined();
    expect(Array.isArray(response.body.error.details.details)).toBe(true);
  },

  /**
   * Assert response is successful
   */
  isSuccess(response: any) {
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  },

  /**
   * Assert specific field has validation error
   */
  hasFieldError(response: any, fieldName: string) {
    const errors = extractValidationErrors(response);
    const hasError = errors.some((error: any) => error.field === fieldName);
    expect(hasError).toBe(true);
  },

  /**
   * Assert validation error count
   */
  hasErrorCount(response: any, count: number) {
    const errors = extractValidationErrors(response);
    expect(errors.length).toBe(count);
  },

  /**
   * Assert field was sanitized/normalized
   */
  fieldWasSanitized(response: any, field: string, expectedValue: any) {
    expect(response.body.body[field]).toBe(expectedValue);
  },
};
