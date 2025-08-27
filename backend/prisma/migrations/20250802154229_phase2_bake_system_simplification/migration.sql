/*
  Warnings:

  - The values [DURATION] on the enum `ParameterDataType` will be removed. If these variants are still used in the database, this will fail.
  - The values [MODERATOR] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userProfileId` on the `UserAction` table. All the data in the column will be lost.
  - You are about to drop the column `userProfileId` on the `UserPreference` table. All the data in the column will be lost.
  - You are about to alter the column `defaultHydration` on the `UserProfile` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `preferredSaltPct` on the `UserProfile` table. The data in that column could be lost. The data in that column will be cast from `Decimal(4,2)` to `DoublePrecision`.
  - You are about to drop the `UserExperienceProfile` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `experienceLevel` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `recipesCreated` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bakesCompleted` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalBakeTimeMinutes` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `averageSessionMinutes` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastActiveAt` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `showAdvancedFields` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `autoSaveEnabled` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `defaultHydration` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `preferredSaltPct` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `expandStepsOnLoad` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `showIngredientHelp` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ParameterDataType_new" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE');
ALTER TABLE "StepParameter" ALTER COLUMN "type" TYPE "ParameterDataType_new" USING ("type"::text::"ParameterDataType_new");
ALTER TYPE "ParameterDataType" RENAME TO "ParameterDataType_old";
ALTER TYPE "ParameterDataType_new" RENAME TO "ParameterDataType";
DROP TYPE "ParameterDataType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "UserAction" DROP CONSTRAINT "UserAction_profileId_fkey";

-- DropForeignKey
ALTER TABLE "UserAction" DROP CONSTRAINT "fk_user_action_user_profile";

-- DropForeignKey
ALTER TABLE "UserExperienceProfile" DROP CONSTRAINT "UserExperienceProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreference" DROP CONSTRAINT "UserPreference_profileId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreference" DROP CONSTRAINT "fk_user_preference_user_profile";

-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_userId_fkey";

-- DropIndex
DROP INDEX "idx_user_action_user_profile";

-- DropIndex
DROP INDEX "idx_user_preference_user_profile";

-- DropIndex
DROP INDEX "idx_user_profile_experience_level";

-- DropIndex
DROP INDEX "idx_user_profile_last_active";

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "defaultPreparation" TEXT;

-- AlterTable
ALTER TABLE "IngredientCategory" ADD COLUMN     "advanced" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StepTemplateIngredientRule" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultValue" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "UserAction" DROP COLUMN "userProfileId";

-- AlterTable
ALTER TABLE "UserPreference" DROP COLUMN "userProfileId";

-- AlterTable
ALTER TABLE "UserProfile" ALTER COLUMN "experienceLevel" SET NOT NULL,
ALTER COLUMN "experienceLevel" SET DATA TYPE TEXT,
ALTER COLUMN "recipesCreated" SET NOT NULL,
ALTER COLUMN "bakesCompleted" SET NOT NULL,
ALTER COLUMN "totalBakeTimeMinutes" SET NOT NULL,
ALTER COLUMN "preferredDifficulty" SET DATA TYPE TEXT,
ALTER COLUMN "averageSessionMinutes" SET NOT NULL,
ALTER COLUMN "lastActiveAt" SET NOT NULL,
ALTER COLUMN "lastActiveAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "showAdvancedFields" SET NOT NULL,
ALTER COLUMN "autoSaveEnabled" SET NOT NULL,
ALTER COLUMN "defaultHydration" SET NOT NULL,
ALTER COLUMN "defaultHydration" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "preferredSaltPct" SET NOT NULL,
ALTER COLUMN "preferredSaltPct" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "expandStepsOnLoad" SET NOT NULL,
ALTER COLUMN "showIngredientHelp" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- DropTable
DROP TABLE "UserExperienceProfile";

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
