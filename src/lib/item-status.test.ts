import { describe, expect, it } from "vitest";
import {
  canTransitionStatus,
  getNextStatusActionLabel,
  getPurchaseToggleTarget,
  hasConflictingStatusPayload,
  isItemPurchased,
  normalizeItemStatus,
} from "./item-status";

describe("item-status transitions", () => {
  it("запрещает создавать бронь", () => {
    expect(
      canTransitionStatus("AVAILABLE", "CLAIMED", {
        actorUserId: "u2",
        ownerUserId: "u1",
        claimerUserId: null,
      }),
    ).toBe(false);
  });

  it("разрешает владельцу отметить AVAILABLE как PURCHASED", () => {
    expect(
      canTransitionStatus("AVAILABLE", "PURCHASED", {
        actorUserId: "u1",
        ownerUserId: "u1",
        claimerUserId: null,
      }),
    ).toBe(true);

    expect(
      canTransitionStatus("AVAILABLE", "PURCHASED", {
        actorUserId: "u2",
        ownerUserId: "u1",
        claimerUserId: null,
      }),
    ).toBe(false);
  });

  it("считает legacy CLAIMED доступным и запрещает claimer отмечать покупку", () => {
    expect(
      canTransitionStatus("CLAIMED", "PURCHASED", {
        actorUserId: "u2",
        ownerUserId: "u1",
        claimerUserId: "u2",
      }),
    ).toBe(false);

    expect(
      canTransitionStatus("CLAIMED", "PURCHASED", {
        actorUserId: "u1",
        ownerUserId: "u1",
        claimerUserId: "u2",
      }),
    ).toBe(true);
  });

  it("запрещает переход PURCHASED -> CLAIMED", () => {
    expect(
      canTransitionStatus("PURCHASED", "CLAIMED", {
        actorUserId: "u1",
        ownerUserId: "u1",
        claimerUserId: "u2",
      }),
    ).toBe(false);
  });

  it("запрещает снятие брони как отдельную функцию", () => {
    expect(
      canTransitionStatus("CLAIMED", "AVAILABLE", {
        actorUserId: "u2",
        ownerUserId: "u1",
        claimerUserId: "u2",
      }),
    ).toBe(false);

    expect(
      canTransitionStatus("CLAIMED", "AVAILABLE", {
        actorUserId: "u1",
        ownerUserId: "u1",
        claimerUserId: "u2",
      }),
    ).toBe(false);
  });
});

describe("item-status labels", () => {
  it("возвращает ожидаемые подписи для действий", () => {
    expect(getNextStatusActionLabel("AVAILABLE")).toBe("Отметить купленным");
    expect(getNextStatusActionLabel("CLAIMED")).toBe("Отметить купленным");
    expect(getNextStatusActionLabel("PURCHASED")).toBe("Уже куплено");
  });
});

describe("legacy item-status normalization", () => {
  it("считает CLAIMED обычным доступным или купленным статусом", () => {
    expect(normalizeItemStatus("CLAIMED", false)).toBe("AVAILABLE");
    expect(normalizeItemStatus("CLAIMED", true)).toBe("PURCHASED");
    expect(normalizeItemStatus("AVAILABLE", false)).toBe("AVAILABLE");
    expect(normalizeItemStatus("PURCHASED", true)).toBe("PURCHASED");
  });
});

describe("покупка как один факт", () => {
  it("считает товар купленным по любому из двух полей", () => {
    expect(isItemPurchased({ status: "PURCHASED", purchased: true })).toBe(true);
    expect(isItemPurchased({ status: "PURCHASED", purchased: false })).toBe(true);
    expect(isItemPurchased({ status: "AVAILABLE", purchased: true })).toBe(true);
    expect(isItemPurchased({ status: "CLAIMED", purchased: true })).toBe(true);
  });

  it("считает товар доступным, когда молчат оба поля", () => {
    expect(isItemPurchased({ status: "AVAILABLE", purchased: false })).toBe(false);
    expect(isItemPurchased({ status: "CLAIMED", purchased: false })).toBe(false);
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
        status: "CLAIMED",
        purchased: false,
      }),
    ).toBe(true);
  });

  it("не считает payload конфликтным при единственном поле", () => {
    expect(hasConflictingStatusPayload({ status: "AVAILABLE" })).toBe(false);
    expect(hasConflictingStatusPayload({ purchased: true })).toBe(false);
  });
});
