/**
 * User Profile Workflow Tests
 * 
 * Tests complete user profile management workflows including:
 * - Profile creation and retrieval
 * - Profile updates
 * - User action tracking
 * - Experience level progression
 * - Preferences management (structured and complex)
 * 
 * Workflows covered:
 * - View user profile (auto-creation)
 * - Update user profile
 * - Track user actions
 * - Experience level progression
 * - View and update preferences
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../../src/routes/auth';
import userProfileRoutes from '../../src/routes/userProfile';
import { errorHandler } from '../../src/middleware/errorHandler';
import { seedEssentialData } from '../helpers/seedTestData';
import prisma from '../../src/lib/prisma';

describe('User Profile Workflows', () => {
  let app: express.Application;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // Create Express app
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/userProfile', userProfileRoutes);
    app.use(errorHandler);

    // Seed essential data
    await seedEssentialData();
  });

  beforeEach(async () => {
    // Create test user
    const email = `workflow-profile-${Date.now()}@example.com`;
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'TestPassword123!' });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;

    // Clean up any existing test profile data
    await prisma.userAction.deleteMany({ where: { userId } });
    await prisma.userPreference.deleteMany({ where: { userId } });
    await prisma.userProfile.deleteMany({ where: { userId } });
  });

  describe('Profile Creation and Retrieval Workflow', () => {
    it('should auto-create profile on first access', async () => {
      // Step 1: Get profile (should auto-create)
      const getProfileResponse = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getProfileResponse.status).toBe(200);
      expect(getProfileResponse.body).toHaveProperty('userId', userId);
      expect(getProfileResponse.body).toHaveProperty('displayName', 'Baker');
      expect(getProfileResponse.body).toHaveProperty('experienceLevel', 'beginner');
      expect(getProfileResponse.body).toHaveProperty('recipesCreated', 0);
      expect(getProfileResponse.body).toHaveProperty('bakesCompleted', 0);
    });

    it('should retrieve existing profile', async () => {
      // Step 1: Create profile by accessing it
      await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Step 2: Retrieve profile again
      const getProfileResponse = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getProfileResponse.status).toBe(200);
      expect(getProfileResponse.body.userId).toBe(userId);
      expect(getProfileResponse.body).toHaveProperty('actions');
      expect(Array.isArray(getProfileResponse.body.actions)).toBe(true);
    });
  });

  describe('Profile Update Workflow', () => {
    it('should allow user to update profile information', async () => {
      // Step 1: Get initial profile
      const initialProfile = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(initialProfile.body.displayName).toBe('Baker');

      // Step 2: Update profile
      const updateResponse = await request(app)
        .put('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Master Baker',
          avatarUrl: 'https://example.com/avatar.jpg',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.displayName).toBe('Master Baker');
      expect(updateResponse.body.avatarUrl).toBe('https://example.com/avatar.jpg');

      // Step 3: Verify update persisted
      const verifyResponse = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(verifyResponse.body.displayName).toBe('Master Baker');
      expect(verifyResponse.body.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should update lastActiveAt on profile update', async () => {
      // Get initial profile
      const initialProfile = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      const initialLastActive = new Date(initialProfile.body.lastActiveAt);

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update profile
      const updateResponse = await request(app)
        .put('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Updated Name',
        });

      expect(updateResponse.status).toBe(200);
      const updatedLastActive = new Date(updateResponse.body.lastActiveAt);
      expect(updatedLastActive.getTime()).toBeGreaterThan(initialLastActive.getTime());
    });
  });

  describe('User Action Tracking Workflow', () => {
    it('should track recipe creation action and update stats', async () => {
      // Step 1: Get initial profile
      const initialProfile = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      const initialRecipesCreated = initialProfile.body.recipesCreated || 0;

      // Step 2: Track recipe creation action
      const actionResponse = await request(app)
        .post('/api/userProfile/actions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          action: 'recipe_created',
          details: { recipeId: 123, recipeName: 'Test Recipe' },
        });

      expect(actionResponse.status).toBe(200);
      expect(actionResponse.body).toHaveProperty('id');
      expect(actionResponse.body.action).toBe('recipe_created');

      // Step 3: Verify profile stats updated
      const updatedProfile = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(updatedProfile.body.recipesCreated).toBe(initialRecipesCreated + 1);
    });

    it('should track bake completion action with duration', async () => {
      // Get initial profile
      const initialProfile = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      const initialBakesCompleted = initialProfile.body.bakesCompleted || 0;
      const initialTotalTime = initialProfile.body.totalBakeTimeMinutes || 0;

      // Track bake completion
      const actionResponse = await request(app)
        .post('/api/userProfile/actions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          action: 'bake_completed',
          details: { bakeId: 456, durationMinutes: 120 },
        });

      expect(actionResponse.status).toBe(200);

      // Verify stats updated
      const updatedProfile = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(updatedProfile.body.bakesCompleted).toBe(initialBakesCompleted + 1);
      expect(updatedProfile.body.totalBakeTimeMinutes).toBe(initialTotalTime + 120);
    });

    it('should track advanced feature usage', async () => {
      // Get initial profile
      const initialProfile = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      const initialFeatures = initialProfile.body.advancedFeaturesUsed || [];

      // Track advanced feature
      const actionResponse = await request(app)
        .post('/api/userProfile/actions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          action: 'advanced_feature',
          details: { feature: 'custom_parameters' },
        });

      expect(actionResponse.status).toBe(200);

      // Verify feature added
      const updatedProfile = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(updatedProfile.body.advancedFeaturesUsed).toContain('custom_parameters');
    });
  });

  describe('Experience Level Progression Workflow', () => {
    it('should progress from beginner to intermediate after 5 activities', async () => {
      // Get initial profile
      const initialProfile = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(initialProfile.body.experienceLevel).toBe('beginner');

      // Create 5 activities (recipes + bakes)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/userProfile/actions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ action: 'recipe_created' });
      }

      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/api/userProfile/actions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ action: 'bake_completed' });
      }

      // Verify level progression
      const updatedProfile = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(updatedProfile.body.experienceLevel).toBe('intermediate');
    });

    it('should progress from intermediate to advanced after 20 total activities', async () => {
      // Set user to intermediate level
      await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          displayName: 'Baker',
          experienceLevel: 'intermediate',
          recipesCreated: 10,
          bakesCompleted: 5,
        },
        update: {
          experienceLevel: 'intermediate',
          recipesCreated: 10,
          bakesCompleted: 5,
        },
      });

      // Add 5 more activities to reach 20 total
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/userProfile/actions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ action: 'recipe_created' });
      }

      // Verify level progression
      const updatedProfile = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(updatedProfile.body.experienceLevel).toBe('advanced');
    });
  });

  describe('Preferences Management Workflow', () => {
    it('should retrieve user preferences', async () => {
      // Step 1: Create profile first (preferences endpoint requires existing profile)
      await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Step 2: Get preferences
      const getPrefsResponse = await request(app)
        .get('/api/userProfile/preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getPrefsResponse.status).toBe(200);
      expect(getPrefsResponse.body).toHaveProperty('showAdvancedFields');
      expect(getPrefsResponse.body).toHaveProperty('autoSaveEnabled');
      expect(getPrefsResponse.body).toHaveProperty('defaultHydration');
      expect(getPrefsResponse.body).toHaveProperty('preferredSaltPct');
    });

    it('should update structured preferences', async () => {
      // Step 1: Create profile first
      await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Step 2: Update structured preferences
      const updateResponse = await request(app)
        .put('/api/userProfile/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          showAdvancedFields: true,
          autoSaveEnabled: false,
          defaultHydration: 80.0,
          preferredSaltPct: 2.5,
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);

      // Step 2: Verify preferences updated
      const getPrefsResponse = await request(app)
        .get('/api/userProfile/preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getPrefsResponse.body.showAdvancedFields).toBe(true);
      expect(getPrefsResponse.body.autoSaveEnabled).toBe(false);
      expect(getPrefsResponse.body.defaultHydration).toBe(80.0);
      expect(getPrefsResponse.body.preferredSaltPct).toBe(2.5);
    });

    it('should update complex preferences', async () => {
      // Step 1: Create profile first
      await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Step 2: Update complex preferences
      const updateResponse = await request(app)
        .put('/api/userProfile/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: 'dark',
          language: 'en',
          notifications: JSON.stringify({ email: true, push: false }),
        });

      expect(updateResponse.status).toBe(200);

      // Step 3: Verify complex preferences saved
      const getPrefsResponse = await request(app)
        .get('/api/userProfile/preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getPrefsResponse.status).toBe(200);
      expect(getPrefsResponse.body.theme).toBe('dark');
      expect(getPrefsResponse.body.language).toBe('en');
      expect(getPrefsResponse.body.notifications).toBeTruthy();
    });

    it('should update both structured and complex preferences together', async () => {
      // Step 1: Create profile first
      await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Step 2: Update both types
      const updateResponse = await request(app)
        .put('/api/userProfile/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          showAdvancedFields: true,
          defaultHydration: 75.0,
          customSetting: 'custom_value',
        });

      expect(updateResponse.status).toBe(200);

      // Verify both updated
      const getPrefsResponse = await request(app)
        .get('/api/userProfile/preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getPrefsResponse.body.showAdvancedFields).toBe(true);
      expect(getPrefsResponse.body.defaultHydration).toBe(75.0);
      expect(getPrefsResponse.body.customSetting).toBe('custom_value');
    });
  });

  describe('Action History Workflow', () => {
    it('should include recent actions in profile', async () => {
      // Create several actions
      await request(app)
        .post('/api/userProfile/actions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'recipe_created' });

      await request(app)
        .post('/api/userProfile/actions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'bake_completed' });

      // Get profile with actions
      const profileResponse = await request(app)
        .get('/api/userProfile/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body).toHaveProperty('actions');
      expect(Array.isArray(profileResponse.body.actions)).toBe(true);
      expect(profileResponse.body.actions.length).toBeGreaterThanOrEqual(2);

      // Verify actions are ordered by timestamp (most recent first)
      if (profileResponse.body.actions.length > 1) {
        const timestamps = profileResponse.body.actions.map((a: any) => new Date(a.timestamp).getTime());
        for (let i = 0; i < timestamps.length - 1; i++) {
          expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
        }
      }
    });
  });
});

