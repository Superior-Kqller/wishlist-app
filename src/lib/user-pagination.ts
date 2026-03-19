import { Buffer } from "node:buffer";

type UserListCursorPayload = { c: string; i: string };

export function encodeUserListCursor(createdAt: Date, id: string): string {
  const payload: UserListCursorPayload = {
    c: createdAt.toISOString(),
    i: id,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeUserListCursor(
  cursor: string
): { createdAt: Date; id: string } | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as UserListCursorPayload;
    if (typeof parsed.c !== "string" || typeof parsed.i !== "string") {
      return null;
    }
    const createdAt = new Date(parsed.c);
    if (Number.isNaN(createdAt.getTime()) || !parsed.i) return null;
    return { createdAt, id: parsed.i };
  } catch {
    return null;
  }
}
