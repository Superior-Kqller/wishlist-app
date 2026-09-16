import { z } from "zod";

const PASSWORD_CHECKS: Array<[check: (p: string) => boolean, error: string]> = [
  [(p) => p.length >= 8, "Пароль должен содержать минимум 8 символов"],
  [(p) => /[a-zA-Zа-яА-ЯёЁ]/.test(p), "Пароль должен содержать буквы (латиница или кириллица)"],
  [(p) => /\d/.test(p), "Пароль должен содержать цифры"],
  [
    (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p),
    "Пароль должен содержать спецсимволы (!@#$%^&* и т.д.)",
  ],
];

/**
 * Zod схема для валидации пароля с одновременным сбором всех ошибок сложности
 */
export const passwordSchema = z.string().superRefine((val, ctx) => {
  for (const [check, message] of PASSWORD_CHECKS) {
    if (!check(val)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  }
});

/**
 * Валидация сложности пароля
 */
export function validatePasswordComplexity(password: string): {
  valid: boolean;
  errors: string[];
} {
  const result = passwordSchema.safeParse(password);
  if (result.success) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: result.error.issues.map((i) => i.message),
  };
}
