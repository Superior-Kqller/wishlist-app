import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUserFindMany = vi.fn();
const mockHolidayFindMany = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    holiday: { findMany: mockHolidayFindMany },
    user: { findMany: mockUserFindMany },
  },
}));

describe("prismaHolidayCalendarRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("выбирает поздравляемых с согласием и только доступные зрителю вишлисты", async () => {
    mockUserFindMany.mockResolvedValue([
      {
        id: "person-1",
        name: "Анна",
        avatarUrl: null,
        gender: "FEMALE",
        thematicHolidayConsent: true,
        lists: [{ id: "shared-list", name: "Подарки" }],
      },
    ]);
    const { prismaHolidayCalendarRepository } = await import(
      "./prisma-holiday-repository"
    );

    await expect(
      prismaHolidayCalendarRepository.listThematicCandidates("viewer-1"),
    ).resolves.toEqual([
      {
        id: "person-1",
        name: "Анна",
        avatarUrl: null,
        gender: "FEMALE",
        consent: true,
        wishlists: [{ id: "shared-list", name: "Подарки" }],
      },
    ]);
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          thematicHolidayConsent: true,
          gender: { not: null },
        },
        select: expect.objectContaining({
          gender: true,
          thematicHolidayConsent: true,
          lists: {
            where: {
              OR: [
                { userId: "viewer-1" },
                { viewers: { some: { userId: "viewer-1" } } },
              ],
            },
            select: { id: true, name: true },
            orderBy: { createdAt: "asc" },
          },
        }),
      }),
    );
  });
});
