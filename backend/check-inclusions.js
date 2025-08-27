const { PrismaClient } = require('@prisma/client');

async function checkInclusions() {
  const prisma = new PrismaClient();
  
  try {
    const inclusions = await prisma.ingredient.findMany({
      include: { category: true },
      where: { category: { name: 'Inclusions' } }
    });

    console.log('Available Inclusions:');
    inclusions.forEach(i => console.log(`- ${i.name}`));
    
    // Also check what recipes use inclusions and when
    const recipesWithInclusions = await prisma.recipe.findMany({
      include: {
        steps: {
          include: {
            ingredients: {
              include: {
                ingredient: {
                  include: { category: true }
                }
              }
            },
            stepTemplate: true
          }
        }
      }
    });

    console.log('\n=== Recipes Using Inclusions ===');
    recipesWithInclusions.forEach(recipe => {
      const stepsWithInclusions = recipe.steps.filter(step => 
        step.ingredients.some(ing => ing.ingredient.category.name === 'Inclusions')
      );
      
      if (stepsWithInclusions.length > 0) {
        console.log(`\n${recipe.name}:`);
        stepsWithInclusions.forEach(step => {
          const inclusionIngredients = step.ingredients.filter(ing => 
            ing.ingredient.category.name === 'Inclusions'
          );
          console.log(`  ${step.stepTemplate.role} - ${step.stepTemplate.name}:`);
          inclusionIngredients.forEach(ing => 
            console.log(`    - ${ing.ingredient.name}`)
          );
        });
      }
    });
    
  } finally {
    await prisma.$disconnect();
  }
}

checkInclusions().catch(console.error);
