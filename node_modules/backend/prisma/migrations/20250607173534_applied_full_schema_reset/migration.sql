/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `Account` table. All the data in the column will be lost.
  - The `status` column on the `BakeStep` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `EntityRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `percentage` on the `RecipeStepIngredient` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `EntityRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `RecipeParameter` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `amount` to the `RecipeStepIngredient` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `StepParameter` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "ParameterDataType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE', 'DURATION');

-- CreateEnum
CREATE TYPE "IngredientCalculationMode" AS ENUM ('PERCENTAGE', 'FIXED_WEIGHT');

-- CreateEnum
CREATE TYPE "StepExecutionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "EntityRequestType" AS ENUM ('INGREDIENT_SUGGESTION', 'FEATURE_REQUEST', 'BUG_REPORT', 'RECIPE_SUBMISSION', 'OTHER');

-- CreateEnum
CREATE TYPE "EntityRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'CLOSED');

-- DropForeignKey
ALTER TABLE "Bake" DROP CONSTRAINT "Bake_parentBakeId_fkey";

-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_parentRecipeId_fkey";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "passwordHash";

-- AlterTable
ALTER TABLE "BakeStep" DROP COLUMN "status",
ADD COLUMN     "status" "StepExecutionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "EntityRequest" DROP COLUMN "type",
ADD COLUMN     "type" "EntityRequestType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "EntityRequestStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "hydrationPct" DOUBLE PRECISION,
ADD COLUMN     "saltPct" DOUBLE PRECISION,
ADD COLUMN     "totalWeight" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "RecipeParameter" DROP COLUMN "type",
ADD COLUMN     "type" "ParameterDataType" NOT NULL;

-- AlterTable
ALTER TABLE "RecipeStepIngredient" DROP COLUMN "percentage",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "calculationMode" "IngredientCalculationMode" NOT NULL DEFAULT 'PERCENTAGE';

-- AlterTable
ALTER TABLE "StepParameter" DROP COLUMN "type",
ADD COLUMN     "type" "ParameterDataType" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_parentRecipeId_fkey" FOREIGN KEY ("parentRecipeId") REFERENCES "Recipe"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Bake" ADD CONSTRAINT "Bake_parentBakeId_fkey" FOREIGN KEY ("parentBakeId") REFERENCES "Bake"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- RenameIndex
ALTER INDEX "RecipeParameterValue_recipeId_fieldId_key" RENAME TO "RecipeParameterValue_recipeId_parameterId_key";

-- RenameIndex
ALTER INDEX "Field_name_key" RENAME TO "StepParameter_name_key";
