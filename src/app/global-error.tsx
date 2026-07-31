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
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui",
          padding: "2rem",
          maxWidth: "32rem",
          background: "#0E1119",
          color: "#e4e8f1",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
        <p style={{ color: "#9ca6b8", marginBottom: "1rem" }}>
          {error.message || "Unexpected application error"}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #343b4b",
            background: "#171b25",
            color: "#e4e8f1",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
