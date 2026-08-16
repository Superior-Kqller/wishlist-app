import { describe, expect, it } from "vitest";
import { getWishWord } from "@/lib/i18n";

describe("getWishWord", () => {
  it("declines the Russian noun by the last digits, not by the whole number", () => {
    expect(getWishWord("ru", 1)).toBe("желание");
    expect(getWishWord("ru", 3)).toBe("желания");
    expect(getWishWord("ru", 5)).toBe("желаний");
    expect(getWishWord("ru", 21)).toBe("желание");
    expect(getWishWord("ru", 22)).toBe("желания");
    expect(getWishWord("ru", 0)).toBe("желаний");
  });

  it("keeps the teens in the genitive plural", () => {
    expect(getWishWord("ru", 11)).toBe("желаний");
    expect(getWishWord("ru", 12)).toBe("желаний");
    expect(getWishWord("ru", 14)).toBe("желаний");
  });

  it("uses a plain English plural", () => {
    expect(getWishWord("en", 1)).toBe("wish");
    expect(getWishWord("en", 0)).toBe("wishes");
    expect(getWishWord("en", 21)).toBe("wishes");
  });
});
