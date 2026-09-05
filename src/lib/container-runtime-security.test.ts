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
   * package.json, поэтому корневые overrides на него не распространяются —
   * версию `@hono/node-server` там приходится называть второй раз.
   *
   * Опасность здесь ровно одна: два места разъедутся. Поднимут версию в
   * корне, забудут в Dockerfile — и образ уедет с уязвимой зависимостью,
   * хотя проект считает, что закрыл её.
   *
   * Раньше тест был написан наоборот: он держал в себе саму строку
   * `"@hono/node-server":"^1.19.13"`. То есть проходил как раз при
   * расхождении (корень подняли, образ нет — Dockerfile не менялся) и падал
   * при безопасном обновлении образа. Человек чинил бы тест вместо того,
   * чтобы смотреть, что с образом.
   *
   * Теперь версия не зашита: сверяются два объявления между собой, и
   * обновление проходит без правки теста — если поднять обе стороны.
   */
  it("keeps the isolated Prisma CLI install in step with the root override", async () => {
    const [dockerfile, packageJson] = await Promise.all([
      readFile(projectFile("Dockerfile"), "utf8"),
      readFile(projectFile("package.json"), "utf8"),
    ]);

    const declared = (JSON.parse(packageJson) as { overrides?: Record<string, string> })
      .overrides?.["@hono/node-server"];
    expect(declared, "корневой package.json должен объявлять override").toBeTruthy();

    const inImage = dockerfile.match(/"@hono\/node-server"\s*:\s*"([^"]+)"/)?.[1];
    expect(
      inImage,
      "Dockerfile должен объявлять override для изолированной установки",
    ).toBeTruthy();

    expect(inImage).toBe(declared);
  });
});
