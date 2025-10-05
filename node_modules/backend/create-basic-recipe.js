// Create a basic recipe template
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating basic recipe template...');
    
    // Get system user (should exist from previous tests)
    let systemUser = await prisma.user.findUnique({
      where: { email: 'system@sourdough.app' }
    });

    if (!systemUser) {
      // Create system user if it doesn't exist
      systemUser = await prisma.user.create({
        data: {
          email: 'system@sourdough.app',
          role: 'ADMIN',
          emailVerified: true,
          isActive: true
        }
      });
    }

    // Get step templates
    const mixTemplate = await prisma.stepTemplate.findUnique({ where: { name: 'Mix' } });
    const bulkTemplate = await prisma.stepTemplate.findUnique({ where: { name: 'Bulk Fermentation' } });
    const shapeTemplate = await prisma.stepTemplate.findUnique({ where: { name: 'Shape' } });
    const bakeTemplate = await prisma.stepTemplate.findUnique({ where: { name: 'Bake' } });

    if (!mixTemplate || !bulkTemplate || !shapeTemplate || !bakeTemplate) {
      console.error('Required step templates not found!');
      return;
    }

    // Create basic recipe
    const recipe = await prisma.recipe.upsert({
      where: { name: 'Basic Sourdough Template' },
      create: {
        name: 'Basic Sourdough Template',
        notes: 'A simple sourdough bread recipe for beginners',
        totalWeight: 1000,
        hydrationPct: 75,
        saltPct: 2,
        ownerId: systemUser.id,
        isPredefined: true,
        steps: {
          create: [
            {
              stepTemplateId: mixTemplate.id,
              order: 1,
              notes: 'Mix all ingredients until combined'
            },
            {
              stepTemplateId: bulkTemplate.id,
              order: 2,
              notes: 'Bulk ferment for 4-6 hours with folds'
            },
            {
              stepTemplateId: shapeTemplate.id,
              order: 3,
              notes: 'Shape into a boule'
            },
            {
              stepTemplateId: bakeTemplate.id,
              order: 4,
              notes: 'Bake at 450°F for 45 minutes'
            }
          ]
        }
      },
      update: {},
      include: {
        steps: true
      }
    });

    console.log(`Created recipe: ${recipe.name} with ${recipe.steps.length} steps`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
