-- Step 1: Rename the tables
ALTER TABLE "Field" RENAME TO "StepParameter";
ALTER TABLE "RecipeField" RENAME TO "RecipeParameter";
ALTER TABLE "RecipeFieldValue" RENAME TO "RecipeParameterValue";
ALTER TABLE "RecipeStepField" RENAME TO "RecipeStepParameterValue";
ALTER TABLE "StepTemplateField" RENAME TO "StepTemplateParameter";
ALTER TABLE "BakeStepField" RENAME TO "BakeStepParameterValue";

-- Step 2: Rename Primary Keys
ALTER INDEX "Field_pkey" RENAME TO "StepParameter_pkey";
ALTER INDEX "RecipeField_pkey" RENAME TO "RecipeParameter_pkey";
ALTER INDEX "RecipeFieldValue_pkey" RENAME TO "RecipeParameterValue_pkey";
ALTER INDEX "RecipeStepField_pkey" RENAME TO "RecipeStepParameterValue_pkey";
ALTER INDEX "StepTemplateField_pkey" RENAME TO "StepTemplateParameter_pkey";
ALTER INDEX "BakeStepField_pkey" RENAME TO "BakeStepParameterValue_pkey";

-- Step 3: Rename Unique Indexes and Foreign Key Constraints
ALTER INDEX "RecipeField_name_key" RENAME TO "RecipeParameter_name_key";
ALTER INDEX "RecipeFieldValue_recipeId_fieldId_key" RENAME TO "RecipeParameterValue_recipeId_fieldId_key";
ALTER TABLE "RecipeParameterValue" RENAME CONSTRAINT "RecipeFieldValue_fieldId_fkey" TO "RecipeParameterValue_parameterId_fkey";
ALTER TABLE "RecipeParameterValue" RENAME CONSTRAINT "RecipeFieldValue_recipeId_fkey" TO "RecipeParameterValue_recipeId_fkey";

ALTER TABLE "RecipeStepParameterValue" RENAME CONSTRAINT "RecipeStepField_fieldId_fkey" TO "RecipeStepParameterValue_parameterId_fkey";
ALTER TABLE "RecipeStepParameterValue" RENAME CONSTRAINT "RecipeStepField_recipeStepId_fkey" TO "RecipeStepParameterValue_recipeStepId_fkey";

ALTER TABLE "StepTemplateParameter" RENAME CONSTRAINT "StepTemplateField_fieldId_fkey" TO "StepTemplateParameter_parameterId_fkey";
ALTER TABLE "StepTemplateParameter" RENAME CONSTRAINT "StepTemplateField_stepTemplateId_fkey" TO "StepTemplateParameter_stepTemplateId_fkey";

ALTER TABLE "BakeStepParameterValue" RENAME CONSTRAINT "BakeStepField_bakeStepId_fkey" TO "BakeStepParameterValue_bakeStepId_fkey";
ALTER TABLE "BakeStepParameterValue" RENAME CONSTRAINT "BakeStepField_fieldId_fkey" TO "BakeStepParameterValue_parameterId_fkey";

-- Step 4: Rename the underlying foreign key COLUMN names
ALTER TABLE "RecipeParameterValue" RENAME COLUMN "fieldId" TO "parameterId";
ALTER TABLE "RecipeStepParameterValue" RENAME COLUMN "fieldId" TO "parameterId";
ALTER TABLE "StepTemplateParameter" RENAME COLUMN "fieldId" TO "parameterId";
ALTER TABLE "BakeStepParameterValue" RENAME COLUMN "fieldId" TO "parameterId";