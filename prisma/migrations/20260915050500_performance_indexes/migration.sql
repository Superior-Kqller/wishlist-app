-- CreateIndex
CREATE INDEX "User_createdAt_id_idx" ON "User"("createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Item_listId_createdAt_idx" ON "Item"("listId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ItemComment_itemId_createdAt_idx" ON "ItemComment"("itemId", "createdAt");
