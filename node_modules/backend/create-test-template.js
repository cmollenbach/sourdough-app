// Direct test to create step templates
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating test step type and template...');
    
    // First create a step type
    const stepType = await prisma.stepType.upsert({
      where: { name: 'Basic' },
      create: {
        name: 'Basic',
        description: 'Basic bread making steps'
      },
      update: {}
    });
    console.log('Created step type:', stepType);

    // Then create a step template
    const stepTemplate = await prisma.stepTemplate.upsert({
      where: { name: 'Mix' },
      create: {
        name: 'Mix',
        description: 'Mix the ingredients together',
        stepTypeId: stepType.id,
        order: 1,
        role: 'MIX'
      },
      update: {}
    });
    console.log('Created step template:', stepTemplate);

    // Test the query
    const templates = await prisma.stepTemplate.findMany({
      include: {
        parameters: { include: { parameter: true } },
        ingredientRules: { include: { ingredientCategory: true } }
      },
      orderBy: { order: "asc" },
    });
    console.log('Found templates:', templates.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
