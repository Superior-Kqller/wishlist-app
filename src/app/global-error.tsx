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
      <body
        style={{
          fontFamily: "system-ui",
          padding: "2rem",
          maxWidth: "32rem",
          background: "#0F0B18",
          color: "#ddd5eb",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
          Что-то пошло не так
        </h1>
        <p style={{ color: "#8a7fa0", marginBottom: "1rem" }}>
          {error.message || "Неожиданная ошибка приложения"}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #2e2540",
            background: "#1c1528",
            color: "#ddd5eb",
            cursor: "pointer",
          }}
        >
          Попробовать снова
        </button>
      </body>
    </html>
  );
}
