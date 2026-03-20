import { describe, expect, it } from "vitest";
import {
  getAvatarAllowedHostsFromEnv,
  isAllowedLocalAvatarPath,
  normalizeAvatarUrl,
  parseAvatarAllowedHosts,
} from "./avatar-url-policy";

describe("avatar-url-policy parseAvatarAllowedHosts", () => {
  it("парсит и нормализует список хостов из env", () => {
    expect(
      parseAvatarAllowedHosts("cdn.example.com, IMG.EXAMPLE.COM, cdn.example.com")
    ).toEqual(["cdn.example.com", "img.example.com"]);
  });

  it("отбрасывает невалидные записи", () => {
    expect(
      parseAvatarAllowedHosts("https://bad.example.com,*.evil.com, good.example.com/path")
    ).toEqual([]);
  });

  it("отбрасывает localhost, IP literals и host c trailing dot", () => {
    expect(
      parseAvatarAllowedHosts("localhost,127.0.0.1,[::1],cdn.example.com.")
    ).toEqual([]);
  });
});

describe("avatar-url-policy local uploads", () => {
  it("разрешает только безопасные локальные пути /uploads/...", () => {
    expect(isAllowedLocalAvatarPath("/uploads/avatar.png")).toBe(true);
    expect(isAllowedLocalAvatarPath("/uploads/nested/avatar.png")).toBe(true);
    expect(isAllowedLocalAvatarPath("/upload/avatar.png")).toBe(false);
    expect(isAllowedLocalAvatarPath("/uploads/../../etc/passwd")).toBe(false);
    expect(isAllowedLocalAvatarPath("/uploads\\avatar.png")).toBe(false);
    expect(isAllowedLocalAvatarPath("/uploads/%2e%2e/evil.png")).toBe(false);
  });
});

describe("avatar-url-policy normalizeAvatarUrl", () => {
  it("нормализует пустую строку в null", () => {
    expect(normalizeAvatarUrl("   ")).toEqual({ ok: true, value: null });
  });

  it("разрешает локальный путь /uploads/ без env whitelist", () => {
    expect(normalizeAvatarUrl("/uploads/avatar.png")).toEqual({
      ok: true,
      value: "/uploads/avatar.png",
    });
  });

  it("возвращает invalid-local-path для невалидного /uploads пути", () => {
    const result = normalizeAvatarUrl("/uploads/%2e%2e/evil.png");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-local-path");
    }
  });

  it("запрещает внешний URL при пустом whitelist (secure fallback)", () => {
    const result = normalizeAvatarUrl("https://cdn.example.com/avatar.png", {
      allowedHosts: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("host-not-allowed");
    }
  });

  it("разрешает только https URL из whitelist и убирает hash", () => {
    const result = normalizeAvatarUrl("https://cdn.example.com/avatar.png#test", {
      allowedHosts: ["cdn.example.com"],
    });
    expect(result).toEqual({
      ok: true,
      value: "https://cdn.example.com/avatar.png",
    });
  });

  it("запрещает http даже для разрешенного хоста", () => {
    const result = normalizeAvatarUrl("http://cdn.example.com/avatar.png", {
      allowedHosts: ["cdn.example.com"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-url");
    }
  });

  it("запрещает URL с userinfo", () => {
    const result = normalizeAvatarUrl("https://user:pass@cdn.example.com/avatar.png", {
      allowedHosts: ["cdn.example.com"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-url");
    }
  });

  it("запрещает URL с портом", () => {
    const result = normalizeAvatarUrl("https://cdn.example.com:8443/avatar.png", {
      allowedHosts: ["cdn.example.com"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-url");
    }
  });
});

describe("avatar-url-policy getAvatarAllowedHostsFromEnv", () => {
  it("читает AVATAR_ALLOWED_HOSTS из env-like объекта", () => {
    expect(
      getAvatarAllowedHostsFromEnv({
        AVATAR_ALLOWED_HOSTS: "a.example.com, b.example.com",
      } as NodeJS.ProcessEnv)
    ).toEqual(["a.example.com", "b.example.com"]);
  });
});
