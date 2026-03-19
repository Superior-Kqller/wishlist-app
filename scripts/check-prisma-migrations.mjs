#!/usr/bin/env node

import { execSync } from "node:child_process";

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
}

function safeDiff(base, head) {
  if (!base || !head) return "";
  try {
    return execSync(`git diff --name-only ${base} ${head}`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function getChangedFiles() {
  const base = getArg("base");
  const head = getArg("head");

  let output = safeDiff(base, head);

  // Fallback для локального запуска без аргументов.
  if (!output.trim()) {
    try {
      output = execSync("git diff --name-only --cached", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      output = "";
    }
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

