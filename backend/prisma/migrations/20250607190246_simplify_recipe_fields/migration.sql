/*
  Warnings:

  - You are about to drop the `RecipeParameter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RecipeParameterValue` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RecipeParameterValue" DROP CONSTRAINT "RecipeParameterValue_parameterId_fkey";

-- DropForeignKey
ALTER TABLE "RecipeParameterValue" DROP CONSTRAINT "RecipeParameterValue_recipeId_fkey";

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT;

-- DropTable
DROP TABLE "RecipeParameter";

-- DropTable
DROP TABLE "RecipeParameterValue";
