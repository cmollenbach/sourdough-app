// Check step template IDs and recipe data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== STEP TEMPLATES ===');
    const stepTemplates = await prisma.stepTemplate.findMany({
      orderBy: { id: 'asc' },
      include: { stepType: true }
    });
    stepTemplates.forEach(template => {
      console.log(`ID: ${template.id}, Name: ${template.name}, Type: ${template.stepType.name}, Role: ${template.role}`);
    });

    console.log('\n=== RECIPES AND THEIR STEPS ===');
    const recipes = await prisma.recipe.findMany({
      include: {
        steps: {
          include: { stepTemplate: true },
          orderBy: { order: 'asc' }
        }
      }
    });
    
    recipes.forEach(recipe => {
      console.log(`\nRecipe: ${recipe.name} (ID: ${recipe.id})`);
      recipe.steps.forEach(step => {
        console.log(`  Step ${step.order}: Template ID ${step.stepTemplateId} - ${step.stepTemplate.name}`);
      });
    });

    console.log('\n=== CHECKING FOR MISSING STEP TEMPLATES ===');
    const allStepTemplateIds = stepTemplates.map(t => t.id);
    for (const recipe of recipes) {
      for (const step of recipe.steps) {
        if (!allStepTemplateIds.includes(step.stepTemplateId)) {
          console.log(`❌ MISSING: Recipe "${recipe.name}" references step template ID ${step.stepTemplateId} which doesn't exist!`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
