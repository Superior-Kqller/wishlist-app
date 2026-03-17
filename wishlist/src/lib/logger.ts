/**
 * Безопасное логирование с санитизацией чувствительных данных
 */

interface LogContext {
  [key: string]: unknown;
}

/**
 * Санитизировать объект, удаляя чувствительные данные
 */
function sanitizeObject(obj: unknown, depth = 0): unknown {
  if (depth > 10) return "[Max depth reached]"; // Защита от циклических ссылок

  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  // Массивы
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  // Объекты
  const sensitiveKeys = [
    "password",
    "secret",
    "token",
    "authorization",
    "cookie",
    "session",
    "apiKey",
    "apikey",
    "accessToken",
    "refreshToken",
    "credentials",
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "string" && value.length > 1000) {
      sanitized[key] = value.substring(0, 1000) + "... [truncated]";
    } else {
      sanitized[key] = sanitizeObject(value, depth + 1);
    }
  }

  return sanitized;
}

/**
 * Проверить, является ли значение объектом для spread
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Безопасное логирование ошибок
 */
export function sanitizeError(message: string, error: unknown, context?: LogContext): void {
  const sanitizedContext = context ? sanitizeObject(context) : undefined;
  
  if (error instanceof Error) {
    const sanitizedError = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
    
    const logData: Record<string, unknown> = { error: sanitizedError };
    if (sanitizedContext && isRecord(sanitizedContext)) {
      Object.assign(logData, sanitizedContext);
    }
    
    console.error(message, logData);
  } else {
    const logData: Record<string, unknown> = { error: sanitizeObject(error) };
    if (sanitizedContext && isRecord(sanitizedContext)) {
      Object.assign(logData, sanitizedContext);
    }
    
    console.error(message, logData);
  }
}

/**
 * Безопасное логирование информации
 */
export function sanitizeLog(message: string, data?: LogContext): void {
  const sanitized = data ? sanitizeObject(data) : undefined;
  console.log(message, sanitized || "");
}
