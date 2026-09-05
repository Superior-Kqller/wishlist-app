import { describe, expect, it } from "vitest";
import {
  canTransitionStatus,
  getPurchaseToggleTarget,
  hasConflictingStatusPayload,
  isItemPurchased,
} from "./item-status";

describe("item-status transitions", () => {
  it("разрешает владельцу отметить AVAILABLE как PURCHASED", () => {
    expect(
      canTransitionStatus("AVAILABLE", "PURCHASED", {
        actorUserId: "u1",
        ownerUserId: "u1",
      }),
    ).toBe(true);

    expect(
      canTransitionStatus("AVAILABLE", "PURCHASED", {
        actorUserId: "u2",
        ownerUserId: "u1",
      }),
    ).toBe(false);
  });

  it("не считает переходом повтор того же статуса", () => {
    expect(
      canTransitionStatus("PURCHASED", "PURCHASED", {
        actorUserId: "u2",
        ownerUserId: "u1",
      }),
    ).toBe(true);
  });

  it("разрешает владельцу снять отметку о покупке", () => {
    expect(
      canTransitionStatus("PURCHASED", "AVAILABLE", {
        actorUserId: "u1",
        ownerUserId: "u1",
      }),
    ).toBe(true);
  });

  it("не даёт снять чужую отметку", () => {
    expect(
      canTransitionStatus("PURCHASED", "AVAILABLE", {
        actorUserId: "u2",
        ownerUserId: "u1",
      }),
    ).toBe(false);
  });
});

describe("покупка как один факт", () => {
  it("считает товар купленным по любому из двух полей", () => {
    expect(isItemPurchased({ status: "PURCHASED", purchased: true })).toBe(true);
    expect(isItemPurchased({ status: "PURCHASED", purchased: false })).toBe(true);
    expect(isItemPurchased({ status: "AVAILABLE", purchased: true })).toBe(true);
  });

  it("считает товар доступным, когда молчат оба поля", () => {
    expect(isItemPurchased({ status: "AVAILABLE", purchased: false })).toBe(false);
  });

  it("ведёт переключатель от факта, а не от одного поля", () => {
    expect(getPurchaseToggleTarget({ status: "AVAILABLE", purchased: false })).toBe("PURCHASED");
    expect(getPurchaseToggleTarget({ status: "PURCHASED", purchased: false })).toBe("AVAILABLE");
    expect(getPurchaseToggleTarget({ status: "AVAILABLE", purchased: true })).toBe("AVAILABLE");
  });
});

describe("item-status payload conflicts", () => {
  it("считает payload конфликтным при одновременном status и purchased", () => {
    expect(
      hasConflictingStatusPayload({
        status: "PURCHASED",
        purchased: false,
      }),
    ).toBe(true);
  });

  it("не считает payload конфликтным при единственном поле", () => {
    expect(hasConflictingStatusPayload({ status: "AVAILABLE" })).toBe(false);
    expect(hasConflictingStatusPayload({ purchased: true })).toBe(false);
  });
});
