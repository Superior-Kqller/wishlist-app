import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const rootsToScan = ["src/app", "src/components"];
const fileExtensions = new Set([".ts", ".tsx"]);
const forbiddenTerms = [
  "собра",
  "сбор",
  "донат",
  "donat",
  "payment",
  "checkout",
  "перев",
  "оплат",
  "внести",
  "скинуться",
  "средств",
  "fund",
  "goal",
];

function listSourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const fullPath = join(root, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) return listSourceFiles(fullPath);
    if (!stats.isFile()) return [];
    if (!fileExtensions.has(fullPath.slice(fullPath.lastIndexOf(".")))) return [];

    return [fullPath];
  });
}

describe("no-funding product copy", () => {
  test("does not expose funding or payment terminology in UI source", () => {
    const matches = rootsToScan.flatMap((root) =>
      listSourceFiles(root).flatMap((file) => {
        const content = readFileSync(file, "utf8").toLowerCase();
        return forbiddenTerms
          .filter((term) => content.includes(term))
          .map((term) => `${relative(process.cwd(), file)} contains "${term}"`);
      }),
    );

    expect(matches).toEqual([]);
  });
});
