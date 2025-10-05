/*
  Warnings:

  - You are about to drop the column `hydrationPct` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `saltPct` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `totalWeight` on the `Recipe` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Field" ADD COLUMN     "helpText" TEXT,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "defaultValue" TEXT,
ADD COLUMN     "helpText" TEXT,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "hydrationPct",
DROP COLUMN "name",
DROP COLUMN "notes",
DROP COLUMN "saltPct",
DROP COLUMN "totalWeight";

-- AlterTable
ALTER TABLE "StepTemplateField" ADD COLUMN     "helpText" TEXT,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "StepTemplateIngredientRule" ADD COLUMN     "advanced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultValue" TEXT,
ADD COLUMN     "helpText" TEXT,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "RecipeField" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT,
    "type" TEXT NOT NULL,
    "order" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "advanced" BOOLEAN NOT NULL DEFAULT false,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "helpText" TEXT,
    "defaultValue" TEXT,

    CONSTRAINT "RecipeField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeFieldValue" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "RecipeFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecipeField_name_key" ON "RecipeField"("name");

-- AddForeignKey
ALTER TABLE "RecipeFieldValue" ADD CONSTRAINT "RecipeFieldValue_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeFieldValue" ADD CONSTRAINT "RecipeFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "RecipeField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
