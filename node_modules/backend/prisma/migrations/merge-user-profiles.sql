// Phase 1: Merge User Profile Models - High Impact Simplification
// backend/prisma/migrations/merge-user-profiles.sql

-- PHASE 1: MERGE USER PROFILES FOR IMMEDIATE SIMPLIFICATION

-- Step 1: Add experience fields to existing UserProfile table
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "experienceLevel" VARCHAR(20) DEFAULT 'beginner';
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "recipesCreated" INTEGER DEFAULT 0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "bakesCompleted" INTEGER DEFAULT 0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "totalBakeTimeMinutes" INTEGER DEFAULT 0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "advancedFeaturesUsed" TEXT[] DEFAULT '{}';
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "preferredDifficulty" VARCHAR(20);
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "averageSessionMinutes" INTEGER DEFAULT 0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP DEFAULT NOW();

-- Step 2: Add structured preference fields to replace JSON blob
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "showAdvancedFields" BOOLEAN DEFAULT false;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "autoSaveEnabled" BOOLEAN DEFAULT true;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "defaultHydration" DECIMAL(5,2) DEFAULT 75.0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "preferredSaltPct" DECIMAL(4,2) DEFAULT 2.0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "expandStepsOnLoad" BOOLEAN DEFAULT false;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "showIngredientHelp" BOOLEAN DEFAULT true;

-- Step 3: Migrate data from UserExperienceProfile to UserProfile (if both exist)
UPDATE "UserProfile" SET 
  "experienceLevel" = COALESCE(exp."experienceLevel", 'beginner'),
  "recipesCreated" = COALESCE(exp."recipesCreated", 0),
  "bakesCompleted" = COALESCE(exp."bakesCompleted", 0),
  "totalBakeTimeMinutes" = COALESCE(exp."totalBakeTimeMinutes", 0),
  "advancedFeaturesUsed" = COALESCE(exp."advancedFeaturesUsed", '{}'),
  "preferredDifficulty" = exp."preferredDifficulty",
  "averageSessionMinutes" = COALESCE(exp."averageSessionMinutes", 0),
  "lastActiveAt" = COALESCE(exp."lastActiveAt", NOW())
FROM "UserExperienceProfile" exp 
WHERE "UserProfile"."userId" = exp."userId";

-- Step 4: Update foreign key references from UserExperienceProfile to UserProfile
-- Update UserAction table
ALTER TABLE "UserAction" ADD COLUMN IF NOT EXISTS "userProfileId" INTEGER;

UPDATE "UserAction" SET "userProfileId" = up."id"
FROM "UserProfile" up
WHERE "UserAction"."userId" = up."userId";

-- Update UserPreference table  
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "userProfileId" INTEGER;

UPDATE "UserPreference" SET "userProfileId" = up."id" 
FROM "UserProfile" up
WHERE "UserPreference"."userId" = up."userId";

-- Step 5: Drop old foreign key constraints and add new ones
-- (This would be in a proper Prisma migration with proper constraint names)

-- Step 6: Remove UserExperienceProfile table (after verifying data migration)
-- DROP TABLE IF EXISTS "UserExperienceProfile"; -- Uncomment after verification

-- IMMEDIATE BENEFITS:
-- ✅ Eliminates duplicate user profile storage
-- ✅ Reduces API complexity (single profile endpoint)
-- ✅ Simplifies frontend store management
-- ✅ Better performance (fewer table joins)
-- ✅ Clearer data model for developers
