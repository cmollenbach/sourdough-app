// Updated User Experience API Routes for Simplified Schema
// backend/src/routes/userProfile.ts

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get unified user profile (includes experience + preferences)
router.get('/profile', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        actions: {
          take: 10,
          orderBy: { timestamp: 'desc' }
        },
        userPreferences: true
      }
    });

    if (!profile) {
      // Create default unified profile
      profile = await prisma.userProfile.create({
        data: {
          userId,
          displayName: 'Baker',
          experienceLevel: 'beginner',
          recipesCreated: 0,
          bakesCompleted: 0,
          totalBakeTimeMinutes: 0,
          advancedFeaturesUsed: [],
          averageSessionMinutes: 0,
          showAdvancedFields: false,
          autoSaveEnabled: true,
          defaultHydration: 75.0,
          preferredSaltPct: 2.0,
          expandStepsOnLoad: false,
          showIngredientHelp: true
        },
        include: {
          actions: true,
          userPreferences: true
        }
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update unified user profile
router.put('/profile', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updates = req.body;
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: 'Baker',
        ...updates
      },
      update: {
        ...updates,
        lastActiveAt: new Date()
      },
      include: {
        actions: {
          take: 10,
          orderBy: { timestamp: 'desc' }
        },
        userPreferences: true
      }
    });

    res.json(profile);
  } catch (error) {
    console.error('Failed to update user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Track user action (simplified)
router.post('/actions', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { action, details, sessionId } = req.body;

    // Get or create user profile
    let profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId,
          displayName: 'Baker',
          experienceLevel: 'beginner'
        }
      });
    }

    // Create the action
    const userAction = await prisma.userAction.create({
      data: {
        userId,
        profileId: profile.id,
        action,
        details,
        sessionId
      }
    });

    // Update profile stats based on action
    const updates: any = {
      lastActiveAt: new Date()
    };
    
    if (action === 'recipe_created') {
      updates.recipesCreated = { increment: 1 };
    } else if (action === 'bake_completed') {
      updates.bakesCompleted = { increment: 1 };
      if (details?.durationMinutes) {
        updates.totalBakeTimeMinutes = { increment: details.durationMinutes };
      }
    } else if (action === 'advanced_feature') {
      const feature = details?.feature || 'unknown';
      const currentFeatures = profile.advancedFeaturesUsed || [];
      if (!currentFeatures.includes(feature)) {
        updates.advancedFeaturesUsed = [...currentFeatures, feature];
      }
    }

    // Auto-level progression based on activity
    const totalActivity = (profile.recipesCreated + (updates.recipesCreated?.increment || 0)) + 
                         (profile.bakesCompleted + (updates.bakesCompleted?.increment || 0));
    
    if (totalActivity >= 20 && profile.experienceLevel === 'intermediate') {
      updates.experienceLevel = 'advanced';
    } else if (totalActivity >= 5 && profile.experienceLevel === 'beginner') {
      updates.experienceLevel = 'intermediate';
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await prisma.userProfile.update({
        where: { userId },
        data: updates
      });
    }

    res.json(userAction);
  } catch (error) {
    console.error('Failed to track user action:', error);
    res.status(500).json({ error: 'Failed to track user action' });
  }
});

// Get structured preferences (now part of profile)
router.get('/preferences', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        showAdvancedFields: true,
        autoSaveEnabled: true,
        defaultHydration: true,
        preferredSaltPct: true,
        expandStepsOnLoad: true,
        showIngredientHelp: true,
        userPreferences: true // Complex preferences
      }
    });

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Combine structured preferences with complex key-value preferences
    const structuredPrefs = {
      showAdvancedFields: profile.showAdvancedFields,
      autoSaveEnabled: profile.autoSaveEnabled,
      defaultHydration: profile.defaultHydration,
      preferredSaltPct: profile.preferredSaltPct,
      expandStepsOnLoad: profile.expandStepsOnLoad,
      showIngredientHelp: profile.showIngredientHelp
    };

    const complexPrefs = profile.userPreferences.reduce((acc, pref) => {
      acc[pref.key] = pref.value;
      return acc;
    }, {} as Record<string, string>);

    res.json({ ...structuredPrefs, ...complexPrefs });
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    res.status(500).json({ error: 'Failed to get user preferences' });
  }
});

// Update preferences (structured + complex)
router.put('/preferences', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const preferences = req.body;
    
    // Separate structured preferences from complex ones
    const structuredKeys = [
      'showAdvancedFields', 'autoSaveEnabled', 'defaultHydration',
      'preferredSaltPct', 'expandStepsOnLoad', 'showIngredientHelp'
    ];
    
    const structuredPrefs: any = {};
    const complexPrefs: any = {};
    
    Object.entries(preferences).forEach(([key, value]) => {
      if (structuredKeys.includes(key)) {
        structuredPrefs[key] = value;
      } else {
        complexPrefs[key] = value;
      }
    });

    // Update structured preferences in UserProfile
    if (Object.keys(structuredPrefs).length > 0) {
      await prisma.userProfile.update({
        where: { userId },
        data: {
          ...structuredPrefs,
          lastActiveAt: new Date()
        }
      });
    }

    // Update complex preferences in UserPreference table
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (profile && Object.keys(complexPrefs).length > 0) {
      const updates = Object.entries(complexPrefs).map(([key, value]) =>
        prisma.userPreference.upsert({
          where: {
            userId_key: { userId, key }
          },
          create: {
            userId,
            profileId: profile.id,
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value)
          },
          update: {
            value: typeof value === 'string' ? value : JSON.stringify(value)
          }
        })
      );

      await Promise.all(updates);
    }

    res.json({ success: true, updated: Object.keys(preferences).length });
  } catch (error) {
    console.error('Failed to update preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
