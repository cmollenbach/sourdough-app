// prisma/seed.ts
import {
  PrismaClient,
  UserRole,
  ParameterDataType,
  IngredientCalculationMode,
  // StepExecutionStatus, // Not used in seed, but good to have if needed
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- 1. CLEANUP ---
  console.log('Cleaning up existing data...');

  // Define users to be deleted to target their specific dependent data
  const userEmailsToDelete = ['system@sourdough.app', 'christoffer@mollenbach.com'];

  // Level 1: Deepest dependencies (values/ingredients within steps)
  await prisma.recipeStepParameterValue.deleteMany({});
  await prisma.recipeStepIngredient.deleteMany({});
  await prisma.bakeStepParameterValue.deleteMany({});
  await prisma.bakeStepIngredient.deleteMany({});

  // Level 2: Steps themselves
  // BakeStep depends on Bake and RecipeStep. RecipeStep depends on Recipe.
  // Delete BakeStep first as it might reference RecipeStep.
  await prisma.bakeStep.deleteMany({});
  await prisma.recipeStep.deleteMany({});

  // Level 3: Bakes and Recipes
  // These must be deleted before Users they belong to.
  // Delete Bakes first, ensuring all bakes linked to recipes we intend to delete are removed.
  await prisma.bake.deleteMany({
    where: {
      // Target bakes whose associated recipe is either predefined
      // or owned by one of the users being cleaned up.
      recipe: {
        OR: [
          { isPredefined: true },
          { owner: { email: { in: userEmailsToDelete } } }
        ]
      }
    }
    // If you also need to delete bakes owned by `userEmailsToDelete` that might be
    // linked to recipes NOT covered above, you could expand the OR condition.
    // However, the primary FK violation is Recipe -> Bake, so this targets that.
  });

  await prisma.recipe.deleteMany({
    where: {
      OR: [
        { owner: { email: { in: userEmailsToDelete } } }, // Recipes owned by the users
        { isPredefined: true } // All predefined recipes
      ]
    }
  });

  // Level 4: Template related cleanup
  // StepTemplate is referenced by RecipeStep (deleted above)
  await prisma.stepTemplateParameter.deleteMany({});
  await prisma.stepTemplateIngredientRule.deleteMany({});
  await prisma.stepTemplate.deleteMany({});
  await prisma.stepType.deleteMany({});
  await prisma.stepParameter.deleteMany({});

  // Level 5: Other User-related data
  // These tables have direct foreign keys to User.
  await prisma.account.deleteMany({ where: { user: { email: { in: userEmailsToDelete } } } });
  await prisma.session.deleteMany({ where: { user: { email: { in: userEmailsToDelete } } } });
  await prisma.userProfile.deleteMany({ where: { user: { email: { in: userEmailsToDelete } } } });
  await prisma.entityRequest.deleteMany({
    where: { OR: [ { user: { email: { in: userEmailsToDelete } } }, { reviewer: { email: { in: userEmailsToDelete } } } ] },
  });

  // Level 6: Users
  await prisma.user.deleteMany({ where: { email: { in: userEmailsToDelete } } });

  console.log('Cleanup complete.');

  // --- 2. SEED SYSTEM DATA ---
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@sourdough.app' },
    update: {}, // No specific updates needed if re-running, create handles the state
    create: {
      email: 'system@sourdough.app',
      role: UserRole.ADMIN,
      emailVerified: true,
      isActive: true,
      notes: 'System user for predefined recipes and system data.',
    },
  });
  console.log(`Upserted system user: ${systemUser.email}`);

  // --- Add Christoffer Mollenbach as Admin ---
  // IMPORTANT: Passwords should ALWAYS be hashed before storing.
      const plainPassword = 'Chris0664'; // Replace with the actual password
      const hashedPassword = await bcrypt.hash(plainPassword, 10); // 10 is the salt rounds
  const christofferUser = await prisma.user.upsert({
    where: { email: 'christoffer@mollenbach.com' },
    update: {}, // No specific updates needed if re-running
    create: {
      email: 'christoffer@mollenbach.com',
          passwordHash: hashedPassword, // Store the HASHED password here
      role: UserRole.ADMIN,
      emailVerified: true, // Assuming admin users are verified by default
      isActive: true,      // Assuming admin users are active by default
    },
  });
  console.log(`Upserted admin user: ${christofferUser.email}`);

  // --- Ingredient Categories ---
  console.log('Seeding Ingredient Categories...');
  const flourCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Flour' }, update: { order: 1, description: 'Various types of milled grains (e.g., wheat, rye, spelt) that form the primary structure of bread.' }, create: { name: 'Flour', order: 1, description: 'Various types of milled grains (e.g., wheat, rye, spelt) that form the primary structure of bread.' } });
  const liquidCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Liquid' }, update: { order: 2, description: 'Water, milk, or other liquids used to hydrate the flour and enable gluten development.' }, create: { name: 'Liquid', order: 2, description: 'Water, milk, or other liquids used to hydrate the flour and enable gluten development.' } });
  const saltCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Salt' }, update: { order: 3, description: 'Crucial for flavor, strengthening gluten structure, and controlling yeast activity.' }, create: { name: 'Salt', order: 3, description: 'Crucial for flavor, strengthening gluten structure, and controlling yeast activity.' } });
  const prefermentCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Preferment' }, update: { order: 4, description: 'A portion of dough prepared in advance (e.g., sourdough starter, levain) to build yeast activity and flavor complexity.' }, create: { name: 'Preferment', order: 4, description: 'A portion of dough prepared in advance (e.g., sourdough starter, levain) to build yeast activity and flavor complexity.' } });
  const inclusionsCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Inclusions' }, update: { order: 5, description: 'Optional ingredients added for texture and flavor, like fruits, nuts, seeds, or cheese.' }, create: { name: 'Inclusions', order: 5, description: 'Optional ingredients added for texture and flavor, like fruits, nuts, seeds, or cheese.' } });
  const enrichmentsCategory = await prisma.ingredientCategory.upsert({ where: { name: 'Enrichments' }, update: { order: 6, description: 'Ingredients like fats (oil, butter), sugars (honey, sugar), eggs, or dairy that add flavor, softness, and richness.' }, create: { name: 'Enrichments', order: 6, description: 'Ingredients like fats (oil, butter), sugars (honey, sugar), eggs, or dairy that add flavor, softness, and richness.' } });

  // --- Ingredients ---
  console.log('Seeding Ingredients...');
  // Non-Advanced
  const breadFlour = await prisma.ingredient.upsert({ where: { name: 'Bread Flour' }, update: { ingredientCategoryId: flourCategory.id, order: 1, helpText: 'High-protein flour (typically 12-14%) ideal for bread making, providing good structure and chew. Gives a strong gluten network.' }, create: { name: 'Bread Flour', ingredientCategoryId: flourCategory.id, order: 1, helpText: 'High-protein flour (typically 12-14%) ideal for bread making, providing good structure and chew. Gives a strong gluten network.' } });
  const wholeWheatFlour = await prisma.ingredient.upsert({ where: { name: 'Whole Wheat Flour' }, update: { ingredientCategoryId: flourCategory.id, order: 2, helpText: 'Contains the entire wheat kernel (bran, germ, endosperm). Adds nutty flavor and fiber. May require more hydration and can result in a denser loaf.' }, create: { name: 'Whole Wheat Flour', ingredientCategoryId: flourCategory.id, order: 2, helpText: 'Contains the entire wheat kernel (bran, germ, endosperm). Adds nutty flavor and fiber. May require more hydration and can result in a denser loaf.' } });
  const water = await prisma.ingredient.upsert({ where: { name: 'Water' }, update: { ingredientCategoryId: liquidCategory.id, order: 1, helpText: 'Essential for hydrating flour and activating yeast. Water temperature can influence dough temperature and fermentation speed.' }, create: { name: 'Water', ingredientCategoryId: liquidCategory.id, order: 1, helpText: 'Essential for hydrating flour and activating yeast. Water temperature can influence dough temperature and fermentation speed.' } });
  const salt = await prisma.ingredient.upsert({ where: { name: 'Fine Sea Salt' }, update: { ingredientCategoryId: saltCategory.id, order: 1, helpText: 'Use non-iodized salt. Fine grain dissolves easily. Controls yeast, strengthens gluten, and adds flavor.' }, create: { name: 'Fine Sea Salt', ingredientCategoryId: saltCategory.id, order: 1, helpText: 'Use non-iodized salt. Fine grain dissolves easily. Controls yeast, strengthens gluten, and adds flavor.' } });
  const starter = await prisma.ingredient.upsert({ where: { name: 'Sourdough Starter' }, update: { ingredientCategoryId: prefermentCategory.id, order: 1, helpText: 'A live culture of wild yeast and bacteria. Use when active and bubbly (e.g., doubled in size after feeding). Key for leavening and flavor.' }, create: { name: 'Sourdough Starter', ingredientCategoryId: prefermentCategory.id, order: 1, helpText: 'A live culture of wild yeast and bacteria. Use when active and bubbly (e.g., doubled in size after feeding). Key for leavening and flavor.' } });
  // Advanced
  const ryeFlour = await prisma.ingredient.upsert({ where: { name: 'Rye Flour' }, update: { ingredientCategoryId: flourCategory.id, advanced: true, order: 3, helpText: 'Low in gluten, adds a distinct tangy flavor and darker color. Often used in combination with wheat flour.' }, create: { name: 'Rye Flour', ingredientCategoryId: flourCategory.id, advanced: true, order: 3, helpText: 'Low in gluten, adds a distinct tangy flavor and darker color. Often used in combination with wheat flour.' } });
  const speltFlour = await prisma.ingredient.upsert({ where: { name: 'Spelt Flour' }, update: { ingredientCategoryId: flourCategory.id, advanced: true, order: 4, helpText: 'An ancient grain with a nutty, slightly sweet flavor. Gluten is more delicate than wheat; avoid overmixing.' }, create: { name: 'Spelt Flour', ingredientCategoryId: flourCategory.id, advanced: true, order: 4, helpText: 'An ancient grain with a nutty, slightly sweet flavor. Gluten is more delicate than wheat; avoid overmixing.' } });
  const oliveOil = await prisma.ingredient.upsert({ where: { name: 'Olive Oil' }, update: { ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 1, helpText: 'Adds flavor, softness, and can extend shelf life. Use extra virgin for more flavor.' }, create: { name: 'Olive Oil', ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 1, helpText: 'Adds flavor, softness, and can extend shelf life. Use extra virgin for more flavor.' } });
  const honey = await prisma.ingredient.upsert({ where: { name: 'Honey' }, update: { ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 2, helpText: 'Adds sweetness, moisture, and can contribute to crust color. Can also speed up fermentation slightly.' }, create: { name: 'Honey', ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 2, helpText: 'Adds sweetness, moisture, and can contribute to crust color. Can also speed up fermentation slightly.' } });
  const milk = await prisma.ingredient.upsert({ where: { name: 'Milk' }, update: { ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 3, helpText: 'Adds richness, softens crumb, and can enhance browning. Can be used instead of some or all water.' }, create: { name: 'Milk', ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 3, helpText: 'Adds richness, softens crumb, and can enhance browning. Can be used instead of some or all water.' } });
  const butter = await prisma.ingredient.upsert({ where: { name: 'Butter' }, update: { ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 4, helpText: 'Adds rich flavor, tenderness, and a soft crumb. Typically added softened.' }, create: { name: 'Butter', ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 4, helpText: 'Adds rich flavor, tenderness, and a soft crumb. Typically added softened.' } });
  const egg = await prisma.ingredient.upsert({ where: { name: 'Egg' }, update: { ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 5, helpText: 'Adds richness, color, and structure. Yolks add fat and flavor, whites add structure.' }, create: { name: 'Egg', ingredientCategoryId: enrichmentsCategory.id, advanced: true, order: 5, helpText: 'Adds richness, color, and structure. Yolks add fat and flavor, whites add structure.' } });

  // --- Step Types (for grouping templates) ---
  console.log('Seeding Step Types...');
  const prefermentsType = await prisma.stepType.upsert({ where: { name: 'Preferments' }, update: { order: 1, description: 'Steps related to creating and managing preferments like levain or sourdough starter.' }, create: { name: 'Preferments', description: 'Steps related to creating and managing preferments like levain or sourdough starter.', order: 1 } });
  const prepType = await prisma.stepType.upsert({ where: { name: 'Preparation' }, update: { order: 2, description: 'Steps taken before mixing the main dough (e.g., autolyse).' }, create: { name: 'Preparation', description: 'Steps taken before mixing the main dough (e.g., autolyse).', order: 2 } });
  const mixType = await prisma.stepType.upsert({ where: { name: 'Mixing' }, update: { order: 3, description: 'Combining ingredients to form the dough.' }, create: { name: 'Mixing', description: 'Combining ingredients to form the dough.', order: 3 } });
  const bulkType = await prisma.stepType.upsert({ where: { name: 'Bulk Fermentation' }, update: { order: 4, description: 'The first rise of the dough, where strength and flavor develop.' }, create: { name: 'Bulk Fermentation', description: 'The first rise of the dough, where strength and flavor develop.', order: 4 } });
  const shapeProofType = await prisma.stepType.upsert({ where: { name: 'Shaping & Proofing' }, update: { order: 5, description: 'Forming the loaf and the final rise.' }, create: { name: 'Shaping & Proofing', description: 'Forming the loaf and the final rise.', order: 5 } });
  const bakeType = await prisma.stepType.upsert({ where: { name: 'Baking' }, update: { order: 6, description: 'Baking the loaf.' }, create: { name: 'Baking', description: 'Baking the loaf.', order: 6 } });

  // --- Step Parameters (the "Fields" for steps) ---
  console.log('Seeding Step Parameters...');
  const durationParam = await prisma.stepParameter.upsert({ where: { name: 'Duration (minutes)' }, update: { helpText: 'The length of time for this step, in minutes. This can vary based on other factors like temperature.' }, create: { name: 'Duration (minutes)', type: ParameterDataType.NUMBER, helpText: 'The length of time for this step, in minutes. This can vary based on other factors like temperature.', defaultValue: '60' } });
  const tempParam = await prisma.stepParameter.upsert({ where: { name: 'Temperature (°C)' }, update: { helpText: 'The target ambient or dough temperature in Celsius. Crucial for controlling fermentation speed.' }, create: { name: 'Temperature (°C)', type: ParameterDataType.NUMBER, helpText: 'The target ambient or dough temperature in Celsius. Crucial for controlling fermentation speed.', defaultValue: '24' } });
  const numFoldsParam = await prisma.stepParameter.upsert({ where: { name: 'Number of Folds' }, update: { advanced: true, helpText: 'The total number of stretch and fold sets to perform during bulk fermentation to build dough strength.' }, create: { name: 'Number of Folds', type: ParameterDataType.NUMBER, advanced: true, helpText: 'The total number of stretch and fold sets to perform during bulk fermentation to build dough strength.', defaultValue: '4' } });
  // New parameters for preferment
  const prefermentContribParam = await prisma.stepParameter.upsert({
    where: { name: 'Contribution (pct)' },
    update: { helpText: 'Percentage of total formula flour used in this preferment. E.g., 20 for 20%.' },
    create: { name: 'Contribution (pct)', type: ParameterDataType.NUMBER, helpText: 'Percentage of total formula flour used in this preferment. E.g., 20 for 20%.', defaultValue: '20', order: 1 } // Added order
  });
  const prefermentHydrationParam = await prisma.stepParameter.upsert({
    where: { name: 'Hydration' }, // Using 'Hydration' as per your frontend hook
    update: { helpText: 'Hydration percentage of this preferment (water as % of preferment flour). E.g., 100 for 100%.' },
    create: { name: 'Hydration', type: ParameterDataType.NUMBER, helpText: 'Hydration percentage of this preferment (water as % of preferment flour). E.g., 100 for 100%.', defaultValue: '100', order: 2 } // Added order
  });

  // --- Recipe Parameters (the "Fields" for recipes) ---
  // RecipeParameter table has been removed from the schema. No parameters to seed here.

  // --- Step Templates ---
  console.log('Seeding Step Templates...');

// Category: Preferments (prefermentsType)
const prefermentTemplate = await prisma.stepTemplate.upsert({
  where: { name: 'Preferment' },
  update: {
    stepTypeId: prefermentsType.id,
    order: 1,
    description: 'Prepare your sourdough starter or levain to ensure it is active and ready to leaven the dough. This step builds yeast population and initial flavor.',
    role: 'PREFERMENT'
  },
  create: {
    name: 'Preferment',
    stepTypeId: prefermentsType.id,
    order: 1,
    description: 'Prepare your sourdough starter or levain to ensure it is active and ready to leaven the dough. This step builds yeast population and initial flavor.',
    role: 'PREFERMENT',
    parameters: {
      create: [
        { parameterId: prefermentContribParam.id, helpText: "Defines how much of the recipe's total flour is in this preferment.", defaultValue: '20' },
        { parameterId: prefermentHydrationParam.id, helpText: 'The hydration level of this preferment itself (e.g., 100% for equal parts flour and water by weight).', defaultValue: '100' }
      ]
    },
    ingredientRules: { // Added ingredient rule for flour in preferment
      create: [
        { ingredientCategoryId: flourCategory.id, required: true, helpText: 'Specify the flour(s) for the preferment.' }
      ]
    }
  }
});

// Category: Preparation (prepType)
const autolyseTemplate = await prisma.stepTemplate.upsert({
  where: { name: 'Autolyse' },
  update: {
    stepTypeId: mixType.id,
    order: 1,
    advanced: true,
    description: 'A preliminary mix of just flour and water, allowed to rest. This hydrates the flour, encourages enzyme activity, and makes the dough more extensible, improving final texture.',
    role: 'AUTOLYSE'
  },
  create: {
    name: 'Autolyse',
    stepTypeId: mixType.id,
    order: 1,
    advanced: true,
    description: 'A preliminary mix of just flour and water, allowed to rest. This hydrates the flour, encourages enzyme activity, and makes the dough more extensible, improving final texture.',
    role: 'AUTOLYSE',
    parameters: {
      create: [{
        parameterId: durationParam.id,
        helpText: 'Typical autolyse duration is 20-60 minutes. Longer (up to 2-4 hours) can be beneficial for whole grain flours. If including starter, keep autolyse shorter.',
        defaultValue: '30'
      }]
    },
    ingredientRules: {
      create: [
        { ingredientCategoryId: flourCategory.id, required: true, helpText: 'The main flours for your recipe.' },
        { ingredientCategoryId: liquidCategory.id, required: true, helpText: 'The primary liquid (usually water) for hydration.' }
      ]
    }
  }
});

// Category: Mixing (mixType)
const mixTemplate = await prisma.stepTemplate.upsert({
  where: { name: 'Final Mix' },
  update: {
    stepTypeId: mixType.id,
    order: 1,
    description: 'Combine all remaining ingredients (starter, salt, etc.) with the autolysed flour/water (if used) to form the final dough. Develop gluten to a moderate level.',
    role: 'MIX'
  },
  create: {
    name: 'Final Mix',
    stepTypeId: mixType.id,
    order: 1,
    description: 'Combine all remaining ingredients (starter, salt, etc.) with the autolysed flour/water (if used) to form the final dough. Develop gluten to a moderate level.',
    role: 'MIX',
    ingredientRules: {
      create: [
        { ingredientCategoryId: flourCategory.id, required: true, helpText: 'Specify the flours to be used in the final dough.' }
      ]
    }
  }
});

const enrichTemplate = await prisma.stepTemplate.upsert({
  where: { name: 'Add Enrichments' },
  update: {
    stepTypeId: mixType.id,
    order: 2,
    advanced: true,
    description: 'Incorporate ingredients like fats (butter, oil), sugars, eggs, or dairy. These add flavor, softness, and richness but can sometimes inhibit gluten development if added too early.',
    role: 'ENRICH'
  },
  create: {
    name: 'Add Enrichments',
    stepTypeId: mixType.id,
    order: 2,
    advanced: true,
    description: 'Incorporate ingredients like fats (butter, oil), sugars, eggs, or dairy. These add flavor, softness, and richness but can sometimes inhibit gluten development if added too early.',
    role: 'ENRICH',
    ingredientRules: {
      create: [
        { ingredientCategoryId: enrichmentsCategory.id, helpText: 'Add softened butter, oil, sugar, honey, eggs, etc. as specified by the recipe.' }
      ]
    }
  }
});

const laminationTemplate = await prisma.stepTemplate.upsert({
  where: { name: 'Lamination' },
  update: {
    stepTypeId: bulkType.id,
    order: 3,
    advanced: true,
    description: 'A technique where dough is stretched very thin and then folded, often to incorporate inclusions evenly or to build strong, layered gluten structure.',
    role: 'INCLUSION'
  },
  create: {
    name: 'Lamination',
    stepTypeId: bulkType.id,
    order: 3,
    advanced: true,
    description: 'A technique where dough is stretched very thin and then folded, often to incorporate inclusions evenly or to build strong, layered gluten structure.',
    role: 'INCLUSION',
    ingredientRules: {
      create: [
        { ingredientCategoryId: inclusionsCategory.id, helpText: 'Spread inclusions (nuts, seeds, cheese, etc.) over the stretched dough before folding.' }
      ]
    }
  }
});

// Category: Bulk Fermentation (bulkType)
const bulkFermentTemplate = await prisma.stepTemplate.upsert({
  where: { name: 'Bulk Ferment' },
  update: {
    stepTypeId: bulkType.id,
    order: 1,
    description: 'The first major rise of the dough after mixing. During this time, yeast produces CO2, and gluten structure develops, often aided by folds. Flavor also develops significantly.',
    role: 'BULK'
  },
  create: {
    name: 'Bulk Ferment',
    stepTypeId: bulkType.id,
    order: 1,
    description: 'The first major rise of the dough after mixing. During this time, yeast produces CO2, and gluten structure develops, often aided by folds. Flavor also develops significantly.',
    role: 'BULK',
    parameters: {
      create: [
        { parameterId: durationParam.id, helpText: 'Highly variable (e.g., 3-6 hours). Judge by dough condition (risen 25-75%, airy, jiggly) rather than time alone.', defaultValue: '240' },
        { parameterId: tempParam.id, helpText: 'Ideal dough temperature is often 24-26°C (75-78°F). Warmer ferments faster, cooler slower.', defaultValue: '25' }
      ]
    }
  }
});
const stretchFoldTemplate = await prisma.stepTemplate.upsert({
  where: { name: 'Stretch & Fold' },
  update: {
    stepTypeId: bulkType.id,
    order: 2,
    advanced: true,
    description: 'A gentle technique to develop gluten strength and equalize dough temperature during bulk fermentation. Performed periodically.',
    role: 'BULK'
  },
  create: {
    name: 'Stretch & Fold',
    stepTypeId: bulkType.id,
    order: 2,
    advanced: true,
    description: 'A gentle technique to develop gluten strength and equalize dough temperature during bulk fermentation. Performed periodically.',
    role: 'BULK',
    parameters: {
      create: [{
        parameterId: numFoldsParam.id,
        helpText: 'Typically 2-4 sets of folds, spaced 30-60 minutes apart during the first half or two-thirds of bulk fermentation.',
        defaultValue: '3'
      }]
    }
  }
});
const shapeTemplate = await prisma.stepTemplate.upsert({
  where: { name: 'Shape' },
  update: {
    stepTypeId: shapeProofType.id,
    order: 1,
    description: 'Gently degas the dough and shape it into its final form (e.g., boule, bâtard). This creates surface tension for good oven spring and an even crumb.',
    role: 'SHAPE'
  },
  create: {
    name: 'Shape',
    stepTypeId: shapeProofType.id,
    order: 1,
    description: 'Gently degas the dough and shape it into its final form (e.g., boule, bâtard). This creates surface tension for good oven spring and an even crumb.',
    role: 'SHAPE'
  }
});
const proofTemplate = await prisma.stepTemplate.upsert({
  where: { name: 'Final Proof' },
  update: {
    stepTypeId: shapeProofType.id,
    order: 2,
    description: 'The final rise of the shaped dough before baking. Can be done at room temperature or in the refrigerator (cold proof/retardation) for enhanced flavor and easier scoring.',
    role: 'PROOF'
  },
  create: {
    name: 'Final Proof',
    stepTypeId: shapeProofType.id,
    order: 2,
    description: 'The final rise of the shaped dough before baking. Can be done at room temperature or in the refrigerator (cold proof/retardation) for enhanced flavor and easier scoring.',
    role: 'PROOF',
    parameters: {
      create: [
        { parameterId: durationParam.id, helpText: "Room temp: 1-3 hours. Cold proof: 8-24+ hours. Judge by dough appearance (puffy, passes poke test).", defaultValue: '120' },
        { parameterId: tempParam.id, helpText: "Room temp (e.g., 21-24°C) or fridge (e.g., 3-5°C).", defaultValue: '22' }
      ]
    }
  }
});

// Category: Baking (bakeType)
const bakeTemplate = await prisma.stepTemplate.upsert({
  where: { name: 'Bake' },
  update: {
    stepTypeId: bakeType.id,
    order: 1,
    description: 'Bake the proofed loaf, typically in a hot, steamy environment initially, then with dry heat to develop crust color and texture.',
    role: 'BAKE'
  },
  create: {
    name: 'Bake',
    stepTypeId: bakeType.id,
    order: 1,
    description: 'Bake the proofed loaf, typically in a hot, steamy environment initially, then with dry heat to develop crust color and texture.',
    role: 'BAKE',
    parameters: {
      create: [
        { parameterId: durationParam.id, helpText: 'Total bake time. Often split (e.g., 20 min covered, 20-25 min uncovered). Bake until internal temp is ~96-99°C (205-210°F).', defaultValue: '45' },
        { parameterId: tempParam.id, helpText: 'Preheat oven thoroughly. Often high heat (e.g., 230-250°C) initially, sometimes reduced after removing steam source.', defaultValue: '230' }
      ]
    }
  }
});
const restTemplate = await prisma.stepTemplate.upsert({
  where: { name: 'Rest' },
  update: {
    stepTypeId: bakeType.id,
    order: 2,
    description: 'Crucial step after baking. Allows the internal structure (crumb) to set and moisture to redistribute. Cutting too early can result in a gummy texture.',
    role: 'REST'
  },
  create: {
    name: 'Rest',
    stepTypeId: bakeType.id,
    order: 2,
    description: 'Crucial step after baking. Allows the internal structure (crumb) to set and moisture to redistribute. Cutting too early can result in a gummy texture.',
    role: 'REST',
    parameters: {
      create: [{
        parameterId: durationParam.id,
        helpText: 'Minimum 1-2 hours on a wire rack. Larger or denser loaves may need longer. Patience is key!',
        defaultValue: '120'
      }]
    }
  }
});

  // --- 3. SEED RECIPE TEMPLATES ---
  console.log("Seeding Recipe Templates...");

  // 1. Base Template
  const baseRecipe = await prisma.recipe.upsert({
    where: { name: 'Base Template' }, // Assuming 'name' is unique for predefined recipes
    update: { // Fields to update if 'Base Template' recipe exists
      notes: 'The simplest starting point for any recipe.',
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1000,
      hydrationPct: 70,
      saltPct: 2,
      // Steps are handled by the 'create' block logic due to prior deletion.
      // If not deleting first, managing steps in an update is more complex (delete old, create new).      
      steps: { 
        updateMany: { where: {}, data: {} }, // Placeholder if we needed to update steps
        create: [
          { stepTemplateId: prefermentTemplate.id, order: 1, parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 20 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } }, // Example default values
          // For a base template, we might not specify a default flour for preferment,
          // or assume bread flour if the rule is there. Let's omit explicit ingredient for base.
          // The UI would prompt for it if the rule is 'required'.
          { stepTemplateId: mixTemplate.id, order: 2 }
        ]
      }
    },
    create: { // Fields to create if 'Base Template' recipe does not exist
      name: 'Base Template',
      notes: 'The simplest starting point for any recipe.',
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1000,
      hydrationPct: 70,
      saltPct: 2,
      steps: { create: [
        { stepTemplateId: prefermentTemplate.id, order: 1, parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 20 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } }, // Example default values
        // Omitting explicit ingredient for base template preferment.
        { stepTemplateId: mixTemplate.id, order: 2 }
      ]}
    }
  });
  console.log(`Created: ${baseRecipe.id} - Base Template`);

  // --- Basic Recipes ---
  const firstLoaf = await prisma.recipe.upsert({
    where: { name: "My First Sourdough Loaf" },
    update: {
      notes: "A simple, reliable recipe for beginners based on the 1-2-3 method.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 909,
      hydrationPct: 67,
      saltPct: 2,
      steps: {
        updateMany: { where: {}, data: {} },
        create: [
          { 
            stepTemplateId: prefermentTemplate.id, order: 1, 
            // Preferment step defines its own starter percentage based on its contribution to total flour
            // The starter itself (an ingredient) is implicitly 100% of the preferment's flour if not specified otherwise.
            // Or, if starter is an ingredient *within* the preferment step, it would be listed here.
            // For simplicity, assuming the preferment step *is* the starter build.
            // No explicit ingredients needed here if preferment step's parameters define its composition.
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 15 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } 
            , ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Preferment uses Bread Flour
          },
          { stepTemplateId: mixTemplate.id, order: 2, ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } }, // Water and Salt are derived from recipe's hydration/saltPct
          { stepTemplateId: bulkFermentTemplate.id, order: 3, notes: "Look for the dough to increase in volume by about 25-50%, feel airy, and show some bubbles on the surface. The exact time can vary based on starter activity and room temperature.", parameterValues: { create: [{ parameterId: durationParam.id, value: 240 }, { parameterId: tempParam.id, value: 24 }] } },
          { stepTemplateId: shapeTemplate.id, order: 4 },
          { stepTemplateId: proofTemplate.id, order: 5, notes: "Cold proofing in the fridge develops flavor and makes scoring easier. Dough should look puffy and pass the 'poke test' (an indentation fills back slowly).", parameterValues: { create: [{ parameterId: durationParam.id, value: 720 }, { parameterId: tempParam.id, value: 4 }] } },
          { stepTemplateId: bakeTemplate.id, order: 6, parameterValues: { create: [{ parameterId: durationParam.id, value: 45 }, { parameterId: tempParam.id, value: 230 }] } },
        ]
      }
    },
    create: {
      name: "My First Sourdough Loaf",
      notes: "A simple, reliable recipe for beginners based on the 1-2-3 method.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 909,
      hydrationPct: 67,
      saltPct: 2,
      steps: {
        create: [
          { 
            stepTemplateId: prefermentTemplate.id, order: 1,
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 15 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } ,
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Preferment uses Bread Flour
          },
          { stepTemplateId: mixTemplate.id, order: 2, ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } }, // Water and Salt derived
          { stepTemplateId: bulkFermentTemplate.id, order: 3, notes: "Look for the dough to increase in volume by about 25-50%, feel airy, and show some bubbles on the surface. The exact time can vary based on starter activity and room temperature.", parameterValues: { create: [{ parameterId: durationParam.id, value: 240 }, { parameterId: tempParam.id, value: 24 }] } },
          { stepTemplateId: shapeTemplate.id, order: 4 },
          { stepTemplateId: proofTemplate.id, order: 5, notes: "Cold proofing in the fridge develops flavor and makes scoring easier. Dough should look puffy and pass the 'poke test' (an indentation fills back slowly).", parameterValues: { create: [{ parameterId: durationParam.id, value: 720 }, { parameterId: tempParam.id, value: 4 }] } },
          { stepTemplateId: bakeTemplate.id, order: 6, parameterValues: { create: [{ parameterId: durationParam.id, value: 45 }, { parameterId: tempParam.id, value: 230 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${firstLoaf.id} - My First Sourdough Loaf`);

  const basicWholeWheat = await prisma.recipe.upsert({
    where: { name: "Simple Whole Wheat" },
    update: {
      notes: "A slightly heartier loaf with the nutty flavor of whole wheat.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1020,
      hydrationPct: 72,
      saltPct: 2,
      steps: {
        updateMany: { where: {}, data: {} },
        create: [
          {
            stepTemplateId: prefermentTemplate.id, order: 1,
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 20 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } ,
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Preferment uses Bread Flour (common for whole wheat recipes to use white flour in levain)
          },
          {
            stepTemplateId: mixTemplate.id, order: 2, ingredients: {
              create: [
                { ingredientId: breadFlour.id, amount: 70, calculationMode: IngredientCalculationMode.PERCENTAGE }, 
                { ingredientId: wholeWheatFlour.id, amount: 30, calculationMode: IngredientCalculationMode.PERCENTAGE }
              ] // Water and Salt derived
            }
          },
          { stepTemplateId: bulkFermentTemplate.id, order: 3, notes: "Whole wheat can ferment a bit faster. Watch for a good rise and airy texture.", parameterValues: { create: [{ parameterId: durationParam.id, value: 240 }, { parameterId: tempParam.id, value: 24 }] } },
          { stepTemplateId: shapeTemplate.id, order: 4 },
          { stepTemplateId: proofTemplate.id, order: 5, parameterValues: { create: [{ parameterId: durationParam.id, value: 720 }, { parameterId: tempParam.id, value: 4 }] } },
          { stepTemplateId: bakeTemplate.id, order: 6, parameterValues: { create: [{ parameterId: durationParam.id, value: 45 }, { parameterId: tempParam.id, value: 230 }] } },
        ]
      }
    },
    create: {
      name: "Simple Whole Wheat",
      notes: "A slightly heartier loaf with the nutty flavor of whole wheat.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1020,
      hydrationPct: 72,
      saltPct: 2,
      steps: {
        create: [
          {
            stepTemplateId: prefermentTemplate.id, order: 1,
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 20 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } ,
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Preferment uses Bread Flour
          },
          {
            stepTemplateId: mixTemplate.id, order: 2, ingredients: {
              create: [
                { ingredientId: breadFlour.id, amount: 70, calculationMode: IngredientCalculationMode.PERCENTAGE }, 
                { ingredientId: wholeWheatFlour.id, amount: 30, calculationMode: IngredientCalculationMode.PERCENTAGE }
              ] // Water and Salt derived
            }
          },
          { stepTemplateId: bulkFermentTemplate.id, order: 3, notes: "Whole wheat can ferment a bit faster. Watch for a good rise and airy texture.", parameterValues: { create: [{ parameterId: durationParam.id, value: 240 }, { parameterId: tempParam.id, value: 24 }] } },
          { stepTemplateId: shapeTemplate.id, order: 4 },
          { stepTemplateId: proofTemplate.id, order: 5, parameterValues: { create: [{ parameterId: durationParam.id, value: 720 }, { parameterId: tempParam.id, value: 4 }] } },
          { stepTemplateId: bakeTemplate.id, order: 6, parameterValues: { create: [{ parameterId: durationParam.id, value: 45 }, { parameterId: tempParam.id, value: 230 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${basicWholeWheat.id} - Simple Whole Wheat`);

  const sameDay = await prisma.recipe.upsert({
    where: { name: "Same-Day Sourdough" },
    update: {
      notes: "For when you want fresh bread tonight. A higher percentage of levain speeds up the process.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1060,
      hydrationPct: 70,
      saltPct: 2,
      steps: {
        updateMany: { where: {}, data: {} },
        create: [
          {
            stepTemplateId: prefermentTemplate.id, order: 1,
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 40 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } ,
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Preferment uses Bread Flour
          },
          { stepTemplateId: mixTemplate.id, order: 2, ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } }, // Water and Salt derived
          { stepTemplateId: bulkFermentTemplate.id, order: 3, notes: "With more starter and warmer temp, this will be quicker. Watch the dough, not just the clock. Aim for a good rise and airy texture.", parameterValues: { create: [{ parameterId: durationParam.id, value: 180 }, { parameterId: tempParam.id, value: 26 }] } },
          { stepTemplateId: shapeTemplate.id, order: 4 },
          { stepTemplateId: proofTemplate.id, order: 5, parameterValues: { create: [{ parameterId: durationParam.id, value: 120 }, { parameterId: tempParam.id, value: 26 }] } },
          { stepTemplateId: bakeTemplate.id, order: 6, parameterValues: { create: [{ parameterId: durationParam.id, value: 40 }, { parameterId: tempParam.id, value: 240 }] } },
        ]
      }
    },
    create: {
      name: "Same-Day Sourdough",
      notes: "For when you want fresh bread tonight. A higher percentage of levain speeds up the process.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1060,
      hydrationPct: 70,
      saltPct: 2,
      steps: {
        create: [
          {
            stepTemplateId: prefermentTemplate.id, order: 1,
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 40 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } ,
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Preferment uses Bread Flour
          },
          { stepTemplateId: mixTemplate.id, order: 2, ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } }, // Water and Salt derived
          { stepTemplateId: bulkFermentTemplate.id, order: 3, notes: "With more starter and warmer temp, this will be quicker. Watch the dough, not just the clock. Aim for a good rise and airy texture.", parameterValues: { create: [{ parameterId: durationParam.id, value: 180 }, { parameterId: tempParam.id, value: 26 }] } },
          { stepTemplateId: shapeTemplate.id, order: 4 },
          { stepTemplateId: proofTemplate.id, order: 5, parameterValues: { create: [{ parameterId: durationParam.id, value: 120 }, { parameterId: tempParam.id, value: 26 }] } },
          { stepTemplateId: bakeTemplate.id, order: 6, parameterValues: { create: [{ parameterId: durationParam.id, value: 40 }, { parameterId: tempParam.id, value: 240 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${sameDay.id} - Same-Day Sourdough`);

  // --- Advanced Recipes ---
  const highHydration = await prisma.recipe.upsert({
    where: { name: "High Hydration Challenge" },
    update: {
      notes: "Mastering wet dough for an open, airy crumb. Requires gentle handling.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1035,
      hydrationPct: 85,
      saltPct: 2.2,
      steps: {
        updateMany: { where: {}, data: {} },
        create: [
          {
            stepTemplateId: prefermentTemplate.id, order: 1,
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 20 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } ,
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Preferment uses Bread Flour
          },
          { 
            stepTemplateId: autolyseTemplate.id, order: 2, parameterValues: { create: [{ parameterId: durationParam.id, value: 60 }] },
            // Autolyse step only lists flour. Water for autolyse is part of the total recipe hydration.
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] },
            notes: "A longer autolyse helps manage very wet dough by allowing flour to fully hydrate."
          },
          { 
            stepTemplateId: mixTemplate.id, order: 3 // This step implicitly includes the salt based on recipe's saltPct. No explicit salt ingredient needed.
          },
          { stepTemplateId: stretchFoldTemplate.id, order: 4, notes: "Be very gentle with wet dough. Use wet hands to prevent sticking. More folds might be needed.", parameterValues: { create: [{ parameterId: numFoldsParam.id, value: 4 }] } },
          { stepTemplateId: bulkFermentTemplate.id, order: 5, parameterValues: { create: [{ parameterId: durationParam.id, value: 180 }, { parameterId: tempParam.id, value: 26 }] } },
          { stepTemplateId: shapeTemplate.id, order: 6 },
          { stepTemplateId: proofTemplate.id, order: 7, parameterValues: { create: [{ parameterId: durationParam.id, value: 720 }, { parameterId: tempParam.id, value: 4 }] } },
          { stepTemplateId: bakeTemplate.id, order: 8, parameterValues: { create: [{ parameterId: durationParam.id, value: 45 }, { parameterId: tempParam.id, value: 250 }] } },
        ]
      }
    },
    create: {
      name: "High Hydration Challenge",
      notes: "Mastering wet dough for an open, airy crumb. Requires gentle handling.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1035,
      hydrationPct: 85,
      saltPct: 2.2,
      steps: {
        create: [
          {
            stepTemplateId: prefermentTemplate.id, order: 1,
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 20 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } ,
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Preferment uses Bread Flour
          },
          { 
            stepTemplateId: autolyseTemplate.id, order: 2, parameterValues: { create: [{ parameterId: durationParam.id, value: 60 }] },
            // Autolyse step only lists flour. Water for autolyse is part of the total recipe hydration.
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] },
            notes: "A longer autolyse helps manage very wet dough by allowing flour to fully hydrate."
          },
          { 
            stepTemplateId: mixTemplate.id, order: 3 // Salt derived from recipe's saltPct
          },
          { stepTemplateId: stretchFoldTemplate.id, order: 4, notes: "Be very gentle with wet dough. Use wet hands to prevent sticking. More folds might be needed.", parameterValues: { create: [{ parameterId: numFoldsParam.id, value: 4 }] } },
          { stepTemplateId: bulkFermentTemplate.id, order: 5, parameterValues: { create: [{ parameterId: durationParam.id, value: 180 }, { parameterId: tempParam.id, value: 26 }] } },
          { stepTemplateId: shapeTemplate.id, order: 6 },
          { stepTemplateId: proofTemplate.id, order: 7, parameterValues: { create: [{ parameterId: durationParam.id, value: 720 }, { parameterId: tempParam.id, value: 4 }] } },
          { stepTemplateId: bakeTemplate.id, order: 8, parameterValues: { create: [{ parameterId: durationParam.id, value: 45 }, { parameterId: tempParam.id, value: 250 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${highHydration.id} - High Hydration Challenge`);

  const panettone = await prisma.recipe.upsert({
    where: { name: "Sourdough Panettone" },
    update: {
      notes: "A decadent, highly enriched dough. A true test of a baker's skill.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1200,
      hydrationPct: 60,
      saltPct: 1.5,
      steps: {
        updateMany: { where: {}, data: {} },
        create: [
          {
            stepTemplateId: prefermentTemplate.id, order: 1, notes: 'Primo Impasto: Let this first dough ferment for 10-12 hours.',
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 20 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } ,
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Panettone preferment typically uses strong bread flour
          },
          { // Enrich step using the enrichTemplate
            stepTemplateId: enrichTemplate.id, order: 2, notes: 'Secondo Impasto: Add final ingredients.',
            ingredients: { create: [
              { ingredientId: breadFlour.id, amount: 80, calculationMode: IngredientCalculationMode.PERCENTAGE }, // Specific flour
              // Water and Salt for this step are derived from overall recipe hydration/salt Pct, minus what was in preferment.
              { ingredientId: honey.id, amount: 75, calculationMode: IngredientCalculationMode.FIXED_WEIGHT }, // Example: 75g
              { ingredientId: butter.id, amount: 150, calculationMode: IngredientCalculationMode.FIXED_WEIGHT }, // Example: 150g
              { ingredientId: egg.id, amount: 100, calculationMode: IngredientCalculationMode.FIXED_WEIGHT } // Example: 100g (approx 2 large eggs)
            ] }
          },
          { stepTemplateId: laminationTemplate.id, order: 3, notes: 'Fold in candied fruits and nuts.' },
          { stepTemplateId: proofTemplate.id, order: 4, parameterValues: { create: [{ parameterId: durationParam.id, value: 480 }, { parameterId: tempParam.id, value: 28 }] } },
          { stepTemplateId: bakeTemplate.id, order: 5, notes: 'Hang upside down to cool after baking.', parameterValues: { create: [{ parameterId: durationParam.id, value: 50 }, { parameterId: tempParam.id, value: 175 }] } },
        ]
      }
    },
    create: {
      name: "Sourdough Panettone",
      notes: "A decadent, highly enriched dough. A true test of a baker's skill.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1200,
      hydrationPct: 60,
      saltPct: 1.5,
      steps: {
        create: [
          {
            stepTemplateId: prefermentTemplate.id, order: 1, notes: 'Primo Impasto: Let this first dough ferment for 10-12 hours.',
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 20 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } ,
            ingredients: { create: [{ ingredientId: breadFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Panettone preferment
          },
          { // Enrich step using the enrichTemplate
            stepTemplateId: enrichTemplate.id, order: 2, notes: 'Secondo Impasto: Add final ingredients.',
            ingredients: { create: [
              { ingredientId: breadFlour.id, amount: 80, calculationMode: IngredientCalculationMode.PERCENTAGE }, // Specific flour
              // Water and Salt derived
              { ingredientId: honey.id, amount: 75, calculationMode: IngredientCalculationMode.FIXED_WEIGHT }, // Example: 75g
              { ingredientId: butter.id, amount: 150, calculationMode: IngredientCalculationMode.FIXED_WEIGHT }, // Example: 150g
              { ingredientId: egg.id, amount: 100, calculationMode: IngredientCalculationMode.FIXED_WEIGHT } // Example: 100g (approx 2 large eggs)
            ] }
          },
          { stepTemplateId: laminationTemplate.id, order: 3, notes: 'Fold in candied fruits and nuts.' },
          { stepTemplateId: proofTemplate.id, order: 4, parameterValues: { create: [{ parameterId: durationParam.id, value: 480 }, { parameterId: tempParam.id, value: 28 }] } },
          { stepTemplateId: bakeTemplate.id, order: 5, notes: 'Hang upside down to cool after baking.', parameterValues: { create: [{ parameterId: durationParam.id, value: 50 }, { parameterId: tempParam.id, value: 175 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${panettone.id} - Sourdough Panettone`);

  const danishRye = await prisma.recipe.upsert({
    where: { name: "Danish Rye (Rugbrød)" },
    update: {
      notes: "A dense, hearty, and wholesome loaf, central to Danish cuisine. No kneading required.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1115,
      hydrationPct: 87.5,
      saltPct: 3.75,
      steps: {
        updateMany: { where: {}, data: {} },
        create: [
          {
            stepTemplateId: prefermentTemplate.id, order: 1,
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 50 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } ,
            ingredients: { create: [{ ingredientId: ryeFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Danish Rye preferment uses Rye Flour
          },
          {
            stepTemplateId: mixTemplate.id, order: 2, notes: 'Mix into a thick, sticky paste.',
            ingredients: { create: [
                { ingredientId: ryeFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }
              ] } // Water and Salt derived
          },
          { stepTemplateId: proofTemplate.id, order: 3, notes: 'Proof in a loaf pan.', parameterValues: { create: [{ parameterId: durationParam.id, value: 240 }, { parameterId: tempParam.id, value: 24 }] } },
          { stepTemplateId: bakeTemplate.id, order: 4, parameterValues: { create: [{ parameterId: durationParam.id, value: 60 }, { parameterId: tempParam.id, value: 190 }] } },
          { stepTemplateId: restTemplate.id, order: 5, notes: 'MUST rest for at least 24 hours before slicing.', parameterValues: { create: [{ parameterId: durationParam.id, value: 1440 }] } },
        ]
      }
    },
    create: {
      name: "Danish Rye (Rugbrød)",
      notes: "A dense, hearty, and wholesome loaf, central to Danish cuisine. No kneading required.",
      ownerId: systemUser.id,
      isPredefined: true,
      totalWeight: 1115,
      hydrationPct: 87.5,
      saltPct: 3.75,
      steps: {
        create: [
          {
            stepTemplateId: prefermentTemplate.id, order: 1,
            parameterValues: { create: [{ parameterId: prefermentContribParam.id, value: 50 }, { parameterId: prefermentHydrationParam.id, value: 100 }] } ,
            ingredients: { create: [{ ingredientId: ryeFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }] } // Danish Rye preferment uses Rye Flour
          },
          {
            stepTemplateId: mixTemplate.id, order: 2, notes: 'Mix into a thick, sticky paste.',
            ingredients: { create: [
                { ingredientId: ryeFlour.id, amount: 100, calculationMode: IngredientCalculationMode.PERCENTAGE }
              ] } // Water and Salt derived
          },
          { stepTemplateId: proofTemplate.id, order: 3, notes: 'Proof in a loaf pan.', parameterValues: { create: [{ parameterId: durationParam.id, value: 240 }, { parameterId: tempParam.id, value: 24 }] } },
          { stepTemplateId: bakeTemplate.id, order: 4, parameterValues: { create: [{ parameterId: durationParam.id, value: 60 }, { parameterId: tempParam.id, value: 190 }] } },
          { stepTemplateId: restTemplate.id, order: 5, notes: 'MUST rest for at least 24 hours before slicing.', parameterValues: { create: [{ parameterId: durationParam.id, value: 1440 }] } },
        ]
      }
    }
  });
  console.log(`Created: ${danishRye.id} - Danish Rye (Rugbrød)`);

  console.log(`Seeding finished.`);
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
