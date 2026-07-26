import { describe, expect, it } from "vitest";
import { thematicWishlistHref } from "./wishlist-link";

describe("thematicWishlistHref", () => {
  it("формирует переход к доступному вишлисту поздравляемого", () => {
    expect(thematicWishlistHref("user with space", "list/one")).toBe(
      "/?userId=user+with+space&listId=list%2Fone",
    );
  });
});
