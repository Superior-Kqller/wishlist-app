import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // В Docker версия приходит из APP_VERSION (build-arg); футер читает её на клиенте.
  env: { NEXT_PUBLIC_APP_VERSION: process.env.APP_VERSION },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    // Disable the Image Optimization API until Next supports sharp >= 0.35.
    unoptimized: true,
    remotePatterns: [
      /**
       * Фото товаров (парсер, маркетплейсы) и аватары — с произвольных HTTPS-доменов.
       * Хосты аватаров сверяет `src/lib/avatar-url-policy.ts` (AVATAR_ALLOWED_HOSTS).
       * HTTP убран для снижения SSRF-риска (cloud metadata обычно доступен по HTTP).
       * Для закрытого инстанса с доверенными пользователями риск приемлем.
       */
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  poweredByHeader: false,
};

const pwaDisabled = process.env.DISABLE_PWA === "1" || process.env.npm_lifecycle_event === "dev";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Включать SW только при production-сборке (`npm run build`), не при `npm run dev`
  disable: pwaDisabled,
  register: true,
  scope: "/",
});

// Не `withSerwist` с `disable`: обёртка и выключенной добавляет ключ `webpack`, а `next dev`
// на Turbopack с ним падает (`process.exit(1)` в next/dist/lib/turbopack-warning.js).
export default pwaDisabled ? nextConfig : withSerwist(nextConfig);
