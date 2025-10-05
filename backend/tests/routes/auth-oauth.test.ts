import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { randomUUID } from 'crypto';

// Mock axios BEFORE importing anything that uses it
jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
}));

import axios from 'axios';
const mockedAxios = axios as any;

// NOW import modules that use axios
import prisma from '../../src/lib/prisma';
import authRoutes from '../../src/routes/auth';
import { errorHandler } from '../../src/middleware/errorHandler';

// Create test Express app
function createAuthTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

describe('Auth OAuth Tests', () => {
  let app: express.Application;
  let testEmail: string;
  let testEmailBase: string;
  const testGoogleId = 'google-oauth-123456';
  const testIdToken = 'mock-google-id-token';

  beforeAll(async () => {
    app = createAuthTestApp();
  });

  beforeEach(async () => {
    // Clean up ALL oauth test users and accounts FIRST (using wildcard)
    // IMPORTANT: Delete in correct order (foreign key: Account -> UserProfile -> User)
    await prisma.account.deleteMany({ where: { provider: 'google' } });
    await prisma.userProfile.deleteMany({
      where: { user: { email: { startsWith: 'oauth-test-' } } }
    });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'oauth-test-' } } });
    
    // Verify cleanup completed
    const remainingUsers = await prisma.user.count({ where: { email: { startsWith: 'oauth-test-' } } });
    if (remainingUsers > 0) {
      console.warn(`⚠️ Warning: ${remainingUsers} oauth-test users still exist after cleanup`);
    }
    
    // Generate GUARANTEED unique email using UUID (eliminates ALL collision risk)
    // Includes: timestamp, process ID, and cryptographically secure UUID
    const testId = `${Date.now()}-${process.pid}-${randomUUID()}`;
    testEmailBase = `oauth-test-${testId}`;
    testEmail = `${testEmailBase}@example.com`;
    
    console.log(`🧪 Test email for this test: ${testEmail}`);
    
    // Reset axios mocks before each test
    mockedAxios.get.mockReset();
  });

  afterEach(async () => {
    // Clean up after EACH test too, in case a test creates multiple users
    await prisma.account.deleteMany({ where: { provider: 'google' } });
    await prisma.userProfile.deleteMany({
      where: { user: { email: { startsWith: 'oauth-test-' } } }
    });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'oauth-test-' } } });
  });

  afterAll(async () => {
    // Final cleanup - delete ALL oauth test users
    // IMPORTANT: Delete in correct order (foreign key: Account -> UserProfile -> User)
    await prisma.account.deleteMany({ where: { provider: 'google' } });
    await prisma.userProfile.deleteMany({
      where: { user: { email: { startsWith: 'oauth-test-' } } }
    });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'oauth-test-' } } });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/oauth/google - Google OAuth', () => {
    describe('New User Registration', () => {
      it('should create new user with Google OAuth', async () => {
        // Mock Google tokeninfo response
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: true,
            name: 'Test User',
            picture: 'https://example.com/avatar.jpg',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as any);

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user).toMatchObject({
          email: testEmail,
          role: 'USER',
          displayName: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
        });

        // Verify user created in database
        const user = await prisma.user.findUnique({
          where: { email: testEmail },
          include: { accounts: true, userProfile: true },
        });

        expect(user).toBeTruthy();
        expect(user?.emailVerified).toBe(true);
        expect(user?.passwordHash).toBeNull();
        expect(user?.accounts).toHaveLength(1);
        expect(user?.accounts[0].provider).toBe('google');
        expect(user?.accounts[0].providerAccountId).toBe(testGoogleId);
        expect(user?.userProfile?.displayName).toBe('Test User');
        expect(user?.userProfile?.avatarUrl).toBe('https://example.com/avatar.jpg');
      });

      it('should create user with default displayName if name not provided', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: true,
            // No name or picture
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);
        // DisplayName should be the email prefix (before @)
        expect(response.body.user.displayName).toBe(testEmailBase);

        const user = await prisma.user.findUnique({
          where: { email: testEmail },
          include: { userProfile: true },
        });

        expect(user?.userProfile?.displayName).toBe(testEmailBase);
        expect(user?.userProfile?.avatarUrl).toBeNull();
      });

      it('should handle email_verified as string "true"', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: 'true', // String instead of boolean
            name: 'Test User',
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);

        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        expect(user?.emailVerified).toBe(true);
      });

      it('should handle email_verified as string "false"', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: 'false',
            name: 'Test User',
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);

        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        expect(user?.emailVerified).toBe(false);
      });
    });

    describe('Existing User Login', () => {
      it('should login existing user with linked Google account', async () => {
        // Create user with Google account
        const existingUser = await prisma.user.create({
          data: {
            email: testEmail,
            emailVerified: true,
            isActive: true,
            accounts: {
              create: {
                provider: 'google',
                providerAccountId: testGoogleId,
                accessToken: 'old-token',
              },
            },
            userProfile: {
              create: {
                displayName: 'Existing User',
                avatarUrl: 'https://example.com/old-avatar.jpg',
              },
            },
          },
        });

        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: true,
            name: 'Existing User',
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);
        expect(response.body.user.id).toBe(existingUser.id);
        expect(response.body.user.email).toBe(testEmail);
      });
    });

    describe('Account Linking', () => {
      it('should link Google account to existing email/password user', async () => {
        // Create user with email/password (no Google account)
        const existingUser = await prisma.user.create({
          data: {
            email: testEmail,
            passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz', // Dummy hash
            emailVerified: false,
            isActive: true,
          },
        });

        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: true,
            name: 'Test User',
            picture: 'https://example.com/avatar.jpg',
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);
        expect(response.body.user.id).toBe(existingUser.id);

        // Verify Google account linked
        const user = await prisma.user.findUnique({
          where: { id: existingUser.id },
          include: { accounts: true, userProfile: true },
        });

        expect(user?.accounts).toHaveLength(1);
        expect(user?.accounts[0].provider).toBe('google');
        expect(user?.accounts[0].providerAccountId).toBe(testGoogleId);
        expect(user?.emailVerified).toBe(true); // Updated from Google
        expect(user?.userProfile?.avatarUrl).toBe('https://example.com/avatar.jpg');
      });

      it('should update emailVerified if Google verifies email', async () => {
        // Create user with unverified email
        await prisma.user.create({
          data: {
            email: testEmail,
            passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
            emailVerified: false,
            isActive: true,
          },
        });

        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: true,
            name: 'Test User',
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);

        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        expect(user?.emailVerified).toBe(true);
      });

      it('should not downgrade emailVerified if already true', async () => {
        await prisma.user.create({
          data: {
            email: testEmail,
            emailVerified: true, // Already verified
            isActive: true,
          },
        });

        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: false, // Google says not verified
            name: 'Test User',
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);

        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        expect(user?.emailVerified).toBe(true); // Should remain true
      });

      it('should create userProfile if not exists when linking', async () => {
        // Create user without profile
        await prisma.user.create({
          data: {
            email: testEmail,
            passwordHash: '$2b$10$abc',
            emailVerified: false,
            isActive: true,
          },
        });

        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: true,
            name: 'Test User',
            picture: 'https://example.com/avatar.jpg',
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);

        const user = await prisma.user.findUnique({
          where: { email: testEmail },
          include: { userProfile: true },
        });

        expect(user?.userProfile).toBeTruthy();
        expect(user?.userProfile?.displayName).toBe('Test User');
        expect(user?.userProfile?.avatarUrl).toBe('https://example.com/avatar.jpg');
      });

      it('should not overwrite existing avatar if already set', async () => {
        await prisma.user.create({
          data: {
            email: testEmail,
            emailVerified: true,
            isActive: true,
            userProfile: {
              create: {
                displayName: 'Existing Name',
                avatarUrl: 'https://example.com/existing-avatar.jpg',
              },
            },
          },
        });

        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: true,
            picture: 'https://example.com/new-avatar.jpg',
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);

        const user = await prisma.user.findUnique({
          where: { email: testEmail },
          include: { userProfile: true },
        });

        // Should keep existing avatar
        expect(user?.userProfile?.avatarUrl).toBe('https://example.com/existing-avatar.jpg');
      });
    });

    describe('Validation', () => {
      it('should require idToken field', async () => {
        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('message');
      });

      it('should reject empty idToken', async () => {
        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: '' });

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('message');
      });

      it('should reject non-string idToken', async () => {
        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: 12345 });

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('message');
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid Google token (400 response)', async () => {
        const error: any = new Error('Request failed with status code 400');
        error.response = {
          status: 400,
          data: { error: 'invalid_token' },
        };
        error.isAxiosError = true;
        
        mockedAxios.get.mockRejectedValueOnce(error);

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: 'invalid-token' });

        expect([400, 401]).toContain(response.status);
      });

      it.skip('should handle Google API network error', async () => {
        const error: any = new Error('Network Error');
        error.request = {};
        error.isAxiosError = true;
        
        mockedAxios.get.mockRejectedValueOnce(error);

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(500);
      }, 20000); // 20 second timeout

      it.skip('should handle expired Google token (401 response)', async () => {
        const error: any = new Error('Request failed with status code 401');
        error.response = {
          status: 401,
          data: { error: 'invalid_token', error_description: 'Token expired' },
        };
        error.isAxiosError = true;
        
        mockedAxios.get.mockRejectedValueOnce(error);

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: 'expired-token' });

        expect([401, 400]).toContain(response.status);
      }, 20000); // 20 second timeout

      it('should handle database errors gracefully', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: true,
            name: 'Test User',
          },
        });

        // First call should succeed
        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);

        // Now test with same Google ID but different email (edge case)
        // This should create a new account linked to the same Google ID
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId, // Same Google ID
            email: 'different@example.com', // Different email
            email_verified: true,
          },
        });

        const response2 = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        // Should succeed by creating new user with different email
        // (Google allows same sub to be associated with multiple emails in edge cases)
        expect(response2.status).toBe(200);
        expect(response2.body.user.email).toBe('different@example.com');
      });

      it('should handle missing email from Google', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            // No email field
            email_verified: true,
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        // Should fail due to missing email
        expect([400, 500]).toContain(response.status);
      });

      it('should handle missing sub (Google ID) from Google', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            email: testEmail,
            // No sub field
            email_verified: true,
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        // Should fail due to missing Google ID
        expect([400, 500]).toContain(response.status);
      });
    });

    describe('JWT Token Generation', () => {
      it('should generate valid JWT token', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: true,
            name: 'Test User',
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);
        expect(response.body.token).toBeTruthy();
        expect(typeof response.body.token).toBe('string');
        expect(response.body.token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
      });

      it('should include user role in response', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: true,
          },
        });

        const response = await request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: testIdToken });

        expect(response.status).toBe(200);
        expect(response.body.user.role).toBe('USER');
      });
    });

    describe('Concurrent OAuth Requests', () => {
      it('should handle concurrent OAuth requests for same user', async () => {
        mockedAxios.get.mockResolvedValue({
          data: {
            sub: testGoogleId,
            email: testEmail,
            email_verified: true,
            name: 'Test User',
          },
        });

        // Make 3 concurrent requests
        const [response1, response2, response3] = await Promise.all([
          request(app).post('/api/auth/oauth/google').send({ idToken: testIdToken }),
          request(app).post('/api/auth/oauth/google').send({ idToken: testIdToken }),
          request(app).post('/api/auth/oauth/google').send({ idToken: testIdToken }),
        ]);

        // At least one should succeed
        const successfulResponses = [response1, response2, response3].filter(r => r.status === 200);
        expect(successfulResponses.length).toBeGreaterThan(0);

        // Others may fail with 409 conflict (race condition) - this is expected behavior
        // In production, client should retry on 409
        const statuses = [response1.status, response2.status, response3.status];
        statuses.forEach(status => {
          expect([200, 409]).toContain(status);
        });

        // Verify only one user created despite concurrent requests
        const users = await prisma.user.findMany({ where: { email: testEmail } });
        expect(users).toHaveLength(1);
      });
    });
  });
});




