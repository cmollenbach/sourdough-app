-- Database Simplification Phase 1: Merge User Profiles & Remove Complexity
-- This migration implements the cleanup recommendations from simplified-schema-cleanup.sql

-- STEP 1: Add experience tracking fields to UserProfile (merge from UserExperienceProfile)
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "experienceLevel" VARCHAR(20) DEFAULT 'beginner';
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "recipesCreated" INTEGER DEFAULT 0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "bakesCompleted" INTEGER DEFAULT 0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "totalBakeTimeMinutes" INTEGER DEFAULT 0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "advancedFeaturesUsed" TEXT[] DEFAULT '{}';
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "preferredDifficulty" VARCHAR(20);
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "averageSessionMinutes" INTEGER DEFAULT 0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- STEP 2: Add structured preference fields (replace JSON blob approach)
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "showAdvancedFields" BOOLEAN DEFAULT false;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "autoSaveEnabled" BOOLEAN DEFAULT true;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "defaultHydration" DECIMAL(5,2) DEFAULT 75.0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "preferredSaltPct" DECIMAL(4,2) DEFAULT 2.0;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "expandStepsOnLoad" BOOLEAN DEFAULT false;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "showIngredientHelp" BOOLEAN DEFAULT true;

-- Add createdAt and updatedAt with defaults for existing rows
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- STEP 3: Migrate data from UserExperienceProfile to UserProfile
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

-- STEP 4: Update foreign key references to point to UserProfile instead of UserExperienceProfile
-- Add temporary column to UserAction for new reference
ALTER TABLE "UserAction" ADD COLUMN IF NOT EXISTS "userProfileId" INTEGER;

-- Update UserAction to reference UserProfile
UPDATE "UserAction" SET "userProfileId" = up."id"
FROM "UserProfile" up
WHERE "UserAction"."userId" = up."userId";

-- Add temporary column to UserPreference for new reference  
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "userProfileId" INTEGER;

-- Update UserPreference to reference UserProfile
UPDATE "UserPreference" SET "userProfileId" = up."id" 
FROM "UserProfile" up
WHERE "UserPreference"."userId" = up."userId";

-- STEP 5: Remove complexity fields from parameter system (as recommended)
-- Remove rarely used fields from StepParameter
ALTER TABLE "StepParameter" DROP COLUMN IF EXISTS "active";
ALTER TABLE "StepParameter" DROP COLUMN IF EXISTS "order";
ALTER TABLE "StepParameter" DROP COLUMN IF EXISTS "visible";

-- Remove rarely used fields from StepType
ALTER TABLE "StepType" DROP COLUMN IF EXISTS "order";

-- Remove rarely used fields from IngredientCategory
ALTER TABLE "IngredientCategory" DROP COLUMN IF EXISTS "order";

-- Remove complexity from Ingredient table
ALTER TABLE "Ingredient" DROP COLUMN IF EXISTS "order";
ALTER TABLE "Ingredient" DROP COLUMN IF EXISTS "defaultValue";
ALTER TABLE "Ingredient" DROP COLUMN IF EXISTS "visible";

-- STEP 6: Simplify StepTemplateIngredientRule (remove rarely used fields)
ALTER TABLE "StepTemplateIngredientRule" DROP COLUMN IF EXISTS "active";
ALTER TABLE "StepTemplateIngredientRule" DROP COLUMN IF EXISTS "visible";
ALTER TABLE "StepTemplateIngredientRule" DROP COLUMN IF EXISTS "description";
ALTER TABLE "StepTemplateIngredientRule" DROP COLUMN IF EXISTS "defaultValue";

-- STEP 7: Create indexes for better performance on merged profile
CREATE INDEX IF NOT EXISTS "idx_user_profile_experience_level" ON "UserProfile"("experienceLevel");
CREATE INDEX IF NOT EXISTS "idx_user_profile_last_active" ON "UserProfile"("lastActiveAt");
CREATE INDEX IF NOT EXISTS "idx_user_action_user_profile" ON "UserAction"("userProfileId");
CREATE INDEX IF NOT EXISTS "idx_user_preference_user_profile" ON "UserPreference"("userProfileId");

-- STEP 8: Add foreign key constraints for new references
ALTER TABLE "UserAction" ADD CONSTRAINT "fk_user_action_user_profile" 
  FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE;

ALTER TABLE "UserPreference" ADD CONSTRAINT "fk_user_preference_user_profile" 
  FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE;

-- NOTE: UserExperienceProfile table cleanup will be done in a separate migration
-- after verifying all data has been successfully migrated and applications updated

-- BENEFITS OF THIS MIGRATION:
-- ✅ Unified user profile system (no more dual profile management)
-- ✅ Structured preferences instead of JSON blob approach  
-- ✅ Removed ~15 unused complexity fields
-- ✅ Better performance with proper indexes
-- ✅ Simplified API surface (single profile endpoint needed)
-- ✅ Easier frontend state management (single user store)