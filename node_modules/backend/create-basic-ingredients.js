// Create basic ingredients for recipe building
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating ingredient categories and basic ingredients...');
    
    // Create basic ingredient categories
    const flourCategory = await prisma.ingredientCategory.upsert({
      where: { name: 'Flour' },
      create: { name: 'Flour', description: 'Various types of flour' },
      update: {}
    });

    const liquidCategory = await prisma.ingredientCategory.upsert({
      where: { name: 'Liquid' },
      create: { name: 'Liquid', description: 'Water and other liquids' },
      update: {}
    });

    const saltCategory = await prisma.ingredientCategory.upsert({
      where: { name: 'Salt' },
      create: { name: 'Salt', description: 'Salt and seasoning' },
      update: {}
    });

    const prefermentCategory = await prisma.ingredientCategory.upsert({
      where: { name: 'Preferment' },
      create: { name: 'Preferment', description: 'Starter and preferments' },
      update: {}
    });

    console.log('Created ingredient categories');

    // Create basic ingredients
    const ingredients = [
      { name: 'Bread Flour', categoryId: flourCategory.id },
      { name: 'All Purpose Flour', categoryId: flourCategory.id },
      { name: 'Whole Wheat Flour', categoryId: flourCategory.id },
      { name: 'Water', categoryId: liquidCategory.id },
      { name: 'Salt', categoryId: saltCategory.id },
      { name: 'Sourdough Starter', categoryId: prefermentCategory.id }
    ];

    for (const ingredient of ingredients) {
      const created = await prisma.ingredient.upsert({
        where: { name: ingredient.name },
        create: {
          name: ingredient.name,
          ingredientCategoryId: ingredient.categoryId,
          description: `Basic ${ingredient.name.toLowerCase()}`
        },
        update: {}
      });
      console.log(`Created: ${created.name}`);
    }

    // Test counts
    const categoryCount = await prisma.ingredientCategory.count();
    const ingredientCount = await prisma.ingredient.count();
    console.log(`Total categories: ${categoryCount}, Total ingredients: ${ingredientCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
