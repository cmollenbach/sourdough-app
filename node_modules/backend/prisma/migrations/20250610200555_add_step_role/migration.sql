/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Recipe` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `role` to the `StepTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StepRole" AS ENUM ('PREFERMENT', 'AUTOLYSE', 'MIX', 'ENRICH', 'INCLUSION', 'BULK', 'SHAPE', 'PROOF', 'BAKE', 'REST', 'OTHER');

-- AlterTable
ALTER TABLE "StepTemplate" ADD COLUMN     "role" "StepRole" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_name_key" ON "Recipe"("name");
