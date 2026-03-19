-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('AVAILABLE', 'CLAIMED', 'PURCHASED');

-- AlterTable
ALTER TABLE "Item"
ADD COLUMN "status" "ItemStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN "claimedByUserId" TEXT,
ADD COLUMN "claimedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Item_status_idx" ON "Item"("status");
CREATE INDEX "Item_claimedByUserId_idx" ON "Item"("claimedByUserId");

-- AddForeignKey
ALTER TABLE "Item"
ADD CONSTRAINT "Item_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
