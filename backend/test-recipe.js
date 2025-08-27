const { PrismaClient } = require('@prisma/client');

async function testRecipe() {
  const prisma = new PrismaClient();
  try {
    // First, list all recipes including predefined status
    const recipes = await prisma.recipe.findMany({
      select: {
        id: true,
        name: true,
        isPredefined: true,
        _count: {
          select: { steps: true }
        }
      }
    });
    
    console.log('All recipes:');
    recipes.forEach(r => {
      console.log(`  ID ${r.id}: ${r.name} (${r._count.steps} steps) - Predefined: ${r.isPredefined}`);
    });
    
    // Look for any recipe that might serve as a base template
    console.log('\nLooking for base template candidates...');
    const basicRecipe = recipes.find(r => r.name.toLowerCase().includes('basic'));
    if (basicRecipe) {
      console.log('Found Basic recipe:', basicRecipe.name, 'ID:', basicRecipe.id);
    }
    
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

testRecipe();
