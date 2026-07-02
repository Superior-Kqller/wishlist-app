import { describe, expect, it } from "vitest";
import { config } from "./proxy";

describe("proxy route policy", () => {
  const matcher = config.matcher;

  it("protects known app pages that require an authenticated session", () => {
    expect(matcher).toEqual(["/", "/admin", "/preferences", "/settings", "/stats"]);
  });

  it("does not use a catch-all matcher that intercepts unknown paths before 404", () => {
    expect(matcher).not.toContain("/(.*)");
    expect(matcher.some((entry) => entry.includes(":path"))).toBe(false);
    expect(matcher.some((entry) => entry.includes("(?!"))).toBe(false);
  });
});
