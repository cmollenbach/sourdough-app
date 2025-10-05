/**
 * Unit Tests for Validation Schemas
 * 
 * Tests Joi schemas directly without HTTP layer
 */

import { describe, it, expect } from '@jest/globals';
import { testSchema } from '../utils/validationTestHelpers';
import { registerSchema, loginSchema, googleOAuthSchema } from '../../src/validation/authSchemas';
import { createRecipeSchema, updateRecipeSchema } from '../../src/validation/recipeSchemas';

describe('Schema Unit Tests - Register Schema', () => {
  it('should validate correct data', () => {
    const { error, value } = testSchema(registerSchema, {
      email: 'test@example.com',
      password: 'password123',
    });

    expect(error).toBeUndefined();
    expect(value.email).toBe('test@example.com');
    expect(value.password).toBe('password123');
  });

  it('should normalize email to lowercase', () => {
    const { error, value } = testSchema(registerSchema, {
      email: 'TEST@EXAMPLE.COM',
      password: 'password123',
    });

    expect(error).toBeUndefined();
    expect(value.email).toBe('test@example.com');
  });

  it('should trim whitespace from email', () => {
    const { error, value } = testSchema(registerSchema, {
      email: '  test@example.com  ',
      password: 'password123',
    });

    expect(error).toBeUndefined();
    expect(value.email).toBe('test@example.com');
  });

  it('should reject short password', () => {
    const { error } = testSchema(registerSchema, {
      email: 'test@example.com',
      password: 'short',
    });

    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('password');
  });

  it('should reject invalid email', () => {
    const { error } = testSchema(registerSchema, {
      email: 'not-an-email',
      password: 'password123',
    });

    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('email');
  });

  it('should strip unknown fields', () => {
    const { value } = testSchema(registerSchema, {
      email: 'test@example.com',
      password: 'password123',
      unknownField: 'should be removed',
    });

    expect(value).toEqual({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});

describe('Schema Unit Tests - Login Schema', () => {
  it('should validate correct data', () => {
    const { error, value } = testSchema(loginSchema, {
      email: 'test@example.com',
      password: 'anypassword',
    });

    expect(error).toBeUndefined();
    expect(value.email).toBe('test@example.com');
  });

  it('should normalize email', () => {
    const { value } = testSchema(loginSchema, {
      email: 'TEST@EXAMPLE.COM',
      password: 'password',
    });

    expect(value.email).toBe('test@example.com');
  });

  it('should accept any password length', () => {
    const { error } = testSchema(loginSchema, {
      email: 'test@example.com',
      password: 'x', // Very short
    });

    expect(error).toBeUndefined();
  });
});

describe('Schema Unit Tests - OAuth Schema', () => {
  it('should validate correct data', () => {
    const { error, value } = testSchema(googleOAuthSchema, {
      idToken: 'valid-token-string',
    });

    expect(error).toBeUndefined();
    expect(value.idToken).toBe('valid-token-string');
  });

  it('should reject empty token', () => {
    const { error } = testSchema(googleOAuthSchema, {
      idToken: '',
    });

    expect(error).toBeDefined();
  });

  it('should reject missing token', () => {
    const { error } = testSchema(googleOAuthSchema, {});

    expect(error).toBeDefined();
  });
});

describe('Schema Unit Tests - Create Recipe Schema', () => {
  it('should validate minimal valid recipe', () => {
    const { error, value } = testSchema(createRecipeSchema, {
      name: 'Test Recipe',
    });

    expect(error).toBeUndefined();
    expect(value.name).toBe('Test Recipe');
  });

  it('should validate complete recipe', () => {
    const { error, value } = testSchema(createRecipeSchema, {
      name: 'Complete Recipe',
      totalWeight: 1000,
      hydrationPct: 75,
      saltPct: 2,
      notes: 'Test notes',
    });

    expect(error).toBeUndefined();
    expect(value.totalWeight).toBe(1000);
    expect(value.hydrationPct).toBe(75);
    expect(value.saltPct).toBe(2);
  });

  it('should trim recipe name', () => {
    const { value } = testSchema(createRecipeSchema, {
      name: '  Test Recipe  ',
    });

    expect(value.name).toBe('Test Recipe');
  });

  it('should accept null for optional fields', () => {
    const { error, value } = testSchema(createRecipeSchema, {
      name: 'Test',
      totalWeight: null,
      hydrationPct: null,
      saltPct: null,
      notes: null,
    });

    expect(error).toBeUndefined();
    expect(value.totalWeight).toBeNull();
  });

  it('should reject empty name', () => {
    const { error } = testSchema(createRecipeSchema, {
      name: '',
    });

    expect(error).toBeDefined();
  });

  it('should reject negative totalWeight', () => {
    const { error } = testSchema(createRecipeSchema, {
      name: 'Test',
      totalWeight: -100,
    });

    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('totalWeight');
  });

  it('should reject hydration > 500%', () => {
    const { error } = testSchema(createRecipeSchema, {
      name: 'Test',
      hydrationPct: 501,
    });

    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('hydrationPct');
  });

  it('should reject salt > 10%', () => {
    const { error } = testSchema(createRecipeSchema, {
      name: 'Test',
      saltPct: 11,
    });

    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('saltPct');
  });

  it('should reject notes > 5000 chars', () => {
    const { error } = testSchema(createRecipeSchema, {
      name: 'Test',
      notes: 'a'.repeat(5001),
    });

    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('notes');
  });

  it('should return all errors for invalid recipe', () => {
    const { error } = testSchema(createRecipeSchema, {
      name: '',
      totalWeight: -100,
      hydrationPct: 600,
      saltPct: 15,
    });

    expect(error).toBeDefined();
    expect(error?.details.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Schema Unit Tests - Update Recipe Schema', () => {
  it('should validate empty update (all optional)', () => {
    const { error } = testSchema(updateRecipeSchema, {});

    expect(error).toBeUndefined();
  });

  it('should validate partial update', () => {
    const { error, value } = testSchema(updateRecipeSchema, {
      name: 'Updated Name',
    });

    expect(error).toBeUndefined();
    expect(value.name).toBe('Updated Name');
  });

  it('should validate multiple fields', () => {
    const { error, value } = testSchema(updateRecipeSchema, {
      hydrationPct: 80,
      saltPct: 2.5,
    });

    expect(error).toBeUndefined();
    expect(value.hydrationPct).toBe(80);
    expect(value.saltPct).toBe(2.5);
  });

  it('should reject empty name if provided', () => {
    const { error } = testSchema(updateRecipeSchema, {
      name: '',
    });

    expect(error).toBeDefined();
  });

  it('should validate provided fields', () => {
    const { error } = testSchema(updateRecipeSchema, {
      hydrationPct: 600, // Too high
    });

    expect(error).toBeDefined();
  });
});

describe('Schema Unit Tests - Boundary Testing', () => {
  describe('Recipe Name Boundaries', () => {
    it('should accept 1-char name', () => {
      const { error } = testSchema(createRecipeSchema, { name: 'A' });
      expect(error).toBeUndefined();
    });

    it('should accept 255-char name', () => {
      const { error } = testSchema(createRecipeSchema, { name: 'a'.repeat(255) });
      expect(error).toBeUndefined();
    });

    it('should reject 256-char name', () => {
      const { error } = testSchema(createRecipeSchema, { name: 'a'.repeat(256) });
      expect(error).toBeDefined();
    });
  });

  describe('Hydration Boundaries', () => {
    it('should accept 0% hydration', () => {
      const { error } = testSchema(createRecipeSchema, { 
        name: 'Test', 
        hydrationPct: 0 
      });
      expect(error).toBeUndefined();
    });

    it('should accept 500% hydration', () => {
      const { error } = testSchema(createRecipeSchema, { 
        name: 'Test', 
        hydrationPct: 500 
      });
      expect(error).toBeUndefined();
    });

    it('should reject 501% hydration', () => {
      const { error } = testSchema(createRecipeSchema, { 
        name: 'Test', 
        hydrationPct: 501 
      });
      expect(error).toBeDefined();
    });
  });

  describe('Salt Boundaries', () => {
    it('should accept 0% salt', () => {
      const { error } = testSchema(createRecipeSchema, { 
        name: 'Test', 
        saltPct: 0 
      });
      expect(error).toBeUndefined();
    });

    it('should accept 10% salt', () => {
      const { error } = testSchema(createRecipeSchema, { 
        name: 'Test', 
        saltPct: 10 
      });
      expect(error).toBeUndefined();
    });

    it('should reject 10.1% salt', () => {
      const { error } = testSchema(createRecipeSchema, { 
        name: 'Test', 
        saltPct: 10.1 
      });
      expect(error).toBeDefined();
    });
  });

  describe('Total Weight Boundaries', () => {
    it('should accept 1g weight', () => {
      const { error } = testSchema(createRecipeSchema, { 
        name: 'Test', 
        totalWeight: 1 
      });
      expect(error).toBeUndefined();
    });

    it('should accept 100,000g weight', () => {
      const { error } = testSchema(createRecipeSchema, { 
        name: 'Test', 
        totalWeight: 100000 
      });
      expect(error).toBeUndefined();
    });

    it('should reject 100,001g weight', () => {
      const { error } = testSchema(createRecipeSchema, { 
        name: 'Test', 
        totalWeight: 100001 
      });
      expect(error).toBeDefined();
    });

    it('should reject 0g weight', () => {
      const { error } = testSchema(createRecipeSchema, { 
        name: 'Test', 
        totalWeight: 0 
      });
      expect(error).toBeDefined();
    });
  });
});
