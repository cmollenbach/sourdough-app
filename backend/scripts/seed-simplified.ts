// Script to fix seed.ts file by removing order fields
// This creates a corrected version of the seed file for the simplified schema

import { PrismaClient, ParameterDataType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Ingredient categories - order field removed in simplification
  const flourCategory = await prisma.ingredientCategory.upsert({ 
    where: { name: 'Flour' }, 
    update: { description: 'Various types of milled grains (e.g., wheat, rye, spelt) that form the primary structure of bread.' }, 
    create: { name: 'Flour', description: 'Various types of milled grains (e.g., wheat, rye, spelt) that form the primary structure of bread.' } 
  });
  
  const liquidCategory = await prisma.ingredientCategory.upsert({ 
    where: { name: 'Liquid' }, 
    update: { description: 'Water, milk, or other liquids used to hydrate the flour and enable gluten development.' }, 
    create: { name: 'Liquid', description: 'Water, milk, or other liquids used to hydrate the flour and enable gluten development.' } 
  });
  
  const saltCategory = await prisma.ingredientCategory.upsert({ 
    where: { name: 'Salt' }, 
    update: { description: 'Crucial for flavor, strengthening gluten structure, and controlling yeast activity.' }, 
    create: { name: 'Salt', description: 'Crucial for flavor, strengthening gluten structure, and controlling yeast activity.' } 
  });
  
  const prefermentCategory = await prisma.ingredientCategory.upsert({ 
    where: { name: 'Preferment' }, 
    update: { description: 'A portion of dough prepared in advance (e.g., sourdough starter, levain) to build yeast activity and flavor complexity.' }, 
    create: { name: 'Preferment', description: 'A portion of dough prepared in advance (e.g., sourdough starter, levain) to build yeast activity and flavor complexity.' } 
  });
  
  const inclusionsCategory = await prisma.ingredientCategory.upsert({ 
    where: { name: 'Inclusions' }, 
    update: { description: 'Optional ingredients added for texture and flavor, like fruits, nuts, seeds, or cheese.' }, 
    create: { name: 'Inclusions', description: 'Optional ingredients added for texture and flavor, like fruits, nuts, seeds, or cheese.' } 
  });
  
  const enrichmentsCategory = await prisma.ingredientCategory.upsert({ 
    where: { name: 'Enrichments' }, 
    update: { description: 'Ingredients like fats (oil, butter), sugars (honey, sugar), eggs, or dairy that add flavor, softness, and richness.' }, 
    create: { name: 'Enrichments', description: 'Ingredients like fats (oil, butter), sugars (honey, sugar), eggs, or dairy that add flavor, softness, and richness.' } 
  });

  console.log('✅ Ingredient categories created');

  // Ingredients - order field removed in simplification
  const breadFlour = await prisma.ingredient.upsert({ 
    where: { name: 'Bread Flour' }, 
    update: { ingredientCategoryId: flourCategory.id, helpText: 'High-protein flour (typically 12-14%) ideal for bread making, providing good structure and chew. Gives a strong gluten network.' }, 
    create: { name: 'Bread Flour', ingredientCategoryId: flourCategory.id, helpText: 'High-protein flour (typically 12-14%) ideal for bread making, providing good structure and chew. Gives a strong gluten network.' } 
  });
  
  const wholeWheatFlour = await prisma.ingredient.upsert({ 
    where: { name: 'Whole Wheat Flour' }, 
    update: { ingredientCategoryId: flourCategory.id, helpText: 'Contains the entire wheat kernel (bran, germ, endosperm). Adds nutty flavor and fiber. May require more hydration and can result in a denser loaf.' }, 
    create: { name: 'Whole Wheat Flour', ingredientCategoryId: flourCategory.id, helpText: 'Contains the entire wheat kernel (bran, germ, endosperm). Adds nutty flavor and fiber. May require more hydration and can result in a denser loaf.' } 
  });

  // Continue with other ingredients without order field...
  
  const water = await prisma.ingredient.upsert({ 
    where: { name: 'Water' }, 
    update: { ingredientCategoryId: liquidCategory.id, helpText: 'The foundation of dough hydration. Quality matters - filtered or bottled water is often preferred.' }, 
    create: { name: 'Water', ingredientCategoryId: liquidCategory.id, helpText: 'The foundation of dough hydration. Quality matters - filtered or bottled water is often preferred.' } 
  });

  const salt = await prisma.ingredient.upsert({ 
    where: { name: 'Table Salt' }, 
    update: { ingredientCategoryId: saltCategory.id, helpText: 'Fine-grain salt that dissolves easily. Use 1.8-2.5% of flour weight.' }, 
    create: { name: 'Table Salt', ingredientCategoryId: saltCategory.id, helpText: 'Fine-grain salt that dissolves easily. Use 1.8-2.5% of flour weight.' } 
  });

  console.log('✅ Ingredients created');

  // Step types - order field removed in simplification
  const prefermentsType = await prisma.stepType.upsert({ 
    where: { name: 'Preferments' }, 
    update: { description: 'Steps related to creating and managing preferments like levain or sourdough starter.' }, 
    create: { name: 'Preferments', description: 'Steps related to creating and managing preferments like levain or sourdough starter.' } 
  });
  
  const prepType = await prisma.stepType.upsert({ 
    where: { name: 'Preparation' }, 
    update: { description: 'Steps taken before mixing the main dough (e.g., autolyse).' }, 
    create: { name: 'Preparation', description: 'Steps taken before mixing the main dough (e.g., autolyse).' } 
  });
  
  const mixType = await prisma.stepType.upsert({ 
    where: { name: 'Mixing' }, 
    update: { description: 'Combining ingredients to form the dough.' }, 
    create: { name: 'Mixing', description: 'Combining ingredients to form the dough.' } 
  });

  console.log('✅ Step types created');

  // Step parameters - order field removed in simplification 
  const contributionParam = await prisma.stepParameter.upsert({
    where: { name: 'Contribution (pct)' },
    update: { type: ParameterDataType.NUMBER, helpText: 'Percentage of total formula flour used in this preferment. E.g., 20 for 20%.' },
    create: { name: 'Contribution (pct)', type: ParameterDataType.NUMBER, helpText: 'Percentage of total formula flour used in this preferment. E.g., 20 for 20%.', defaultValue: '20' }
  });
  
  const hydrationParam = await prisma.stepParameter.upsert({
    where: { name: 'Hydration' },
    update: { type: ParameterDataType.NUMBER, helpText: 'Hydration percentage of this preferment (water as % of preferment flour). E.g., 100 for 100%.' },
    create: { name: 'Hydration', type: ParameterDataType.NUMBER, helpText: 'Hydration percentage of this preferment (water as % of preferment flour). E.g., 100 for 100%.', defaultValue: '100' }
  });

  console.log('✅ Step parameters created');
  console.log('🌱 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
