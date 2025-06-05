// scripts/exportRecipes.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const recipes = await prisma.recipe.findMany();
  console.log(JSON.stringify(recipes, null, 2));
}

main().finally(() => prisma.$disconnect());