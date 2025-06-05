-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'user',
    "notes" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "passwordHash" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "preferences" JSONB,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER,

    CONSTRAINT "StepType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "advanced" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultValue" TEXT,
    "order" INTEGER,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER,

    CONSTRAINT "IngredientCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ingredientCategoryId" INTEGER NOT NULL,
    "advanced" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stepTypeId" INTEGER NOT NULL,
    "advanced" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER,

    CONSTRAINT "StepTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepTemplateField" (
    "id" SERIAL NOT NULL,
    "stepTemplateId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "advanced" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultValue" TEXT,
    "order" INTEGER,

    CONSTRAINT "StepTemplateField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepTemplateIngredientRule" (
    "id" SERIAL NOT NULL,
    "stepTemplateId" INTEGER NOT NULL,
    "ingredientCategoryId" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StepTemplateIngredientRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "totalWeight" DOUBLE PRECISION,
    "hydrationPct" DOUBLE PRECISION,
    "saltPct" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "parentRecipeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isPredefined" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeStep" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "stepTemplateId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "RecipeStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeStepField" (
    "id" SERIAL NOT NULL,
    "recipeStepId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "value" JSONB NOT NULL,
    "notes" TEXT,

    CONSTRAINT "RecipeStepField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeStepIngredient" (
    "id" SERIAL NOT NULL,
    "recipeStepId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "preparation" TEXT,
    "notes" TEXT,

    CONSTRAINT "RecipeStepIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bake" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "startTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishTimestamp" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "parentBakeId" INTEGER,
    "notes" TEXT,

    CONSTRAINT "Bake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BakeStep" (
    "id" SERIAL NOT NULL,
    "bakeId" INTEGER NOT NULL,
    "recipeStepId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "startTimestamp" TIMESTAMP(3),
    "finishTimestamp" TIMESTAMP(3),
    "deviations" JSONB,
    "notes" TEXT,

    CONSTRAINT "BakeStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BakeStepField" (
    "id" SERIAL NOT NULL,
    "bakeStepId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "plannedValue" JSONB NOT NULL,
    "actualValue" JSONB,
    "notes" TEXT,

    CONSTRAINT "BakeStepField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BakeStepIngredient" (
    "id" SERIAL NOT NULL,
    "bakeStepId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "plannedPercentage" DOUBLE PRECISION NOT NULL,
    "plannedPreparation" TEXT,
    "notes" TEXT,

    CONSTRAINT "BakeStepIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StepType_name_key" ON "StepType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Field_name_key" ON "Field"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientCategory_name_key" ON "IngredientCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StepTemplate_name_key" ON "StepTemplate"("name");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_ingredientCategoryId_fkey" FOREIGN KEY ("ingredientCategoryId") REFERENCES "IngredientCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepTemplate" ADD CONSTRAINT "StepTemplate_stepTypeId_fkey" FOREIGN KEY ("stepTypeId") REFERENCES "StepType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepTemplateField" ADD CONSTRAINT "StepTemplateField_stepTemplateId_fkey" FOREIGN KEY ("stepTemplateId") REFERENCES "StepTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepTemplateField" ADD CONSTRAINT "StepTemplateField_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepTemplateIngredientRule" ADD CONSTRAINT "StepTemplateIngredientRule_stepTemplateId_fkey" FOREIGN KEY ("stepTemplateId") REFERENCES "StepTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepTemplateIngredientRule" ADD CONSTRAINT "StepTemplateIngredientRule_ingredientCategoryId_fkey" FOREIGN KEY ("ingredientCategoryId") REFERENCES "IngredientCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_parentRecipeId_fkey" FOREIGN KEY ("parentRecipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStep" ADD CONSTRAINT "RecipeStep_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStep" ADD CONSTRAINT "RecipeStep_stepTemplateId_fkey" FOREIGN KEY ("stepTemplateId") REFERENCES "StepTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStepField" ADD CONSTRAINT "RecipeStepField_recipeStepId_fkey" FOREIGN KEY ("recipeStepId") REFERENCES "RecipeStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStepField" ADD CONSTRAINT "RecipeStepField_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStepIngredient" ADD CONSTRAINT "RecipeStepIngredient_recipeStepId_fkey" FOREIGN KEY ("recipeStepId") REFERENCES "RecipeStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStepIngredient" ADD CONSTRAINT "RecipeStepIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bake" ADD CONSTRAINT "Bake_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bake" ADD CONSTRAINT "Bake_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bake" ADD CONSTRAINT "Bake_parentBakeId_fkey" FOREIGN KEY ("parentBakeId") REFERENCES "Bake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BakeStep" ADD CONSTRAINT "BakeStep_bakeId_fkey" FOREIGN KEY ("bakeId") REFERENCES "Bake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BakeStep" ADD CONSTRAINT "BakeStep_recipeStepId_fkey" FOREIGN KEY ("recipeStepId") REFERENCES "RecipeStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BakeStepField" ADD CONSTRAINT "BakeStepField_bakeStepId_fkey" FOREIGN KEY ("bakeStepId") REFERENCES "BakeStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BakeStepField" ADD CONSTRAINT "BakeStepField_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BakeStepIngredient" ADD CONSTRAINT "BakeStepIngredient_bakeStepId_fkey" FOREIGN KEY ("bakeStepId") REFERENCES "BakeStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BakeStepIngredient" ADD CONSTRAINT "BakeStepIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
