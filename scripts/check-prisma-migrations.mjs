#!/usr/bin/env node

import { execSync } from "node:child_process";

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
}

function getDiff(base, head) {
  if (!base || !head) {
    return { ok: false, output: "", error: "BASE_OR_HEAD_MISSING" };
  }
  try {
    const output = execSync(`git diff --name-only ${base} ${head}`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return { ok: true, output, error: null };
  } catch {
    return { ok: false, output: "", error: "DIFF_FAILED" };
  }
}

function getChangedFiles() {
  const base = getArg("base");
  const head = getArg("head");
  const isStrictRangeMode = Boolean(base && head);

  if (isStrictRangeMode) {
    console.log(`ℹ️ Проверяем изменения в strict mode: base=${base}, head=${head}`);
    const result = getDiff(base, head);
    if (!result.ok) {
      console.error(
        `❌ Не удалось выполнить strict diff для диапазона ${base}..${head}.`
      );
      console.error(
        "Проверьте checkout/fetch в CI: без корректного diff проверка миграций невалидна."
      );
      process.exit(2);
    }
    return result.output
      .split(/\r?\n/)
      .map((f) => f.trim())
      .filter(Boolean);
  }

  console.log("ℹ️ Аргументы --base/--head не переданы, используем local fallback (--cached).");
  let output = "";
  try {
    output = execSync("git diff --name-only --cached", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    output = "";
  }

  return output
    .split(/\r?\n/)
    .map((f) => f.trim())
    .filter(Boolean);
}

const changed = getChangedFiles();
const schemaChanged = changed.includes("prisma/schema.prisma");
const migrationChanged = changed.some((f) =>
  /^prisma\/migrations\/[^/]+\/migration\.sql$/.test(f)
);

if (schemaChanged && !migrationChanged) {
  console.error(
    "❌ Изменён prisma/schema.prisma, но не найден новый prisma/migrations/*/migration.sql."
  );
  console.error("Создайте миграцию: npx prisma migrate dev --name <name>.");
  process.exit(1);
}

console.log("✅ Проверка Prisma миграций пройдена.");

