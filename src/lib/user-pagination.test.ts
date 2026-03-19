import { describe, it, expect } from "vitest";
import { decodeUserListCursor, encodeUserListCursor } from "./user-pagination";

describe("user-pagination", () => {
  it("roundtrip encode/decode", () => {
    const d = new Date("2024-06-01T12:00:00.000Z");
    const id = "clxyz123";
    const enc = encodeUserListCursor(d, id);
    const dec = decodeUserListCursor(enc);
    expect(dec).not.toBeNull();
    expect(dec!.id).toBe(id);
    expect(dec!.createdAt.toISOString()).toBe(d.toISOString());
  });

  it("decode invalid returns null", () => {
    expect(decodeUserListCursor("not-valid")).toBeNull();
  });
});
