import { describe, expect, it } from "vitest";
import { getVisibleRecentActivityItems } from "./recent-activity";

const activityItems = [
  { id: "oldest", updatedAt: "2026-06-10T08:00:00.000Z" },
  { id: "second", updatedAt: "2026-06-11T08:00:00.000Z" },
  { id: "third", updatedAt: "2026-06-12T08:00:00.000Z" },
  { id: "newest", updatedAt: "2026-06-13T08:00:00.000Z" },
];

describe("getVisibleRecentActivityItems", () => {
  it("показывает три последних изменения в свернутом виджете", () => {
    expect(
      getVisibleRecentActivityItems(activityItems, { expanded: false }).map((item) => item.id),
    ).toEqual(["newest", "third", "second"]);
  });

  it("показывает все изменения при раскрытии", () => {
    expect(
      getVisibleRecentActivityItems(activityItems, { expanded: true }).map((item) => item.id),
    ).toEqual(["newest", "third", "second", "oldest"]);
  });
});
