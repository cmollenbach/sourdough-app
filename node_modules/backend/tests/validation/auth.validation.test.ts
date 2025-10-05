/**
 * Integration Tests for Auth Route Validation
 * 
 * Tests validation middleware on authentication endpoints
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
import { validateBody } from '../../src/middleware/validation';
import { registerSchema, loginSchema, googleOAuthSchema } from '../../src/validation/authSchemas';

describe('Auth Validation - Register', () => {
  const app = createTestApp('post', '/register', [validateBody(registerSchema)]);

  describe('Valid Input', () => {
    it('should accept valid email and password', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: testData.validEmail,
          password: testData.validPassword,
        });

      assertions.isSuccess(response);
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: testData.validPassword,
        });

      assertions.isSuccess(response);
      expect(response.body.body.email).toBe('test@example.com');
    });

    it('should trim whitespace from email', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: '  test@example.com  ',
          password: testData.validPassword,
        });

      assertions.isSuccess(response);
      expect(response.body.body.email).toBe('test@example.com');
    });

    it('should accept password at minimum length (8 chars)', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: testData.validEmail,
          password: '12345678', // Exactly 8 chars
        });

      assertions.isSuccess(response);
    });

    it('should accept password at maximum length (128 chars)', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: testData.validEmail,
          password: 'a'.repeat(128),
        });

      assertions.isSuccess(response);
    });
  });

  describe('Invalid Email', () => {
    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          password: testData.validPassword,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'email');
      expect(getFieldErrorMessage(response, 'email')).toContain('required');
    });

    it('should reject empty email', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: '',
          password: testData.validPassword,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'email');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: testData.invalidEmail,
          password: testData.validPassword,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'email');
      expect(getFieldErrorMessage(response, 'email')).toContain('valid email');
    });

    it('should reject email exceeding max length (255 chars)', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com'; // >255 chars
      const response = await request(app)
        .post('/register')
        .send({
          email: longEmail,
          password: testData.validPassword,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'email');
    });
  });

  describe('Invalid Password', () => {
    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: testData.validEmail,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'password');
      expect(getFieldErrorMessage(response, 'password')).toContain('required');
    });

    it('should reject empty password', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: testData.validEmail,
          password: '',
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'password');
    });

    it('should reject password too short (< 8 chars)', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: testData.validEmail,
          password: testData.shortPassword, // 'short' = 5 chars
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'password');
      expect(getFieldErrorMessage(response, 'password')).toContain('at least 8 characters');
    });

    it('should reject password too long (> 128 chars)', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: testData.validEmail,
          password: testData.longPassword, // 129 chars
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'password');
      expect(getFieldErrorMessage(response, 'password')).toContain('128 characters');
    });
  });

  describe('Multiple Errors', () => {
    it('should return all validation errors at once', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: testData.invalidEmail,
          password: testData.shortPassword,
        });

      assertions.isValidationError(response);
      assertions.hasErrorCount(response, 2);
      assertions.hasFieldError(response, 'email');
      assertions.hasFieldError(response, 'password');
    });

    it('should return errors for all missing fields', async () => {
      const response = await request(app)
        .post('/register')
        .send({});

      assertions.isValidationError(response);
      assertions.hasErrorCount(response, 2);
      assertions.hasFieldError(response, 'email');
      assertions.hasFieldError(response, 'password');
    });
  });

  describe('Unknown Fields', () => {
    it('should strip unknown fields (stripUnknown: true)', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: testData.validEmail,
          password: testData.validPassword,
          unknownField: 'should be removed',
          anotherUnknown: 123,
        });

      assertions.isSuccess(response);
      expect(response.body.body.unknownField).toBeUndefined();
      expect(response.body.body.anotherUnknown).toBeUndefined();
      expect(response.body.body.email).toBe(testData.validEmail);
      expect(response.body.body.password).toBe(testData.validPassword);
    });
  });
});

describe('Auth Validation - Login', () => {
  const app = createTestApp('post', '/login', [validateBody(loginSchema)]);

  describe('Valid Input', () => {
    it('should accept valid email and password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: testData.validEmail,
          password: testData.validPassword,
        });

      assertions.isSuccess(response);
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: testData.validPassword,
        });

      assertions.isSuccess(response);
      expect(response.body.body.email).toBe('test@example.com');
    });

    it('should accept any password length (for login)', async () => {
      // Login doesn't validate password length (only register does)
      const response = await request(app)
        .post('/login')
        .send({
          email: testData.validEmail,
          password: 'short',
        });

      assertions.isSuccess(response);
    });
  });

  describe('Invalid Email', () => {
    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          password: testData.validPassword,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'email');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: testData.invalidEmail,
          password: testData.validPassword,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'email');
    });
  });

  describe('Invalid Password', () => {
    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: testData.validEmail,
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'password');
    });

    it('should reject empty password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: testData.validEmail,
          password: '',
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'password');
    });
  });
});

describe('Auth Validation - Google OAuth', () => {
  const app = createTestApp('post', '/oauth/google', [validateBody(googleOAuthSchema)]);

  describe('Valid Input', () => {
    it('should accept valid idToken', async () => {
      const response = await request(app)
        .post('/oauth/google')
        .send({
          idToken: 'valid-google-id-token-string',
        });

      assertions.isSuccess(response);
    });
  });

  describe('Invalid Input', () => {
    it('should reject missing idToken', async () => {
      const response = await request(app)
        .post('/oauth/google')
        .send({});

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'idToken');
      expect(getFieldErrorMessage(response, 'idToken')).toContain('required');
    });

    it('should reject empty idToken', async () => {
      const response = await request(app)
        .post('/oauth/google')
        .send({
          idToken: '',
        });

      assertions.isValidationError(response);
      assertions.hasFieldError(response, 'idToken');
    });
  });

  describe('Unknown Fields', () => {
    it('should strip unknown fields', async () => {
      const response = await request(app)
        .post('/oauth/google')
        .send({
          idToken: 'valid-token',
          unknownField: 'should be removed',
        });

      assertions.isSuccess(response);
      expect(response.body.body.unknownField).toBeUndefined();
      expect(response.body.body.idToken).toBe('valid-token');
    });
  });
});
