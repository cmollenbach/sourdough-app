// Create essential step templates for recipe building
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating essential step templates...');
    
    // Get the basic step type
    const basicType = await prisma.stepType.findUnique({
      where: { name: 'Basic' }
    });

    if (!basicType) {
      console.error('Basic step type not found!');
      return;
    }

    // Create essential step templates
    const templates = [
      {
        name: 'Autolyse',
        description: 'Mix flour and water, rest to develop gluten',
        role: 'AUTOLYSE',
        order: 1
      },
      {
        name: 'Mix',
        description: 'Mix all ingredients together',
        role: 'MIX',
        order: 2
      },
      {
        name: 'Bulk Fermentation',
        description: 'Primary fermentation with stretch and folds',
        role: 'BULK',
        order: 3
      },
      {
        name: 'Shape',
        description: 'Shape the dough into final form',
        role: 'SHAPE',
        order: 4
      },
      {
        name: 'Final Proof',
        description: 'Final rise before baking',
        role: 'PROOF',
        order: 5
      },
      {
        name: 'Bake',
        description: 'Bake in the oven',
        role: 'BAKE',
        order: 6
      }
    ];

    for (const template of templates) {
      const created = await prisma.stepTemplate.upsert({
        where: { name: template.name },
        create: {
          name: template.name,
          description: template.description,
          stepTypeId: basicType.id,
          order: template.order,
          role: template.role
        },
        update: {}
      });
      console.log(`Created: ${created.name}`);
    }

    // Test the final count
    const allTemplates = await prisma.stepTemplate.findMany();
    console.log(`Total step templates: ${allTemplates.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
