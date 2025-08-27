"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Enhanced comprehensive seed.ts based on working debug version
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        console.log(`🌱 Start seeding comprehensive dataset...`);
        // --- 1. CLEANUP ---
        console.log('🧹 Cleaning up existing data...');
        const userEmailsToDelete = ['system@sourdough.app', 'christoffer@mollenbach.com'];
        // Clean up in proper order
        await prisma.recipeStepParameterValue.deleteMany({});
        await prisma.recipeStepIngredient.deleteMany({});
        await prisma.bakeStepParameterValue.deleteMany({});
        await prisma.bakeStepIngredient.deleteMany({});
        await prisma.bakeStep.deleteMany({});
        await prisma.recipeStep.deleteMany({});
        await prisma.bake.deleteMany({});
        await prisma.recipe.deleteMany({});
        await prisma.stepTemplateParameter.deleteMany({});
        await prisma.stepTemplateIngredientRule.deleteMany({});
        await prisma.stepTemplate.deleteMany({});
        await prisma.stepType.deleteMany({});
        await prisma.stepParameter.deleteMany({});
        await prisma.account.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.userProfile.deleteMany({});
        await prisma.entityRequest.deleteMany({});
        await prisma.ingredient.deleteMany({});
        await prisma.ingredientCategory.deleteMany({});
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
        console.log(`✅ Created users: ${systemUser.email}, ${christofferUser.email}`);
        // --- 3. SEED INGREDIENT CATEGORIES ---
        console.log('📦 Creating ingredient categories...');
        const flourCategory = await prisma.ingredientCategory.create({
            data: { name: 'Flour', description: 'Various types of milled grains that form the primary structure of bread.' }
        });
        const liquidCategory = await prisma.ingredientCategory.create({
            data: { name: 'Liquid', description: 'Water, milk, or other liquids used to hydrate flour and enable gluten development.' }
        });
        const saltCategory = await prisma.ingredientCategory.create({
            data: { name: 'Salt', description: 'Crucial for flavor, strengthening gluten structure, and controlling yeast activity.' }
        });
        const prefermentCategory = await prisma.ingredientCategory.create({
            data: { name: 'Preferment', description: 'A portion of dough prepared in advance to build yeast activity and flavor complexity.' }
        });
        const inclusionsCategory = await prisma.ingredientCategory.create({
            data: { name: 'Inclusions', description: 'Optional ingredients added for texture and flavor, like fruits, nuts, seeds, or cheese.' }
        });
        const enrichmentsCategory = await prisma.ingredientCategory.create({
            data: { name: 'Enrichments', description: 'Ingredients like fats, sugars, eggs, or dairy that add flavor, softness, and richness.' }
        });
        // --- 4. SEED COMPREHENSIVE INGREDIENTS ---
        console.log('🥖 Creating comprehensive ingredients...');
        // Flours - Core
        const breadFlour = await prisma.ingredient.create({
            data: { name: 'Bread Flour', ingredientCategoryId: flourCategory.id, helpText: 'High-protein flour (typically 12-14%) ideal for bread making, providing good structure and chew.' }
        });
        const allPurposeFlour = await prisma.ingredient.create({
            data: { name: 'All-Purpose Flour', ingredientCategoryId: flourCategory.id, helpText: 'Moderate protein content (10-12%). Versatile but may result in slightly less structure than bread flour.' }
        });
        const wholeWheatFlour = await prisma.ingredient.create({
            data: { name: 'Whole Wheat Flour', ingredientCategoryId: flourCategory.id, helpText: 'Contains the entire wheat kernel. Adds nutty flavor and fiber. May require more hydration.' }
        });
        // Flours - Advanced
        const ryeFlour = await prisma.ingredient.create({
            data: { name: 'Rye Flour', ingredientCategoryId: flourCategory.id, advanced: true, helpText: 'Low in gluten, adds a distinct tangy flavor and darker color. Often used in combination with wheat flour.' }
        });
        const speltFlour = await prisma.ingredient.create({
            data: { name: 'Spelt Flour', ingredientCategoryId: flourCategory.id, advanced: true, helpText: 'An ancient grain with a nutty, slightly sweet flavor. Gluten is more delicate than wheat.' }
        });
        const einkornFlour = await prisma.ingredient.create({
            data: { name: 'Einkorn Flour', ingredientCategoryId: flourCategory.id, advanced: true, helpText: 'The most ancient wheat. Very low gluten, unique flavor. Best used in small percentages.' }
        });
        const buckwheatFlour = await prisma.ingredient.create({
            data: { name: 'Buckwheat Flour', ingredientCategoryId: flourCategory.id, advanced: true, helpText: 'Gluten-free with an earthy, nutty flavor. Adds mineral notes and dark color.' }
        });
        // Liquids
        const water = await prisma.ingredient.create({
            data: { name: 'Water', ingredientCategoryId: liquidCategory.id, helpText: 'Essential for hydrating flour and activating yeast. Water temperature can influence dough temperature and fermentation speed.' }
        });
        const milk = await prisma.ingredient.create({
            data: { name: 'Milk', ingredientCategoryId: liquidCategory.id, advanced: true, helpText: 'Adds richness, softens crumb, and can enhance browning. Can be used instead of some or all water.' }
        });
        const buttermilk = await prisma.ingredient.create({
            data: { name: 'Buttermilk', ingredientCategoryId: liquidCategory.id, advanced: true, helpText: 'Adds tang and tenderness. The acidity can help break down proteins for a softer crumb.' }
        });
        // Salts
        const fineSalt = await prisma.ingredient.create({
            data: { name: 'Fine Sea Salt', ingredientCategoryId: saltCategory.id, helpText: 'Use non-iodized salt. Fine grain dissolves easily. Controls yeast, strengthens gluten, and adds flavor.' }
        });
        const kosherlSalt = await prisma.ingredient.create({
            data: { name: 'Kosher Salt', ingredientCategoryId: saltCategory.id, helpText: 'Larger crystals than table salt. May need slightly more by volume. No additives.' }
        });
        // Preferments
        const sourdoughStarter = await prisma.ingredient.create({
            data: { name: 'Sourdough Starter', ingredientCategoryId: prefermentCategory.id, helpText: 'A live culture of wild yeast and bacteria. Use when active and bubbly (e.g., doubled in size after feeding).' }
        });
        const levain = await prisma.ingredient.create({
            data: { name: 'Levain', ingredientCategoryId: prefermentCategory.id, advanced: true, helpText: 'A specific preferment built from sourdough starter. Often made fresh for each bake.' }
        });
        // Enrichments
        const honey = await prisma.ingredient.create({
            data: { name: 'Honey', ingredientCategoryId: enrichmentsCategory.id, advanced: true, helpText: 'Adds sweetness, moisture, and can contribute to crust color. Can also speed up fermentation slightly.' }
        });
        const oliveOil = await prisma.ingredient.create({
            data: { name: 'Olive Oil', ingredientCategoryId: enrichmentsCategory.id, advanced: true, helpText: 'Adds flavor, softness, and can extend shelf life. Use extra virgin for more flavor.' }
        });
        const butter = await prisma.ingredient.create({
            data: { name: 'Butter', ingredientCategoryId: enrichmentsCategory.id, advanced: true, helpText: 'Adds rich flavor, tenderness, and a soft crumb. Typically added softened.' }
        });
        const egg = await prisma.ingredient.create({
            data: { name: 'Egg', ingredientCategoryId: enrichmentsCategory.id, advanced: true, helpText: 'Adds richness, color, and structure. Yolks add fat and flavor, whites add structure.' }
        });
        const sugar = await prisma.ingredient.create({
            data: { name: 'Sugar', ingredientCategoryId: enrichmentsCategory.id, advanced: true, helpText: 'Feeds yeast, adds sweetness, and promotes browning. Can affect texture and shelf life.' }
        });
        // Inclusions
        const walnuts = await prisma.ingredient.create({
            data: { name: 'Walnuts', ingredientCategoryId: inclusionsCategory.id, advanced: true, helpText: 'Adds a crunchy texture and earthy flavor. Best added during lamination or late in bulk fermentation.' }
        });
        const raisins = await prisma.ingredient.create({
            data: { name: 'Raisins', ingredientCategoryId: inclusionsCategory.id, advanced: true, helpText: 'Adds pockets of sweetness. Soak them in water before adding to prevent them from drawing moisture from the dough.' }
        });
        const sunflowerSeeds = await prisma.ingredient.create({
            data: { name: 'Sunflower Seeds', ingredientCategoryId: inclusionsCategory.id, advanced: true, helpText: 'Adds nutty flavor and crunch. Can be toasted beforehand for enhanced flavor.' }
        });
        const sesameSeeds = await prisma.ingredient.create({
            data: { name: 'Sesame Seeds', ingredientCategoryId: inclusionsCategory.id, advanced: true, helpText: 'Can be mixed in or used as a crust coating. Toasting them beforehand enhances their nutty flavor.' }
        });
        // "Other" options for each category
        await prisma.ingredient.createMany({
            data: [
                { name: 'Other Flour (see note)', ingredientCategoryId: flourCategory.id, helpText: 'Select this to use a flour not on the list. Specify the type and amount in the step notes.' },
                { name: 'Other Liquid (see note)', ingredientCategoryId: liquidCategory.id, helpText: 'Select this to use a liquid not on the list. Specify the type and amount in the step notes.' },
                { name: 'Other Salt (see note)', ingredientCategoryId: saltCategory.id, helpText: 'Select this to use a salt not on the list. Specify the type and amount in the step notes.' },
                { name: 'Other Preferment (see note)', ingredientCategoryId: prefermentCategory.id, helpText: 'Select this to use a preferment not on the list. Specify the type and amount in the step notes.' },
                { name: 'Other Inclusion (see note)', ingredientCategoryId: inclusionsCategory.id, advanced: true, helpText: 'Select this to use an inclusion not on the list. Specify the type and amount in the step notes.' },
                { name: 'Other Enrichment (see note)', ingredientCategoryId: enrichmentsCategory.id, advanced: true, helpText: 'Select this to use an enrichment not on the list. Specify the type and amount in the step notes.' }
            ]
        });
        console.log('✅ Created 26 comprehensive ingredients');
        // --- 5. SEED STEP TYPES ---
        console.log('📋 Creating step types...');
        const prefermentsType = await prisma.stepType.create({
            data: { name: 'Preferments', description: 'Steps related to creating and managing preferments like levain or sourdough starter.' }
        });
        const prepType = await prisma.stepType.create({
            data: { name: 'Preparation', description: 'Steps taken before mixing the main dough (e.g., autolyse).' }
        });
        const mixType = await prisma.stepType.create({
            data: { name: 'Mixing', description: 'Combining ingredients to form the dough.' }
        });
        const bulkType = await prisma.stepType.create({
            data: { name: 'Bulk Fermentation', description: 'The first rise of the dough, where strength and flavor develop.' }
        });
        const shapeProofType = await prisma.stepType.create({
            data: { name: 'Shaping & Proofing', description: 'Forming the loaf and the final rise.' }
        });
        const bakeType = await prisma.stepType.create({
            data: { name: 'Baking', description: 'Baking the loaf.' }
        });
        // --- 6. SEED STEP PARAMETERS ---
        console.log('⚙️ Creating step parameters...');
        const durationParam = await prisma.stepParameter.create({
            data: { name: 'Duration (minutes)', type: client_1.ParameterDataType.NUMBER, helpText: 'The length of time for this step, in minutes.', defaultValue: '60' }
        });
        const tempParam = await prisma.stepParameter.create({
            data: { name: 'Temperature (°C)', type: client_1.ParameterDataType.NUMBER, helpText: 'The target ambient or dough temperature in Celsius.', defaultValue: '24' }
        });
        const numFoldsParam = await prisma.stepParameter.create({
            data: { name: 'Number of Folds', type: client_1.ParameterDataType.NUMBER, advanced: true, helpText: 'The total number of stretch and fold sets to perform.', defaultValue: '4' }
        });
        const prefermentContribParam = await prisma.stepParameter.create({
            data: { name: 'Contribution (pct)', type: client_1.ParameterDataType.NUMBER, helpText: 'Percentage of total formula flour used in this preferment.', defaultValue: '20' }
        });
        const prefermentHydrationParam = await prisma.stepParameter.create({
            data: { name: 'Hydration', type: client_1.ParameterDataType.NUMBER, helpText: 'Hydration percentage of this preferment.', defaultValue: '100' }
        });
        const steamParam = await prisma.stepParameter.create({
            data: { name: 'Steam Duration (min)', type: client_1.ParameterDataType.NUMBER, advanced: true, helpText: 'How long to maintain steam in the oven.', defaultValue: '20' }
        });
        // --- 7. SEED COMPREHENSIVE STEP TEMPLATES ---
        console.log('📝 Creating comprehensive step templates...');
        const prefermentTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Preferment',
                stepTypeId: prefermentsType.id,
                order: 1,
                description: 'Prepare your sourdough starter or levain to ensure it is active and ready to leaven the dough.',
                role: 'PREFERMENT',
                parameters: {
                    create: [
                        { parameterId: prefermentContribParam.id, helpText: "Defines how much of the recipe's total flour is in this preferment.", defaultValue: '20' },
                        { parameterId: prefermentHydrationParam.id, helpText: 'The hydration level of this preferment itself.', defaultValue: '100' }
                    ]
                },
                ingredientRules: {
                    create: [
                        { ingredientCategoryId: flourCategory.id, required: true, helpText: 'Specify the flour(s) for the preferment.' }
                    ]
                }
            }
        });
        const autolyseTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Autolyse',
                stepTypeId: prepType.id,
                order: 1,
                advanced: true,
                description: 'A preliminary mix of just flour and water, allowed to rest. This hydrates the flour and improves final texture.',
                role: 'AUTOLYSE',
                parameters: {
                    create: [
                        { parameterId: durationParam.id, helpText: 'Typical autolyse duration is 20-60 minutes. Longer can be beneficial for whole grain flours.', defaultValue: '30' }
                    ]
                },
                ingredientRules: {
                    create: [
                        { ingredientCategoryId: flourCategory.id, required: true, helpText: 'The main flours for your recipe. Liquid will be calculated automatically.' }
                    ]
                }
            }
        });
        const mixTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Final Mix',
                stepTypeId: mixType.id,
                order: 1,
                description: 'Combine all remaining ingredients to form the final dough. Develop gluten to a moderate level.',
                role: 'MIX',
                ingredientRules: {
                    create: [
                        { ingredientCategoryId: flourCategory.id, required: true, helpText: 'Specify the flours to be used in the final dough.' }
                    ]
                }
            }
        });
        const enrichTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Add Enrichments',
                stepTypeId: mixType.id,
                order: 2,
                advanced: true,
                description: 'Incorporate ingredients like fats, sugars, eggs, or dairy. These add flavor, softness, and richness.',
                role: 'ENRICH',
                ingredientRules: {
                    create: [
                        { ingredientCategoryId: enrichmentsCategory.id, helpText: 'Add softened butter, oil, sugar, honey, eggs, etc. as specified by the recipe.' }
                    ]
                }
            }
        });
        const bulkFermentTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Bulk Ferment',
                stepTypeId: bulkType.id,
                order: 1,
                description: 'The first major rise of the dough after mixing. During this time, yeast produces CO2, and gluten structure develops.',
                role: 'BULK',
                parameters: {
                    create: [
                        { parameterId: durationParam.id, helpText: 'Highly variable (e.g., 3-6 hours). Judge by dough condition rather than time alone.', defaultValue: '240' },
                        { parameterId: tempParam.id, helpText: 'Ideal dough temperature is often 24-26°C.', defaultValue: '25' }
                    ]
                }
            }
        });
        const stretchFoldTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Stretch & Fold',
                stepTypeId: bulkType.id,
                order: 2,
                description: 'A gentle technique to develop gluten strength during bulk fermentation. Performed periodically.',
                role: 'BULK',
                parameters: {
                    create: [
                        { parameterId: numFoldsParam.id, helpText: 'Typically 2-4 sets of folds, spaced 30-60 minutes apart.', defaultValue: '3' }
                    ]
                }
            }
        });
        const laminationTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Lamination',
                stepTypeId: bulkType.id,
                order: 3,
                advanced: true,
                description: 'A technique where dough is stretched very thin and then folded, often to incorporate inclusions evenly.',
                role: 'INCLUSION',
                ingredientRules: {
                    create: [
                        { ingredientCategoryId: inclusionsCategory.id, helpText: 'Spread inclusions (nuts, seeds, cheese, etc.) over the stretched dough before folding.' }
                    ]
                }
            }
        });
        const shapeTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Shape',
                stepTypeId: shapeProofType.id,
                order: 1,
                description: 'Gently degas the dough and shape it into its final form (e.g., boule, bâtard).',
                role: 'SHAPE'
            }
        });
        const proofTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Final Proof',
                stepTypeId: shapeProofType.id,
                order: 2,
                description: 'The final rise of the shaped dough before baking. Can be done at room temperature or in the refrigerator.',
                role: 'PROOF',
                parameters: {
                    create: [
                        { parameterId: durationParam.id, helpText: "Room temp: 1-3 hours. Cold proof: 8-24+ hours.", defaultValue: '120' },
                        { parameterId: tempParam.id, helpText: "Room temp (e.g., 21-24°C) or fridge (e.g., 3-5°C).", defaultValue: '22' }
                    ]
                }
            }
        });
        const bakeTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Bake',
                stepTypeId: bakeType.id,
                order: 1,
                description: 'Bake the proofed loaf, typically in a hot, steamy environment initially.',
                role: 'BAKE',
                parameters: {
                    create: [
                        { parameterId: durationParam.id, helpText: 'Total bake time. Often split between covered and uncovered.', defaultValue: '45' },
                        { parameterId: tempParam.id, helpText: 'Preheat oven thoroughly. Often high heat initially.', defaultValue: '230' },
                        { parameterId: steamParam.id, helpText: 'Duration to maintain steam for oven spring.', defaultValue: '20' }
                    ]
                }
            }
        });
        const restTemplate = await prisma.stepTemplate.create({
            data: {
                name: 'Rest',
                stepTypeId: bakeType.id,
                order: 2,
                description: 'Crucial step after baking. Allows the internal structure to set and moisture to redistribute.',
                role: 'REST',
                parameters: {
                    create: [
                        { parameterId: durationParam.id, helpText: 'Minimum 1-2 hours on a wire rack. Larger or denser loaves may need longer.', defaultValue: '120' }
                    ]
                }
            }
        });
        console.log('✅ Created 11 comprehensive step templates');
        // --- 8. SEED MULTIPLE RECIPE TEMPLATES ---
        console.log('📖 Creating multiple recipe templates...');
        // 1. Basic Sourdough
        const basicSourdough = await prisma.recipe.create({
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
                            parameterValues: { create: [
                                    { parameterId: prefermentContribParam.id, value: 20 },
                                    { parameterId: prefermentHydrationParam.id, value: 100 }
                                ] },
                            ingredients: { create: [
                                    { ingredientId: breadFlour.id, amount: 100, calculationMode: client_1.IngredientCalculationMode.PERCENTAGE }
                                ] }
                        },
                        {
                            order: 2,
                            stepTemplateId: mixTemplate.id,
                            ingredients: { create: [
                                    { ingredientId: breadFlour.id, amount: 100, calculationMode: client_1.IngredientCalculationMode.PERCENTAGE }
                                ] }
                        },
                        {
                            order: 3,
                            stepTemplateId: bulkFermentTemplate.id,
                            parameterValues: { create: [
                                    { parameterId: durationParam.id, value: 300 },
                                    { parameterId: tempParam.id, value: 24 }
                                ] }
                        },
                        {
                            order: 4,
                            stepTemplateId: shapeTemplate.id
                        },
                        {
                            order: 5,
                            stepTemplateId: proofTemplate.id,
                            parameterValues: { create: [
                                    { parameterId: durationParam.id, value: 120 },
                                    { parameterId: tempParam.id, value: 22 }
                                ] }
                        },
                        {
                            order: 6,
                            stepTemplateId: bakeTemplate.id,
                            parameterValues: { create: [
                                    { parameterId: durationParam.id, value: 45 },
                                    { parameterId: tempParam.id, value: 230 }
                                ] }
                        }
                    ]
                }
            }
        });
        // 2. Whole Wheat Sourdough
        const wholeWheatSourdough = await prisma.recipe.create({
            data: {
                name: 'Whole Wheat Sourdough',
                notes: 'A heartier loaf with the nutty flavor of whole wheat. Requires careful hydration management.',
                ownerId: systemUser.id,
                isPredefined: true,
                totalWeight: 1020,
                hydrationPct: 78,
                saltPct: 2.2,
                steps: {
                    create: [
                        {
                            order: 1,
                            stepTemplateId: prefermentTemplate.id,
                            parameterValues: { create: [
                                    { parameterId: prefermentContribParam.id, value: 20 },
                                    { parameterId: prefermentHydrationParam.id, value: 100 }
                                ] },
                            ingredients: { create: [
                                    { ingredientId: breadFlour.id, amount: 100, calculationMode: client_1.IngredientCalculationMode.PERCENTAGE }
                                ] }
                        },
                        {
                            order: 2,
                            stepTemplateId: autolyseTemplate.id,
                            notes: 'Whole wheat benefits from autolyse to soften the bran.',
                            parameterValues: { create: [
                                    { parameterId: durationParam.id, value: 45 }
                                ] }
                        },
                        {
                            order: 3,
                            stepTemplateId: mixTemplate.id,
                            ingredients: { create: [
                                    { ingredientId: breadFlour.id, amount: 70, calculationMode: client_1.IngredientCalculationMode.PERCENTAGE },
                                    { ingredientId: wholeWheatFlour.id, amount: 30, calculationMode: client_1.IngredientCalculationMode.PERCENTAGE }
                                ] }
                        },
                        {
                            order: 4,
                            stepTemplateId: bulkFermentTemplate.id,
                            notes: 'Whole wheat can ferment faster. Watch for signs of proper rise.',
                            parameterValues: { create: [
                                    { parameterId: durationParam.id, value: 240 },
                                    { parameterId: tempParam.id, value: 24 }
                                ] }
                        },
                        {
                            order: 5,
                            stepTemplateId: shapeTemplate.id
                        },
                        {
                            order: 6,
                            stepTemplateId: proofTemplate.id,
                            notes: 'Cold proof enhances flavor and makes scoring easier.',
                            parameterValues: { create: [
                                    { parameterId: durationParam.id, value: 720 },
                                    { parameterId: tempParam.id, value: 4 }
                                ] }
                        },
                        {
                            order: 7,
                            stepTemplateId: bakeTemplate.id,
                            parameterValues: { create: [
                                    { parameterId: durationParam.id, value: 45 },
                                    { parameterId: tempParam.id, value: 230 }
                                ] }
                        }
                    ]
                }
            }
        });
        // 3. Walnut Raisin Sourdough
        const walnutRaisinSourdough = await prisma.recipe.create({
            data: {
                name: 'Walnut Raisin Sourdough',
                notes: 'A classic combination of crunchy walnuts and sweet raisins. Perfect for breakfast or with cheese.',
                ownerId: systemUser.id,
                isPredefined: true,
                totalWeight: 1150,
                hydrationPct: 75,
                saltPct: 2,
                steps: {
                    create: [
                        {
                            order: 1,
                            stepTemplateId: prefermentTemplate.id,
                            parameterValues: { create: [
                                    { parameterId: prefermentContribParam.id, value: 20 },
                                    { parameterId: prefermentHydrationParam.id, value: 100 }
                                ] },
                            ingredients: { create: [
                                    { ingredientId: breadFlour.id, amount: 100, calculationMode: client_1.IngredientCalculationMode.PERCENTAGE }
                                ] }
                        },
                        {
                            order: 2,
                            stepTemplateId: mixTemplate.id,
                            ingredients: { create: [
                                    { ingredientId: breadFlour.id, amount: 100, calculationMode: client_1.IngredientCalculationMode.PERCENTAGE }
                                ] }
                        },
                        {
                            order: 3,
                            stepTemplateId: bulkFermentTemplate.id,
                            parameterValues: { create: [
                                    { parameterId: durationParam.id, value: 180 },
                                    { parameterId: tempParam.id, value: 24 }
                                ] }
                        },
                        {
                            order: 4,
                            stepTemplateId: laminationTemplate.id,
                            notes: 'Gently incorporate the walnuts and raisins. Soak raisins in warm water for 10 minutes first.',
                            ingredients: { create: [
                                    { ingredientId: walnuts.id, amount: 100, calculationMode: client_1.IngredientCalculationMode.FIXED_WEIGHT },
                                    { ingredientId: raisins.id, amount: 80, calculationMode: client_1.IngredientCalculationMode.FIXED_WEIGHT }
                                ] }
                        },
                        {
                            order: 5,
                            stepTemplateId: bulkFermentTemplate.id,
                            notes: 'Continue bulk fermentation after adding inclusions.',
                            parameterValues: { create: [
                                    { parameterId: durationParam.id, value: 120 },
                                    { parameterId: tempParam.id, value: 24 }
                                ] }
                        },
                        {
                            order: 6,
                            stepTemplateId: shapeTemplate.id
                        },
                        {
                            order: 7,
                            stepTemplateId: proofTemplate.id,
                            parameterValues: { create: [
                                    { parameterId: durationParam.id, value: 120 },
                                    { parameterId: tempParam.id, value: 22 }
                                ] }
                        },
                        {
                            order: 8,
                            stepTemplateId: bakeTemplate.id,
                            parameterValues: { create: [
                                    { parameterId: durationParam.id, value: 50 },
                                    { parameterId: tempParam.id, value: 220 }
                                ] }
                        }
                    ]
                }
            }
        });
        console.log(`✅ Created 3 comprehensive recipe templates`);
        console.log(`🎉 Comprehensive seeding completed successfully!`);
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
        console.log(`📊 Final Summary:`);
        console.log(`   Users: ${counts[0]}`);
        console.log(`   Ingredient Categories: ${counts[1]}`);
        console.log(`   Ingredients: ${counts[2]}`);
        console.log(`   Step Types: ${counts[3]}`);
        console.log(`   Step Parameters: ${counts[4]}`);
        console.log(`   Step Templates: ${counts[5]}`);
        console.log(`   Recipes: ${counts[6]}`);
    }
    catch (error) {
        console.error('❌ Comprehensive seeding failed:', error);
        throw error;
    }
}
main()
    .catch(async (e) => {
    console.error('💥 Fatal error during comprehensive seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-comprehensive.js.map