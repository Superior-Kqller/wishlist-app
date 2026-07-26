import { describe, expect, it, vi } from "vitest";
// @ts-expect-error Vitest импортирует исходный TS-модуль для unit-тестов seed.
import { assertSafeSeedConfig, assertSafeSeedUsernames, DEFAULT_HOLIDAYS, seedDefaultHolidays } from "./seed.ts";

describe("assertSafeSeedConfig", () => {
  it("throws in production when seed password uses changeme", () => {
    expect(() =>
      assertSafeSeedConfig({
        NODE_ENV: "production",
        SEED_USER1_PASSWORD: "changeme",
        SEED_USER2_PASSWORD: "very-strong-password",
      } as NodeJS.ProcessEnv)
    ).toThrow(/Unsafe seed config for production/);
  });

  it("throws when NODE_ENV is undefined and seed password uses changeme", () => {
    expect(() =>
      assertSafeSeedConfig({
        NODE_ENV: "production",
        SEED_USER1_PASSWORD: "changeme",
        SEED_USER2_PASSWORD: "very-strong-password",
      } as NodeJS.ProcessEnv)
    ).toThrow(/Unsafe seed config for production/);
  });

  it("does not throw in development when seed password uses changeme", () => {
    expect(() =>
      assertSafeSeedConfig({
        NODE_ENV: "development",
        SEED_USER1_PASSWORD: "changeme",
        SEED_USER2_PASSWORD: "changeme",
      } as NodeJS.ProcessEnv)
    ).not.toThrow();
  });
});

describe("assertSafeSeedUsernames", () => {
  it("throws for duplicate usernames (case-insensitive)", () => {
    expect(() =>
      assertSafeSeedUsernames({
        NODE_ENV: "test",
        SEED_USER1_USERNAME: "Admin",
        SEED_USER2_USERNAME: "admin",
      } as NodeJS.ProcessEnv)
    ).toThrow(/must be different/);
  });
});

describe("seedDefaultHolidays", () => {
  it("содержит согласованный каталог из 15 праздников", () => {
    expect(DEFAULT_HOLIDAYS).toHaveLength(15);
    expect(DEFAULT_HOLIDAYS.map((holiday) => holiday.seedKey)).toEqual(
      expect.arrayContaining(["new-year", "fathers-day", "mothers-day"]),
    );
  });

  it("повторно создаёт только отсутствующие ключи и не обновляет существующие", async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    await seedDefaultHolidays({ holiday: { createMany } });
    expect(createMany).toHaveBeenCalledWith({
      data: DEFAULT_HOLIDAYS,
      skipDuplicates: true,
    });
  });
});
