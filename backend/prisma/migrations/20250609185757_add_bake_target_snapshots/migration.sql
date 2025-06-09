-- AlterTable
ALTER TABLE "Bake" ADD COLUMN     "recipeHydrationPctSnapshot" DOUBLE PRECISION,
ADD COLUMN     "recipeSaltPctSnapshot" DOUBLE PRECISION,
ADD COLUMN     "recipeTotalWeightSnapshot" DOUBLE PRECISION;
