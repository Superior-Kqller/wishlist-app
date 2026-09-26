#!/usr/bin/env node
// Схема изменилась в диапазоне base..head — значит, рядом должна лечь новая миграция.
// Запускается из CI: npm run db:check-migrations -- --base=<sha> --head=<sha>

import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";

const { base, head } = parseArgs({
  options: { base: { type: "string" }, head: { type: "string" } },
}).values;

if (!base || !head) {
  console.error("❌ Нужны --base и --head.");
  process.exit(2);
}

const changed = execFileSync("git", ["diff", "--name-only", base, head], {
  encoding: "utf-8",
}).split(/\r?\n/);

const schemaChanged = changed.includes("prisma/schema.prisma");
const migrationChanged = changed.some((f) => /^prisma\/migrations\/[^/]+\/migration\.sql$/.test(f));

if (schemaChanged && !migrationChanged) {
  console.error(
    "❌ Изменён prisma/schema.prisma, но не найден новый prisma/migrations/*/migration.sql.",
  );
  console.error("Создайте миграцию: npx prisma migrate dev --name <name>.");
  process.exit(1);
}

console.log("✅ Проверка Prisma миграций пройдена.");
