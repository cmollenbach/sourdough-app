-- AlterTable
ALTER TABLE "RecipeStep" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "EntityRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "extra" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewerId" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EntityRequest" ADD CONSTRAINT "EntityRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRequest" ADD CONSTRAINT "EntityRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
