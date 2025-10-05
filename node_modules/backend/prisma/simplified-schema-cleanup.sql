// Simplified Database Schema - Cleanup Recommendations
// backend/prisma/simplified-schema-cleanup.sql

-- CLEANUP RECOMMENDATIONS FOR SOURDOUGH DATABASE

-- 1. MERGE USER PROFILES
-- Problem: UserProfile and UserExperienceProfile are redundant
-- Solution: Extend UserProfile to include experience tracking

/*
PROPOSED CHANGE: Modify UserProfile to include experience fields:

model UserProfile {
  id                     Int       @id @default(autoincrement())
  userId                 Int       @unique
  
  -- Basic Profile
  displayName            String
  avatarUrl              String?
  bio                    String?
  
  -- Experience Tracking (from UserExperienceProfile)
  experienceLevel        String    @default("beginner")
  recipesCreated         Int       @default(0)
  bakesCompleted         Int       @default(0)
  totalBakeTimeMinutes   Int       @default(0)
  advancedFeaturesUsed   String[]  @default([])
  preferredDifficulty    String?
  averageSessionMinutes  Int       @default(0)
  lastActiveAt           DateTime  @default(now())
  
  -- Structured Preferences (instead of JSON blob)
  showAdvancedFields     Boolean   @default(false)
  autoSaveEnabled        Boolean   @default(true)
  defaultHydration       Float     @default(75.0)
  preferredSaltPct       Float     @default(2.0)
  
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
  
  user                   User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  actions                UserAction[]
  preferences            UserPreference[] // Keep for complex preferences
}
*/

-- 2. SIMPLIFY PARAMETER SYSTEM
-- Problem: Overly complex parameter system with many unused fields
-- Current: StepParameter + StepTemplateParameter + RecipeStepParameterValue + BakeStepParameterValue

/*
PROPOSED SIMPLIFICATION:
- Remove 'advanced', 'active', 'visible', 'order' fields from StepParameter (use defaults)
- Merge StepTemplateParameter into StepTemplate as JSON field for simple cases
- Keep complex parameters for truly dynamic values only
*/

-- 3. REMOVE UNUSED ENUMS
-- Problem: Some enums may not be actively used

/*
POTENTIALLY UNUSED:
- DURATION in ParameterDataType (if not used)
- MODERATOR in UserRole (if only USER/ADMIN needed)
- Some EntityRequestType values if not implemented
*/

-- 4. CONSOLIDATE INGREDIENT RULES
-- Problem: StepTemplateIngredientRule has many optional fields that could be simplified

/*
SIMPLIFICATION:
model StepTemplateIngredientRule {
  id                   Int                @id @default(autoincrement())
  stepTemplateId       Int
  ingredientCategoryId Int
  required             Boolean            @default(false)
  advanced             Boolean            @default(false)
  helpText             String?
  
  -- Remove: description, active, visible, defaultValue (rarely used)
  
  stepTemplate         StepTemplate       @relation(fields: [stepTemplateId], references: [id])
  ingredientCategory   IngredientCategory @relation(fields: [ingredientCategoryId], references: [id])
}
*/

-- 5. SESSION CLEANUP
-- Problem: Account and Session tables may be over-engineered for current needs

/*
SIMPLIFICATION: If using simple authentication, consider:
- Remove Account table if not using OAuth providers
- Simplify Session to just: id, userId, sessionToken, expiresAt
*/

-- 6. BAKE TRACKING SIMPLIFICATION
-- Problem: Complex bake tracking that may not be fully utilized

/*
CONSIDER: If bake tracking is not actively used:
- Keep Bake table for basic tracking
- Remove BakeStep, BakeStepParameterValue, BakeStepIngredient if too complex
- Or simplify to just: Bake -> BakeNote (simple text tracking)
*/

-- MIGRATION STRATEGY:
-- 1. Audit actual usage of complex features
-- 2. Create migration to merge UserProfile models  
-- 3. Remove unused fields in phases
-- 4. Simplify parameter system based on actual needs
-- 5. Clean up orphaned data
