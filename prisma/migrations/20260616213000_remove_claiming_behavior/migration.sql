UPDATE "Item"
SET
  "status" = CASE
    WHEN "purchased" THEN 'PURCHASED'::"ItemStatus"
    ELSE 'AVAILABLE'::"ItemStatus"
  END,
  "claimedByUserId" = NULL,
  "claimedAt" = NULL
WHERE "status" = 'CLAIMED';
