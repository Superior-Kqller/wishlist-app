import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Правила визуальной системы до сих пор жили только в DESIGN.md — то есть
 * нарушать их ничего не мешало. За полгода это дало 17 прозрачностей одного
 * `--surface-2`, три размера заголовка раздела через три механизма, две
 * несовпадающие полосы разделов и пять ширин диалога.
 *
 * Этот тест сторожит те правила системы, которые можно проверить механически.
 * Он намеренно узкий: ловит только то, что уже разъезжалось, и не пытается
 * судить о вкусе.
 */

const SRC = join(process.cwd(), "src");

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...walk(full));
      continue;
    }
    if ([".ts", ".tsx", ".css"].includes(extname(entry))) found.push(full);
  }
  return found;
}

const FILES = walk(SRC).filter((file) => !file.endsWith("ui-discipline.test.ts"));

function read(file: string) {
  return readFileSync(file, "utf8").replaceAll("\r\n", "\n");
}

/** Лестница прозрачностей из DESIGN.md → The Alpha Ladder Rule. */
const ALPHA_LADDER = new Set([
  "0.05",
  "0.1",
  "0.16",
  "0.24",
  "0.32",
  "0.45",
  "0.55",
  "0.7",
  "0.85",
  "0.95",
]);

function normalizeAlpha(raw: string) {
  const value = Number(raw);
  return String(value);
}

describe("дисциплина визуальной системы", () => {
  it("прозрачности поверхностей берутся из лестницы", () => {
    const offLadder: string[] = [];

    for (const file of FILES) {
      const text = read(file);
      for (const match of text.matchAll(/--surface-[1-6]\)\s*\/\s*(0?\.\d+)/g)) {
        const alpha = normalizeAlpha(match[1]);
        if (ALPHA_LADDER.has(alpha)) continue;
        offLadder.push(`${file.replace(process.cwd(), "").replace(/\\/g, "/")}: ${match[0]}`);
      }
    }

    expect(offLadder, `ступени вне лестницы:\n${offLadder.join("\n")}`).toEqual([]);
  });

  it("заголовок раздела набирается одним классом, а не своим кеглем", () => {
    const adhoc: string[] = [];

    for (const file of FILES) {
      if (!file.endsWith(".tsx")) continue;
      const text = read(file);
      for (const match of text.matchAll(/<h2[^>]*className="([^"]*)"/g)) {
        const classes = match[1];
        if (classes.includes("section-title")) continue;
        // Антиква — крупный шаг, и DESIGN.md перечисляет три места, где он
        // разрешён: заголовок страницы, пустое состояние, обещание на входе.
        if (classes.includes("display-face")) continue;
        // `title` (1rem) — законная роль заголовка карточки и группы полей.
        if (/\btext-(base|sm)\b/.test(classes)) continue;
        if (/\btext-(lg|xl|2xl|3xl)\b/.test(classes)) {
          adhoc.push(`${file.replace(process.cwd(), "").replace(/\\/g, "/")}: ${classes}`);
        }
      }
    }

    expect(adhoc, `заголовки вне шкалы:\n${adhoc.join("\n")}`).toEqual([]);
  });

  it("ширина диалога берётся из контракта, а не назначается на месте", () => {
    const adhoc: string[] = [];

    for (const file of FILES) {
      if (!file.endsWith(".tsx")) continue;
      const text = read(file);
      for (const match of text.matchAll(/<DialogContent[^>]*className="([^"]*)"/g)) {
        if (/\bmax-w-/.test(match[1])) {
          adhoc.push(`${file.replace(process.cwd(), "").replace(/\\/g, "/")}: ${match[1]}`);
        }
      }
    }

    expect(adhoc, `свои ширины диалога:\n${adhoc.join("\n")}`).toEqual([]);
  });
});
