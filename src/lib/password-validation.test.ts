import { describe, it, expect } from "vitest";
import { validatePasswordComplexity, passwordSchema } from "./password-validation";

describe("validatePasswordComplexity", () => {
  it("принимает корректный пароль", () => {
    const result = validatePasswordComplexity("Passw0rd!");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("принимает пароль с кириллицей", () => {
    const result = validatePasswordComplexity("Пароль1!");
    expect(result.valid).toBe(true);
  });

  it("отклоняет короткий пароль", () => {
    const result = validatePasswordComplexity("Pa1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Пароль должен содержать минимум 8 символов");
  });

  it("отклоняет пароль без букв", () => {
    const result = validatePasswordComplexity("12345678!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Пароль должен содержать буквы (латиница или кириллица)");
  });

  it("отклоняет пароль без цифр", () => {
    const result = validatePasswordComplexity("Password!!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Пароль должен содержать цифры");
  });

  it("отклоняет пароль без спецсимволов", () => {
    const result = validatePasswordComplexity("Password12");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Пароль должен содержать спецсимволы (!@#$%^&* и т.д.)");
  });

  it("собирает все ошибки сразу", () => {
    const result = validatePasswordComplexity("abc");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe("passwordSchema (zod)", () => {
  it("валидирует корректный пароль", () => {
    expect(passwordSchema.safeParse("Passw0rd!").success).toBe(true);
  });

  it("отклоняет некорректный пароль", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
  });
});
