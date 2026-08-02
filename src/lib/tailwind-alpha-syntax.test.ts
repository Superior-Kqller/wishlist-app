import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { glob } from "fs/promises";

/**
 * `bg-[hsl(var(--x))/0.5]` puts the alpha slash outside the color function.
 * Tailwind's arbitrary-value escaping treats it as a literal, and the browser
 * discards the whole declaration at computed-value time (the `var()` inside
 * defeats parse-time validation). The correct form is `bg-[hsl(var(--x)/0.5)]`.
 * See PR history: this pattern silently dropped 73 backgrounds across 26 files.
 */
const BROKEN_ALPHA_PATTERN = /(?:hsl|rgb)\(var\(--[a-zA-Z0-9-]+\)\)\/0?\.\d+/;

describe("tailwind alpha syntax", () => {
  it("has no hsl()/rgb() color-mix alpha applied outside the color function", async () => {
    const offenders: string[] = [];
    for await (const file of glob("src/**/*.{ts,tsx}")) {
      if (file.endsWith("tailwind-alpha-syntax.test.ts")) continue;
      const content = readFileSync(file, "utf-8");
      if (BROKEN_ALPHA_PATTERN.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
