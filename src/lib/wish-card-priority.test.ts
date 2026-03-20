import { describe, expect, it } from "vitest";
import { wishlistPriorityToTier } from "./wish-card-priority";

describe("wishlistPriorityToTier", () => {
  it("маппит 4–5 в URGENT", () => {
    expect(wishlistPriorityToTier(4)).toBe("URGENT");
    expect(wishlistPriorityToTier(5)).toBe("URGENT");
  });

  it("маппит 3 в NORMAL", () => {
    expect(wishlistPriorityToTier(3)).toBe("NORMAL");
  });

  it("маппит 1–2 в SOMEDAY", () => {
    expect(wishlistPriorityToTier(1)).toBe("SOMEDAY");
    expect(wishlistPriorityToTier(2)).toBe("SOMEDAY");
  });

  it("клампит значения вне 1–5", () => {
    expect(wishlistPriorityToTier(0)).toBe("SOMEDAY");
    expect(wishlistPriorityToTier(99)).toBe("URGENT");
  });
});
