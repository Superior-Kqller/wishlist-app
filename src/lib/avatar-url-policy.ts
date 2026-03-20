const LOCAL_UPLOADS_PREFIX = "/uploads/";
const AVATAR_ALLOWED_HOSTS_ENV = "AVATAR_ALLOWED_HOSTS";

export function parseAvatarAllowedHosts(raw: string | undefined): string[] {
  if (!raw) return [];

  const uniqueHosts = new Set<string>();
  for (const entry of raw.split(",")) {
    const normalized = normalizeHost(entry);
    if (normalized) {
      uniqueHosts.add(normalized);
    }
  }

  return Array.from(uniqueHosts);
}

export function getAvatarAllowedHostsFromEnv(env = process.env): string[] {
  return parseAvatarAllowedHosts(env[AVATAR_ALLOWED_HOSTS_ENV]);
}

export function isAllowedLocalAvatarPath(value: string): boolean {
  if (!value.startsWith(LOCAL_UPLOADS_PREFIX)) {
    return false;
  }

  if (value.includes("\\") || value.includes("..")) {
    return false;
  }

  // Reject encoded traversal and encoded backslashes.
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes("%2e") || lowerValue.includes("%2f") || lowerValue.includes("%5c")) {
    return false;
  }

  return true;
}

export type AvatarUrlNormalizationResult =
  | { ok: true; value: string | null }
  | { ok: false; reason: "invalid-local-path" | "invalid-url" | "host-not-allowed" };

export function normalizeAvatarUrl(
  input: string,
  options?: { allowedHosts?: string[] }
): AvatarUrlNormalizationResult {
  const value = input.trim();

  if (!value) {
    return { ok: true, value: null };
  }

  if (isAllowedLocalAvatarPath(value)) {
    return { ok: true, value };
  }

  if (value.startsWith("/uploads")) {
    return { ok: false, reason: "invalid-local-path" };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "invalid-url" };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "invalid-url" };
  }

  if (url.username || url.password || url.port) {
    return { ok: false, reason: "invalid-url" };
  }

  const allowedHosts = options?.allowedHosts ?? getAvatarAllowedHostsFromEnv();
  const hostname = url.hostname.toLowerCase();

  if (!allowedHosts.includes(hostname)) {
    return { ok: false, reason: "host-not-allowed" };
  }

  url.hash = "";
  return { ok: true, value: url.toString() };
}

function normalizeHost(rawHost: string): string | null {
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

function isIpLiteral(value: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
    return true;
  }

  return value.includes(":");
}
