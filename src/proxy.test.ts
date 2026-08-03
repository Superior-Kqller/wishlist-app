import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { config } from "./proxy";

/** Маршруты, которые обязаны оставаться доступными без сессии. */
const PUBLIC_ROUTES = new Set(["/login"]);

/**
 * Список защищённых маршрутов раньше был зашит здесь руками, и `/calendar`
 * из-за этого год отдавал 200 гостю: страница рисовала авторизованную
 * обвязку поверх ошибок 401. Теперь тест сам обходит `src/app` — новая
 * страница либо попадёт в matcher, либо будет объявлена публичной.
 */
function discoverPageRoutes(): string[] {
  const appDir = join(__dirname, "app");
  const routes: string[] = [];

  const walk = (dir: string, route: string) => {
    const entries = readdirSync(dir, { withFileTypes: true });

    if (entries.some((entry) => entry.isFile() && entry.name === "page.tsx")) {
      routes.push(route === "" ? "/" : route);
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      // Служебные и невидимые пользователю каталоги: api, приватные (_), QA.
      if (entry.name === "api" || entry.name.startsWith("_") || entry.name === "qa-ui") continue;
      walk(join(dir, entry.name), `${route}/${entry.name}`);
    }
  };

  walk(appDir, "");
  return routes;
}

describe("proxy route policy", () => {
  const matcher = config.matcher;

  it("protects every app page that is not explicitly public", () => {
    const shouldBeProtected = discoverPageRoutes()
      .filter((route) => !PUBLIC_ROUTES.has(route))
      .sort();

    expect([...matcher].sort()).toEqual(shouldBeProtected);
  });

  it("does not use a catch-all matcher that intercepts unknown paths before 404", () => {
    expect(matcher).not.toContain("/(.*)");
    expect(matcher.some((entry) => entry.includes(":path"))).toBe(false);
    expect(matcher.some((entry) => entry.includes("(?!"))).toBe(false);
  });
});
