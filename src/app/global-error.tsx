"use client";

/**
 * Отдельный корень при фатальной ошибке: без Providers/next-themes,
 * иначе пререндер /_global-error может падать (React context недоступен).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: "32rem" }}>
        <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
          Что-то пошло не так
        </h1>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          {error.message || "Неожиданная ошибка приложения"}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #ccc",
            background: "#f5f5f5",
            cursor: "pointer",
          }}
        >
          Попробовать снова
        </button>
      </body>
    </html>
  );
}
