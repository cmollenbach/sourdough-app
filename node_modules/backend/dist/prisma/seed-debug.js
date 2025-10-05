"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Debug version of seed.ts with better error handling
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        console.log(`🌱 Start seeding...`);
        // --- 1. CLEANUP ---
        console.log('🧹 Cleaning up existing data...');
        const userEmailsToDelete = ['system@sourdough.app', 'christoffer@mollenbach.com'];
        // Clean up in proper order
        console.log('  - Cleaning parameter values...');
        await prisma.recipeStepParameterValue.deleteMany({});
        await prisma.recipeStepIngredient.deleteMany({});
        await prisma.bakeStepParameterValue.deleteMany({});
        await prisma.bakeStepIngredient.deleteMany({});
        console.log('  - Cleaning steps...');
        await prisma.bakeStep.deleteMany({});
        await prisma.recipeStep.deleteMany({});
        console.log('  - Cleaning bakes and recipes...');
        await prisma.bake.deleteMany({});
        await prisma.recipe.deleteMany({});
        console.log('  - Cleaning templates...');
        await prisma.stepTemplateParameter.deleteMany({});
        await prisma.stepTemplateIngredientRule.deleteMany({});
        await prisma.stepTemplate.deleteMany({});
        await prisma.stepType.deleteMany({});
        await prisma.stepParameter.deleteMany({});
        console.log('  - Cleaning user data...');
        await prisma.account.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.userProfile.deleteMany({});
        await prisma.entityRequest.deleteMany({});
        console.log('  - Cleaning ingredients...');
        await prisma.ingredient.deleteMany({});
        await prisma.ingredientCategory.deleteMany({});
        console.log('  - Cleaning users...');
        await prisma.user.deleteMany({});
        console.log('✅ Cleanup complete.');
        // --- 2. SEED USERS ---
        console.log('👤 Creating users...');
        const systemUser = await prisma.user.create({
            data: {
                email: 'system@sourdough.app',
                role: client_1.UserRole.ADMIN,
                emailVerified: true,
                isActive: true,
                notes: 'System user for predefined recipes and system data.',
            },
        });
        console.log(`✅ Created system user: ${systemUser.email}`);
        const plainPassword = 'Chris0664';
        const hashedPassword = await bcrypt_1.default.hash(plainPassword, 10);
        const christofferUser = await prisma.user.create({
            data: {
                email: 'christoffer@mollenbach.com',
                passwordHash: hashedPassword,
                role: client_1.UserRole.ADMIN,
                emailVerified: true,
                isActive: true,
            },
        });
        console.log(`✅ Created admin user: ${christofferUser.email}`);
        // --- 3. SEED INGREDIENT CATEGORIES ---
        console.log('📦 Creating ingredient categories...');
        const flourCategory = await prisma.ingredientCategory.create({
            data: {
                name: 'Flour',
                description: 'Various types of milled grains (e.g., wheat, rye, spelt) that form the primary structure of bread.'
            }
        });
        const liquidCategory = await prisma.ingredientCategory.create({
            data: {
                name: 'Liquid',
                description: 'Water, milk, or other liquids used to hydrate the flour and enable gluten development.'
            }
        });
        const saltCategory = await prisma.ingredientCategory.create({
            data: {
                name: 'Salt',
                description: 'Crucial for flavor, strengthening gluten structure, and controlling yeast activity.'
            }
        });
        const prefermentCategory = await prisma.ingredientCategory.create({
            data: {
                name: 'Preferment',
                description: 'A portion of dough prepared in advance (e.g., sourdough starter, levain) to build yeast activity and flavor complexity.'
            }
        });
        const inclusionsCategory = await prisma.ingredientCategory.create({
            data: {
                name: 'Inclusions',
                description: 'Optional ingredients added for texture and flavor, like fruits, nuts, seeds, or cheese.'
            }
        });
        const enrichmentsCategory = await prisma.ingredientCategory.create({
            data: {
                name: 'Enrichments',
                description: 'Ingredients like fats (oil, butter), sugars (honey, sugar), eggs, or dairy that add flavor, softness, and richness.'
            }
        });
        console.log('✅ Created 6 ingredient categories');
        // --- 4. SEED CORE INGREDIENTS ---
        console.log('🥖 Creating core ingredients...');
        const breadFlour = await prisma.ingredient.create({
            data: {
                name: 'Bread Flour',
                ingredientCategoryId: flourCategory.id,
                helpText: 'High-protein flour (typically 12-14%) ideal for bread making, providing good structure and chew.'
            }
        });
        const wholeWheatFlour = await prisma.ingredient.create({
            data: {
                name: 'Whole Wheat Flour',
                ingredientCategoryId: flourCategory.id,
                helpText: 'Contains the entire wheat kernel. Adds nutty flavor and fiber. May require more hydration.'
            }
        });
        const ryeFlour = await prisma.ingredient.create({
            data: {
                name: 'Rye Flour',
                ingredientCategoryId: flourCategory.id,
                advanced: true,
                helpText: 'Low in gluten, adds a distinct tangy flavor and darker color.'
            }
        });
        const water = await prisma.ingredient.create({
            data: {
                name: 'Water',
                ingredientCategoryId: liquidCategory.id,
                helpText: 'Essential for hydrating flour and activating yeast.'
            }
        });
        const salt = await prisma.ingredient.create({
            data: {
                name: 'Fine Sea Salt',
                ingredientCategoryId: saltCategory.id,
                helpText: 'Use non-iodized salt. Controls yeast, strengthens gluten, and adds flavor.'
            }
        });
        const starter = await prisma.ingredient.create({
            data: {
                name: 'Sourdough Starter',
                ingredientCategoryId: prefermentCategory.id,
                helpText: 'A live culture of wild yeast and bacteria. Use when active and bubbly.'
            }
        });
        const honey = await prisma.ingredient.create({
            data: {
                name: 'Honey',
                ingredientCategoryId: enrichmentsCategory.id,
                advanced: true,
                helpText: 'Adds sweetness, moisture, and can contribute to crust color.'
            }
        });
        const oliveOil = await prisma.ingredient.create({
            data: {
                name: 'Olive Oil',
                ingredientCategoryId: enrichmentsCategory.id,
                advanced: true,
                helpText: 'Adds flavor, softness, and can extend shelf life.'
            }
        });
        console.log('✅ Created 8 core ingredients');
        // --- 5. SEED STEP TYPES ---
        console.log('📋 Creating step types...');
        const prefermentsType = await prisma.stepType.create({
            data: {
                name: 'Preferments',
                description: 'Steps related to creating and managing preferments like levain or sourdough starter.'
            }
        });
        const prepType = await prisma.stepType.create({
            data: {
                name: 'Preparation',
                description: 'Steps taken before mixing the main dough (e.g., autolyse).'
            }
        });
        const mixType = await prisma.stepType.create({
            data: {
                name: 'Mixing',
                description: 'Combining ingredients to form the dough.'
            }
        });
        const bulkType = await prisma.stepType.create({
            data: {
                name: 'Bulk Fermentation',
                description: 'The first rise of the dough, where strength and flavor develop.'
            }
        });
        const shapeProofType = await prisma.stepType.create({
            data: {
                name: 'Shaping & Proofing',
                description: 'Forming the loaf and the final rise.'
            }
        });
        const bakeType = await prisma.stepType.create({
            data: {
                name: 'Baking',
                description: 'Baking the loaf.'
            }
        });
        console.log('✅ Created 6 step types');
        // --- 6. SEED STEP PARAMETERS ---
        console.log('⚙️ Creating step parameters...');
        const durationParam = await prisma.stepParameter.create({
            data: {
                name: 'Duration (minutes)',
                type: client_1.ParameterDataType.NUMBER,
                helpText: 'The length of time for this step, in minutes.',
                defaultValue: '60'
            }
        });
        const tempParam = await prisma.stepParameter.create({
            data: {
                name: 'Temperature (°C)',
                type: client_1.ParameterDataType.NUMBER,
                helpText: 'The target ambient or dough temperature in Celsius.',
                defaultValue: '24'
            }
        });
        const numFoldsParam = await prisma.stepParameter.create({
            data: {
                name: 'Number of Folds',
                type: client_1.ParameterDataType.NUMBER,
                advanced: true,
                helpText: 'The total number of stretch and fold sets to perform.',
                defaultValue: '4'
            }
        });
        const prefermentContribParam = await prisma.stepParameter.create({
            data: {
                name: 'Contribution (pct)',
                type: client_1.ParameterDataType.NUMBER,
                helpText: 'Percentage of total formula flour used in this preferment.',
                defaultValue: '20'
            }
        });
        const prefermentHydrationParam = await prisma.stepParameter.create({
            data: {
                name: 'Hydration',
                type: client_1.ParameterDataType.NUMBER,
                helpText: 'Hydration percentage of this preferment.',
                defaultValue: '100'
            }
        });
        console.log('✅ Created 5 step parameters');
        // --- 7. SEED STEP TEMPLATES ---
        console.log('📝 Creating step templates...');
        const prefermentTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Preferment',
                stepTypeId: prefermentsType.id,
                order: 1,
                description: 'Prepare your sourdough starter or levain to ensure it is active and ready.',
                role: 'PREFERMENT',
                parameters: {
                    create: [
                        {
                            parameterId: prefermentContribParam.id,
                            helpText: "Defines how much of the recipe's total flour is in this preferment.",
                            defaultValue: '20'
                        },
                        {
                            parameterId: prefermentHydrationParam.id,
                            helpText: 'The hydration level of this preferment itself.',
                            defaultValue: '100'
                        }
                    ]
                },
                ingredientRules: {
                    create: [
                        {
                            ingredientCategoryId: flourCategory.id,
                            required: true,
                            helpText: 'Specify the flour(s) for the preferment.'
                        }
                    ]
                }
            }
        });
        const mixTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Final Mix',
                stepTypeId: mixType.id,
                order: 1,
                description: 'Combine all ingredients to form the final dough.',
                role: 'MIX',
                ingredientRules: {
                    create: [
                        {
                            ingredientCategoryId: flourCategory.id,
                            required: true,
                            helpText: 'Specify the flours to be used in the final dough.'
                        }
                    ]
                }
            }
        });
        const bulkFermentTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Bulk Ferment',
                stepTypeId: bulkType.id,
                order: 1,
                description: 'The first major rise of the dough after mixing.',
                role: 'BULK',
                parameters: {
                    create: [
                        {
                            parameterId: durationParam.id,
                            helpText: 'Highly variable (e.g., 3-6 hours). Judge by dough condition rather than time alone.',
                            defaultValue: '240'
                        },
                        {
                            parameterId: tempParam.id,
                            helpText: 'Ideal dough temperature is often 24-26°C.',
                            defaultValue: '25'
                        }
                    ]
                }
            }
        });
        const shapeTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Shape',
                stepTypeId: shapeProofType.id,
                order: 1,
                description: 'Gently degas the dough and shape it into its final form.',
                role: 'SHAPE'
            }
        });
        const proofTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Final Proof',
                stepTypeId: shapeProofType.id,
                order: 2,
                description: 'The final rise of the shaped dough before baking.',
                role: 'PROOF',
                parameters: {
                    create: [
                        {
                            parameterId: durationParam.id,
                            helpText: "Room temp: 1-3 hours. Cold proof: 8-24+ hours.",
                            defaultValue: '120'
                        },
                        {
                            parameterId: tempParam.id,
                            helpText: "Room temp (e.g., 21-24°C) or fridge (e.g., 3-5°C).",
                            defaultValue: '22'
                        }
                    ]
                }
            }
        });
        const bakeTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Bake',
                stepTypeId: bakeType.id,
                order: 1,
                description: 'Bake the proofed loaf in a hot, steamy environment initially.',
                role: 'BAKE',
                parameters: {
                    create: [
                        {
                            parameterId: durationParam.id,
                            helpText: 'Total bake time. Often split between covered and uncovered.',
                            defaultValue: '45'
                        },
                        {
                            parameterId: tempParam.id,
                            helpText: 'Preheat oven thoroughly. Often high heat initially.',
                            defaultValue: '230'
                        }
                    ]
                }
            }
        });
        console.log('✅ Created 6 step templates');
        // --- 8. SEED BASIC RECIPE ---
        console.log('📖 Creating basic recipe template...');
        const baseRecipe = await prisma.recipe.create({
            data: {
                name: 'Basic Sourdough',
                notes: 'A simple, reliable sourdough recipe perfect for beginners.',
                ownerId: systemUser.id,
                isPredefined: true,
                totalWeight: 1000,
                hydrationPct: 75,
                saltPct: 2,
                steps: {
                    create: [
                        {
                            order: 1,
                            stepTemplateId: prefermentTemplate.id,
                            parameterValues: {
                                create: [
                                    { parameterId: prefermentContribParam.id, value: 20 },
                                    { parameterId: prefermentHydrationParam.id, value: 100 }
                                ]
                            },
                            ingredients: {
                                create: [
                                    {
                                        ingredientId: breadFlour.id,
                                        amount: 100,
                                        calculationMode: client_1.IngredientCalculationMode.PERCENTAGE
                                    }
                                ]
                            }
                        },
                        {
                            order: 2,
                            stepTemplateId: mixTemplate.id,
                            ingredients: {
                                create: [
                                    {
                                        ingredientId: breadFlour.id,
                                        amount: 100,
                                        calculationMode: client_1.IngredientCalculationMode.PERCENTAGE
                                    }
                                ]
                            }
                        },
                        {
                            order: 3,
                            stepTemplateId: bulkFermentTemplate.id,
                            parameterValues: {
                                create: [
                                    { parameterId: durationParam.id, value: 300 },
                                    { parameterId: tempParam.id, value: 24 }
                                ]
                            }
                        },
                        {
                            order: 4,
                            stepTemplateId: shapeTemplate.id
                        },
                        {
                            order: 5,
                            stepTemplateId: proofTemplate.id,
                            parameterValues: {
                                create: [
                                    { parameterId: durationParam.id, value: 120 },
                                    { parameterId: tempParam.id, value: 22 }
                                ]
                            }
                        },
                        {
                            order: 6,
                            stepTemplateId: bakeTemplate.id,
                            parameterValues: {
                                create: [
                                    { parameterId: durationParam.id, value: 45 },
                                    { parameterId: tempParam.id, value: 230 }
                                ]
                            }
                        }
                    ]
                }
            }
        });
        console.log(`✅ Created basic recipe: ${baseRecipe.id} - ${baseRecipe.name}`);
        console.log(`🎉 Seeding completed successfully!`);
        // Print summary
        const counts = await Promise.all([
            prisma.user.count(),
            prisma.ingredientCategory.count(),
            prisma.ingredient.count(),
            prisma.stepType.count(),
            prisma.stepParameter.count(),
            prisma.stepTemplate.count(),
            prisma.recipe.count()
        ]);
        console.log(`📊 Summary:`);
        console.log(`   Users: ${counts[0]}`);
        console.log(`   Ingredient Categories: ${counts[1]}`);
        console.log(`   Ingredients: ${counts[2]}`);
        console.log(`   Step Types: ${counts[3]}`);
        console.log(`   Step Parameters: ${counts[4]}`);
        console.log(`   Step Templates: ${counts[5]}`);
        console.log(`   Recipes: ${counts[6]}`);
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}
main()
    .catch(async (e) => {
    console.error('💥 Fatal error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-debug.js.map