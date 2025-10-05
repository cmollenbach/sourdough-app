// Quick Database Query Test
// backend/test-db-query.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUnifiedProfile() {
  try {
    console.log('🔍 Testing unified UserProfile queries...\n');
    
    // Test 1: Count profiles
    const profileCount = await prisma.userProfile.count();
    console.log(`✅ UserProfile count: ${profileCount}`);
    
    // Test 2: Get all profiles with experience data
    const profiles = await prisma.userProfile.findMany({
      select: {
        id: true,
        displayName: true,
        experienceLevel: true,
        recipesCreated: true,
        bakesCompleted: true,
        showAdvancedFields: true,
        user: {
          select: {
            email: true
          }
        }
      },
      take: 3 // Just get first 3 for testing
    });
    
    console.log(`✅ Found ${profiles.length} unified profiles:`);
    profiles.forEach(profile => {
      console.log(`  - ${profile.displayName} (${profile.experienceLevel}) - ${profile.recipesCreated} recipes, ${profile.bakesCompleted} bakes`);
    });
    
    // Test 3: Check related data
    const userActions = await prisma.userAction.count();
    console.log(`✅ UserAction count: ${userActions}`);
    
    const userPreferences = await prisma.userPreference.count();
    console.log(`✅ UserPreference count: ${userPreferences}`);
    
    console.log('\n🎉 Database queries working perfectly with simplified schema!');
    
  } catch (error) {
    console.error('❌ Database query test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testUnifiedProfile();
