ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "category" TEXT;

WITH first_tag AS (
  SELECT DISTINCT ON (it."A")
    it."A" AS "itemId",
    lower(t."name") AS "tagName"
  FROM "_ItemToTag" it
  JOIN "Tag" t ON t."id" = it."B"
  ORDER BY it."A", t."name"
)
UPDATE "Item" item
SET "category" = CASE
  WHEN first_tag."tagName" IN ('electronics', 'техника', 'электроника', 'гаджеты') THEN 'electronics'
  WHEN first_tag."tagName" IN ('gaming', 'игры', 'игры и пк', 'пк', 'pc', 'компьютер', 'комплектующие', 'видеокарта', 'процессор', 'мышь') THEN 'gaming'
  WHEN first_tag."tagName" IN ('books', 'книги', 'книга') THEN 'books'
  WHEN first_tag."tagName" IN ('fashion', 'одежда', 'обувь', 'аксессуары') THEN 'fashion'
  WHEN first_tag."tagName" IN ('beauty', 'красота', 'косметика', 'парфюм') THEN 'beauty'
  WHEN first_tag."tagName" IN ('home', 'дом', 'интерьер') THEN 'home'
  WHEN first_tag."tagName" IN ('kitchen', 'кухня', 'посуда') THEN 'kitchen'
  WHEN first_tag."tagName" IN ('sports', 'спорт') THEN 'sports'
  WHEN first_tag."tagName" IN ('hobby', 'хобби', 'творчество') THEN 'hobby'
  WHEN first_tag."tagName" IN ('kids', 'дети', 'детское') THEN 'kids'
  WHEN first_tag."tagName" IN ('gift-cards', 'сертификаты', 'сертификат') THEN 'gift-cards'
  ELSE 'other'
END
FROM first_tag
WHERE item."id" = first_tag."itemId"
  AND item."category" IS NULL;

CREATE INDEX IF NOT EXISTS "Item_category_idx" ON "Item"("category");

DROP TABLE IF EXISTS "_ItemToTag";
DROP TABLE IF EXISTS "Tag";
