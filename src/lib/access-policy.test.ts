import { describe, expect, it } from "vitest";
import { canViewList } from "./access-policy";

describe("access-policy list visibility", () => {
  it("разрешает доступ владельцу", () => {
    expect(
      canViewList({
        actorUserId: "u1",
        ownerUserId: "u1",
        viewerUserIds: [],
      }),
    ).toBe(true);
  });

  it("разрешает доступ viewer", () => {
    expect(
      canViewList({
        actorUserId: "u2",
        ownerUserId: "u1",
        viewerUserIds: ["u2"],
      }),
    ).toBe(true);
  });

  it("запрещает доступ постороннему", () => {
    expect(
      canViewList({
        actorUserId: "u3",
        ownerUserId: "u1",
        viewerUserIds: ["u2"],
      }),
    ).toBe(false);
  });
});
