import { describe, expect, it } from "vitest";
import {
  canTransitionStatus,
  getNextStatusActionLabel,
  hasConflictingStatusPayload,
} from "./item-status";

describe("item-status transitions", () => {
  it("разрешает переход AVAILABLE -> CLAIMED", () => {
    expect(
      canTransitionStatus("AVAILABLE", "CLAIMED", {
        actorUserId: "u2",
        ownerUserId: "u1",
        claimerUserId: null,
      })
    ).toBe(true);
  });

  it("разрешает переход CLAIMED -> PURCHASED для claimer", () => {
    expect(
      canTransitionStatus("CLAIMED", "PURCHASED", {
        actorUserId: "u2",
        ownerUserId: "u1",
        claimerUserId: "u2",
      })
    ).toBe(true);
  });

  it("запрещает переход PURCHASED -> CLAIMED", () => {
    expect(
      canTransitionStatus("PURCHASED", "CLAIMED", {
        actorUserId: "u1",
        ownerUserId: "u1",
        claimerUserId: "u2",
      })
    ).toBe(false);
  });

  it("разрешает unclaim (CLAIMED -> AVAILABLE) только claimer или owner", () => {
    expect(
      canTransitionStatus("CLAIMED", "AVAILABLE", {
        actorUserId: "u2",
        ownerUserId: "u1",
        claimerUserId: "u2",
      })
    ).toBe(true);

    expect(
      canTransitionStatus("CLAIMED", "AVAILABLE", {
        actorUserId: "u3",
        ownerUserId: "u1",
        claimerUserId: "u2",
      })
    ).toBe(false);
  });
});

describe("item-status labels", () => {
  it("возвращает ожидаемые подписи для действий", () => {
    expect(getNextStatusActionLabel("AVAILABLE")).toBe("Забронировать");
    expect(getNextStatusActionLabel("CLAIMED")).toBe("Отметить купленным");
    expect(getNextStatusActionLabel("PURCHASED")).toBe("Уже куплено");
  });
});

describe("item-status payload conflicts", () => {
  it("считает payload конфликтным при одновременном status и purchased", () => {
    expect(
      hasConflictingStatusPayload({
        status: "CLAIMED",
        purchased: false,
      })
    ).toBe(true);
  });

  it("не считает payload конфликтным при единственном поле", () => {
    expect(hasConflictingStatusPayload({ status: "AVAILABLE" })).toBe(false);
    expect(hasConflictingStatusPayload({ purchased: true })).toBe(false);
  });
});

