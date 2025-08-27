// Practical Database Cleanup Migration
// Run this to implement immediate simplifications

// Step 1: Create the simplified migration
// backend/scripts/database-cleanup.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup and simplification...');

  try {
    // 1. Merge UserExperienceProfile data into UserProfile
    console.log('📋 Step 1: Merging user profile data...');
    
    // First, add the experience fields to UserProfile if they don't exist
    await prisma.$executeRaw`
      ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "experienceLevel" VARCHAR(20) DEFAULT 'beginner';
      ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "recipesCreated" INTEGER DEFAULT 0;
      ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "bakesCompleted" INTEGER DEFAULT 0;
      ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "totalBakeTimeMinutes" INTEGER DEFAULT 0;
      ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP DEFAULT NOW();
      ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "showAdvancedFields" BOOLEAN DEFAULT false;
      ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "autoSaveEnabled" BOOLEAN DEFAULT true;
      ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "defaultHydration" DECIMAL(5,2) DEFAULT 75.0;
    `;

    // 2. Migrate data from UserExperienceProfile if it exists
    const experienceProfiles = await prisma.$queryRaw`
      SELECT * FROM "UserExperienceProfile" 
      WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'UserExperienceProfile')
    `;

    if (experienceProfiles.length > 0) {
      console.log(`📊 Migrating ${experienceProfiles.length} experience profiles...`);
      
      for (const expProfile of experienceProfiles) {
        await prisma.$executeRaw`
          UPDATE "UserProfile" SET 
            "experienceLevel" = ${expProfile.experienceLevel},
            "recipesCreated" = ${expProfile.recipesCreated},
            "bakesCompleted" = ${expProfile.bakesCompleted},
            "totalBakeTimeMinutes" = ${expProfile.totalBakeTimeMinutes},
            "lastActiveAt" = ${expProfile.lastActiveAt}
          WHERE "userId" = ${expProfile.userId}
        `;
      }
    }

    // 3. Update UserAction and UserPreference to reference UserProfile
    console.log('🔗 Step 2: Updating foreign key references...');
    
    await prisma.$executeRaw`
      UPDATE "UserAction" SET "profileId" = (
        SELECT "id" FROM "UserProfile" WHERE "UserProfile"."userId" = "UserAction"."userId"
      ) WHERE "profileId" IN (
        SELECT "id" FROM "UserExperienceProfile"
      );
    `;

    await prisma.$executeRaw`
      UPDATE "UserPreference" SET "profileId" = (
        SELECT "id" FROM "UserProfile" WHERE "UserProfile"."userId" = "UserPreference"."userId"  
      ) WHERE "profileId" IN (
        SELECT "id" FROM "UserExperienceProfile"
      );
    `;

    // 4. Clean up unused fields from complex tables
    console.log('🗑️ Step 3: Removing unused complexity fields...');
    
    // Remove rarely used fields from StepParameter
    await prisma.$executeRaw`
      ALTER TABLE "StepParameter" DROP COLUMN IF EXISTS "active";
      ALTER TABLE "StepParameter" DROP COLUMN IF EXISTS "order";
      ALTER TABLE "StepParameter" DROP COLUMN IF EXISTS "visible";
    `;

    // Remove rarely used fields from StepTemplateIngredientRule  
    await prisma.$executeRaw`
      ALTER TABLE "StepTemplateIngredientRule" DROP COLUMN IF EXISTS "active";
      ALTER TABLE "StepTemplateIngredientRule" DROP COLUMN IF EXISTS "visible";
      ALTER TABLE "StepTemplateIngredientRule" DROP COLUMN IF EXISTS "description";
      ALTER TABLE "StepTemplateIngredientRule" DROP COLUMN IF EXISTS "defaultValue";
    `;

    // 5. Generate usage report
    console.log('📈 Step 4: Generating cleanup report...');
    
    const stats = await generateCleanupStats();
    console.log('\n📊 DATABASE CLEANUP COMPLETE!');
    console.log('=================================');
    console.log(`👥 Total users: ${stats.users}`);
    console.log(`📋 User profiles: ${stats.profiles}`);
    console.log(`🍞 Recipes: ${stats.recipes}`);
    console.log(`🔥 Bakes: ${stats.bakes}`);
    console.log(`⚙️ Active step templates: ${stats.templates}`);
    console.log(`🥖 Active ingredients: ${stats.ingredients}`);
    console.log('\n✅ Simplified schema is now active!');
    console.log('✅ Reduced table complexity');
    console.log('✅ Merged user profile models');
    console.log('✅ Removed unused fields');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function generateCleanupStats() {
  const [users, profiles, recipes, bakes, templates, ingredients] = await Promise.all([
    prisma.user.count(),
    prisma.userProfile.count(),
    prisma.recipe.count(),
    prisma.bake.count(),
    prisma.stepTemplate.count({ where: { active: true } }),
    prisma.ingredient.count({ where: { active: true } })
  ]);

  return { users, profiles, recipes, bakes, templates, ingredients };
}

// Run the cleanup
if (require.main === module) {
  cleanupDatabase()
    .then(() => {
      console.log('🎉 Database cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDatabase };
