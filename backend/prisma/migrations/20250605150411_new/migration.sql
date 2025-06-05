/*
  Warnings:

  - A unique constraint covering the columns `[recipeId,fieldId]` on the table `RecipeFieldValue` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RecipeFieldValue_recipeId_fieldId_key" ON "RecipeFieldValue"("recipeId", "fieldId");
