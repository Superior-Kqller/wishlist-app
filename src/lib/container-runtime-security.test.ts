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

  it("forces the fixed Hono server in the isolated Prisma CLI install", async () => {
    const dockerfile = await readFile(projectFile("Dockerfile"), "utf8");

    expect(dockerfile).toContain(
      '\"overrides\":{\"@hono/node-server\":\"^1.19.13\"}',
    );
  });
});
