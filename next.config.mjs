import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const avatarAllowedHosts = parseAvatarAllowedHosts(process.env.AVATAR_ALLOWED_HOSTS);

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: avatarAllowedHosts.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
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

const withPWA = withPWAInit({
  dest: "public",
  // Включать SW только при production-сборке (`npm run build`), не при `npm run dev`
  disable:
    process.env.DISABLE_PWA === "1" ||
    process.env.npm_lifecycle_event === "dev",
  register: true,
  scope: "/",
});

const pwaDisabled =
  process.env.DISABLE_PWA === "1" || process.env.npm_lifecycle_event === "dev";

export default pwaDisabled ? nextConfig : withPWA(nextConfig);

function parseAvatarAllowedHosts(raw) {
  if (!raw) return [];

  const uniqueHosts = new Set();
  for (const entry of raw.split(",")) {
    const host = normalizeHost(entry);
    if (host) {
      uniqueHosts.add(host);
    }
  }

  return Array.from(uniqueHosts);
}

function normalizeHost(rawHost) {
  const host = rawHost.trim().toLowerCase();
  if (!host) return null;

  if (
    host.includes("://") ||
    host.includes("/") ||
    host.includes("*") ||
    host === "localhost" ||
    host.endsWith(".")
  ) {
    return null;
  }

  try {
    const parsed = new URL(`https://${host}`);
    const normalized = parsed.hostname.toLowerCase();
    if (normalized !== host || isIpLiteral(normalized)) {
      return null;
    }
  } catch {
    return null;
  }

  return host;
}

function isIpLiteral(value) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
    return true;
  }

  return value.includes(":");
}
