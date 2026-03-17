import { z } from "zod";

/**
 * Валидация сложности пароля
 * Требования:
 * - Минимум 8 символов
 * - Буквы (латиница или кириллица)
 * - Цифры
 * - Спецсимволы
 */
export function validatePasswordComplexity(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Пароль должен содержать минимум 8 символов");
  }

  // Проверка на наличие букв (латиница или кириллица)
  const hasLetters = /[a-zA-Zа-яА-ЯёЁ]/.test(password);
  if (!hasLetters) {
    errors.push("Пароль должен содержать буквы (латиница или кириллица)");
  }

  // Проверка на наличие цифр
  const hasNumbers = /\d/.test(password);
  if (!hasNumbers) {
    errors.push("Пароль должен содержать цифры");
  }

  // Проверка на наличие спецсимволов
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  if (!hasSpecialChars) {
    errors.push("Пароль должен содержать спецсимволы (!@#$%^&* и т.д.)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Zod схема для валидации пароля
 */
export const passwordSchema = z
  .string()
  .min(8, "Пароль должен содержать минимум 8 символов")
  .refine(
    (password) => /[a-zA-Zа-яА-ЯёЁ]/.test(password),
    "Пароль должен содержать буквы (латиница или кириллица)"
  )
  .refine((password) => /\d/.test(password), "Пароль должен содержать цифры")
  .refine(
    (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    "Пароль должен содержать спецсимволы (!@#$%^&* и т.д.)"
  );
