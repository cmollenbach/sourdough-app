// Quick test to check step templates in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing step templates...');
    
    const stepTemplates = await prisma.stepTemplate.findMany();
    console.log(`Found ${stepTemplates.length} step templates:`);
    stepTemplates.forEach(template => {
      console.log(`- ID: ${template.id}, Name: ${template.name}`);
    });

    const stepTypes = await prisma.stepType.findMany();
    console.log(`\nFound ${stepTypes.length} step types:`);
    stepTypes.forEach(type => {
      console.log(`- ID: ${type.id}, Name: ${type.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
