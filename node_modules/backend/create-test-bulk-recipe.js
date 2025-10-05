const { PrismaClient } = require('@prisma/client');

async function createTestBulkRecipe() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Creating test recipe with enhanced bulk fermentation...\n');
    
    // Create a simple test recipe to demonstrate the new S&F functionality
    const testRecipe = await prisma.recipe.create({
      data: {
        name: 'Test Enhanced Bulk Recipe',
        totalWeight: 1000,
        hydrationPct: 75,
        saltPct: 2,
        notes: 'This recipe demonstrates the new enhanced bulk fermentation with integrated stretch & fold options.',
        isPredefined: true,
        ownerId: 1, // Assuming user ID 1 exists
        steps: {
          create: [
            {
              order: 1,
              stepTemplateId: 27, // Preferment
              notes: 'Create the levain',
              description: '',
              ingredients: {
                create: [
                  {
                    order: 1,
                    ingredientId: 1, // Bread Flour
                    amount: 50,
                    calculationMode: 'PERCENTAGE'
                  }
                ]
              },
              parameterValues: {
                create: [
                  { parameterId: 12, value: '720' }, // Duration
                  { parameterId: 13, value: '24' }   // Temperature
                ]
              }
            },
            {
              order: 2,
              stepTemplateId: 28, // Enhanced Bulk Ferment
              notes: 'Bulk fermentation with integrated S&F',
              description: '',
              ingredients: {
                create: []
              },
              parameterValues: {
                create: [
                  { parameterId: 12, value: '240' },  // Duration (minutes)
                  { parameterId: 13, value: '24' },   // Temperature (°C)
                  { parameterId: 18, value: 'Basic' }, // S&F Method
                  { parameterId: 19, value: '30' },   // First Fold After (minutes)
                  { parameterId: 20, value: '30' },   // Interval Between Folds (minutes)
                  { parameterId: 22, value: 'Medium' } // Fold Strength
                ]
              }
            },
            {
              order: 3,
              stepTemplateId: 30, // Shape
              notes: 'Shape the dough',
              description: '',
              ingredients: { create: [] },
              parameterValues: { create: [] }
            }
          ]
        }
      }
    });
    
    console.log(`✅ Created test recipe: "${testRecipe.name}" (ID: ${testRecipe.id})`);
    console.log('\n📋 Recipe includes:');
    console.log('  1. Preferment step');
    console.log('  2. Enhanced Bulk Fermentation with S&F parameters:');
    console.log('     - S&F Method: Basic');
    console.log('     - First Fold After: 30 minutes');
    console.log('     - Interval Between Folds: 30 minutes');
    console.log('     - Fold Strength: Medium');
    console.log('  3. Shape step');
    console.log('\n🎯 You can now test this recipe in the frontend!');
    
  } catch (error) {
    console.error('❌ Error creating test recipe:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestBulkRecipe().catch(console.error);
