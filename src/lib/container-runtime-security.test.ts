import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (name: string) => path.join(process.cwd(), name);

describe("production container runtime security", () => {
  it("runs Prisma migrations without shipping npm or npx", async () => {
    const [dockerfile, entrypoint] = await Promise.all([
      readFile(projectFile("Dockerfile"), "utf8"),
      readFile(projectFile("docker-entrypoint.sh"), "utf8"),
    ]);

    expect(entrypoint).toContain(
      "node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma",
    );
    expect(entrypoint).not.toMatch(/\bnpx prisma\b/);
    expect(dockerfile).toContain(
      "rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx",
    );
  });

  /*
   * Prisma CLI в образе ставится отдельным `npm install` со своим
   * package.json, поэтому корневые overrides на него сами не действуют.
   * Раньше в Dockerfile дублировали один override руками — остальные
   * (mysql2, valibot, @prisma/dev…) в образ не попадали. Теперь Dockerfile
   * переносит `overrides` из корневого package.json целиком, и дублировать
   * версии негде.
   */
  it("passes root overrides to the isolated Prisma CLI install", async () => {
    const dockerfile = await readFile(projectFile("Dockerfile"), "utf8");

    expect(dockerfile).toMatch(/const \{ overrides \} = require\('\/app\/package\.json'\)/);
    expect(dockerfile).toMatch(
      /JSON\.stringify\(\{ dependencies: \{ prisma: version \}, overrides \}\)/,
    );
    expect(dockerfile).not.toMatch(/"overrides"\s*:\s*\{/);
  });
});
