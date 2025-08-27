const { PrismaClient } = require('@prisma/client');

async function checkBulkSteps() {
  const prisma = new PrismaClient();
  
  try {
    // Get all BULK and related step templates
    const bulkTemplates = await prisma.stepTemplate.findMany({
      include: {
        parameters: {
          include: {
            parameter: true
          }
        }
      },
      where: {
        role: { in: ['BULK', 'SHAPE', 'PROOF'] }
      },
      orderBy: { role: 'asc' }
    });

    console.log('Current BULK/SHAPE/PROOF Step Templates:\n');
    
    bulkTemplates.forEach(template => {
      console.log(`${template.role} - ${template.name}:`);
      console.log(`  Description: ${template.description || 'None'}`);
      
      if (template.parameters.length === 0) {
        console.log('  Parameters: (none)');
      } else {
        console.log('  Parameters:');
        template.parameters.forEach(param => {
          console.log(`    - ${param.parameter.name}: ${param.parameter.dataType} ${param.defaultValue ? '(default: ' + param.defaultValue + ')' : ''}`);
          if (param.parameter.description) {
            console.log(`      ${param.parameter.description}`);
          }
        });
      }
      console.log('');
    });
    
    // Check if any recipes use these steps and how
    const recipesWithBulk = await prisma.recipe.findMany({
      include: {
        steps: {
          include: {
            stepTemplate: true,
            parameterValues: {
              include: {
                parameter: true
              }
            }
          },
          where: {
            stepTemplate: {
              role: { in: ['BULK'] }
            }
          }
        }
      }
    });

    console.log('\n=== How Recipes Use BULK Steps ===');
    recipesWithBulk.forEach(recipe => {
      if (recipe.steps.length > 0) {
        console.log(`\n${recipe.name}:`);
        recipe.steps.forEach(step => {
          console.log(`  ${step.stepTemplate.role} - ${step.stepTemplate.name}`);
          if (step.parameterValues.length > 0) {
            step.parameterValues.forEach(paramValue => {
              console.log(`    ${paramValue.parameter.name}: ${paramValue.value}`);
            });
          }
        });
      }
    });
    
  } finally {
    await prisma.$disconnect();
  }
}

checkBulkSteps().catch(console.error);
