import { describe, expect, it } from "vitest";
import {
  canClaimItem,
  canSeeClaimerIdentity,
  canUnclaimItem,
  canViewList,
} from "./access-policy";

describe("access-policy list visibility", () => {
  it("разрешает доступ владельцу", () => {
    expect(
      canViewList({
        actorUserId: "u1",
        ownerUserId: "u1",
        viewerUserIds: [],
      })
    ).toBe(true);
  });

  it("разрешает доступ viewer", () => {
    expect(
      canViewList({
        actorUserId: "u2",
        ownerUserId: "u1",
        viewerUserIds: ["u2"],
      })
    ).toBe(true);
  });

  it("запрещает доступ постороннему", () => {
    expect(
      canViewList({
        actorUserId: "u3",
        ownerUserId: "u1",
        viewerUserIds: ["u2"],
      })
    ).toBe(false);
  });
});

describe("access-policy claim", () => {
  it("разрешает claim только для visible + available", () => {
    expect(
      canClaimItem({
        actorUserId: "u2",
        ownerUserId: "u1",
        claimerUserId: null,
        isVisibleToActor: true,
        status: "AVAILABLE",
      })
    ).toBe(true);

    expect(
      canClaimItem({
        actorUserId: "u2",
        ownerUserId: "u1",
        claimerUserId: null,
        isVisibleToActor: false,
        status: "AVAILABLE",
      })
    ).toBe(false);
  });

  it("разрешает unclaim только owner/claimer", () => {
    expect(
      canUnclaimItem({
        actorUserId: "u1",
        ownerUserId: "u1",
        claimerUserId: "u2",
        isVisibleToActor: true,
        status: "CLAIMED",
      })
    ).toBe(true);

    expect(
      canUnclaimItem({
        actorUserId: "u3",
        ownerUserId: "u1",
        claimerUserId: "u2",
        isVisibleToActor: true,
        status: "CLAIMED",
      })
    ).toBe(false);
  });
});

describe("access-policy claimer identity", () => {
  it("скрывает claimer в приватном режиме от постороннего", () => {
    expect(
      canSeeClaimerIdentity({
        actorUserId: "u3",
        ownerUserId: "u1",
        claimerUserId: "u2",
        isClaimPrivate: true,
      })
    ).toBe(false);
  });

  it("показывает claimer владельцу и самому claimer в приватном режиме", () => {
    expect(
      canSeeClaimerIdentity({
        actorUserId: "u1",
        ownerUserId: "u1",
        claimerUserId: "u2",
        isClaimPrivate: true,
      })
    ).toBe(true);

    expect(
      canSeeClaimerIdentity({
        actorUserId: "u2",
        ownerUserId: "u1",
        claimerUserId: "u2",
        isClaimPrivate: true,
      })
    ).toBe(true);
  });
});

