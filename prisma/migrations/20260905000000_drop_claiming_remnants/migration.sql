-- Остатки «застолбить подарок».
--
-- Саму возможность убрала 20260616213000_remove_claiming_behavior: она
-- перевела записи из CLAIMED в AVAILABLE/PURCHASED, но колонки, индекс и
-- значение перечисления пережили удаление фичи. Записать CLAIMED с тех пор
-- нечем — переход в него запрещён в коде, — так что здесь уходит хранение.

-- Страховка на случай восстановления из дампа старше миграции удаления:
-- переводим ровно так же, как это делала она.
UPDATE "Item"
SET "status" = CASE
    WHEN "purchased" THEN 'PURCHASED'::"ItemStatus"
    ELSE 'AVAILABLE'::"ItemStatus"
  END
WHERE "status" = 'CLAIMED';

-- Вместе с колонкой уходят её внешний ключ и индекс.
ALTER TABLE "Item" DROP COLUMN "claimedByUserId";
ALTER TABLE "Item" DROP COLUMN "claimedAt";

-- Перечисление пересоздаётся: удалить одно значение на месте Postgres не умеет.
ALTER TYPE "ItemStatus" RENAME TO "ItemStatus_old";
CREATE TYPE "ItemStatus" AS ENUM ('AVAILABLE', 'PURCHASED');
ALTER TABLE "Item" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Item" ALTER COLUMN "status" TYPE "ItemStatus" USING ("status"::text::"ItemStatus");
ALTER TABLE "Item" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
DROP TYPE "ItemStatus_old";
