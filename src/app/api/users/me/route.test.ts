import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRateLimit = vi.fn();
const mockGetSessionUserIdVerified = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockTransaction = vi.fn();
const mockViewerFindMany = vi.fn();
const mockBirthdayViewerDeleteMany = vi.fn();
const mockBirthdayViewerCreateMany = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
  rateLimitPresets: {
    default: { maxRequests: 60, windowMs: 60000 },
    read: { maxRequests: 100, windowMs: 60000 },
  },
}));

vi.mock("@/lib/auth-utils", () => ({
  getSessionUserIdVerified: mockGetSessionUserIdVerified,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mockTransaction,
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

describe("PATCH /api/users/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockGetSessionUserIdVerified.mockResolvedValue("user-1");
    mockTransaction.mockImplementation(async (callback) =>
      callback({
        user: {
          findMany: mockViewerFindMany,
          update: mockUpdate,
        },
        birthdayViewer: {
          deleteMany: mockBirthdayViewerDeleteMany,
          createMany: mockBirthdayViewerCreateMany,
        },
      }),
    );
    mockUpdate.mockResolvedValue({
      id: "user-1",
      username: "user1",
      name: "Новое имя",
      avatarUrl: null,
      role: "USER",
      telegramId: null,
      telegramUsername: null,
      telegramLinkedAt: null,
      telegramConfirmedAt: null,
      telegramNotificationsEnabled: false,
      gender: "FEMALE",
      thematicHolidayConsent: true,
      giftPreferences: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("rejects password changes through the profile endpoint", async () => {
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ name: "Новое имя", password: "Strong1!" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Для смены пароля используйте отдельную форму",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("still updates regular profile fields", async () => {
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ name: "Новое имя" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.name).toBe("Новое имя");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Новое имя" },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
        telegramId: true,
        telegramUsername: true,
        telegramLinkedAt: true,
        telegramConfirmedAt: true,
        telegramNotificationsEnabled: true,
        calendarNotificationsEnabled: true,
        giftPreferences: true,
        gender: true,
        thematicHolidayConsent: true,
        birthdayDay: true,
        birthdayMonth: true,
        birthdayYear: true,
        birthdayAudience: true,
        birthdayViewers: { select: { viewerId: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it("updates gift preferences through the profile endpoint", async () => {
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({
        giftPreferences: {
          favoriteColors: ["розовый"],
          dislikedColors: ["черный"],
          doNotBuy: ["часы"],
          budget: "до 5000 ₽",
        },
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never);

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          giftPreferences: expect.objectContaining({
            favoriteColors: ["розовый"],
            dislikedColors: ["черный"],
            doNotBuy: ["часы"],
            budget: "до 5000 ₽",
          }),
        },
      }),
    );
  });

  it("сохраняет пол профиля и отдельное согласие на тематические праздники", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          gender: "FEMALE",
          thematicHolidayConsent: true,
        }),
        headers: { "content-type": "application/json" },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        gender: "FEMALE",
        thematicHolidayConsent: true,
      }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          gender: "FEMALE",
          thematicHolidayConsent: true,
        },
        select: expect.objectContaining({
          gender: true,
          thematicHolidayConsent: true,
        }),
      }),
    );
  });

  it("сохраняет отзыв согласия на тематические праздники", async () => {
    mockUpdate.mockResolvedValueOnce({
      id: "user-1",
      username: "user1",
      name: "Имя",
      avatarUrl: null,
      role: "USER",
      telegramId: null,
      telegramUsername: null,
      telegramLinkedAt: null,
      telegramConfirmedAt: null,
      telegramNotificationsEnabled: false,
      gender: "MALE",
      thematicHolidayConsent: false,
      giftPreferences: null,
      birthdayDay: null,
      birthdayMonth: null,
      birthdayYear: null,
      birthdayAudience: "PRIVATE",
      birthdayViewers: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ thematicHolidayConsent: false }),
        headers: { "content-type": "application/json" },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({ thematicHolidayConsent: false }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { thematicHolidayConsent: false },
      }),
    );
  });

  it("сохраняет день рождения и выбранную аудиторию", async () => {
    mockViewerFindMany.mockResolvedValue([{ id: "viewer-1" }, { id: "viewer-2" }]);
    mockUpdate.mockResolvedValueOnce({
      id: "user-1",
      username: "user1",
      name: "Имя",
      avatarUrl: null,
      role: "USER",
      telegramId: null,
      telegramUsername: null,
      telegramLinkedAt: null,
      telegramConfirmedAt: null,
      telegramNotificationsEnabled: false,
      giftPreferences: null,
      birthdayDay: 29,
      birthdayMonth: 2,
      birthdayYear: 2000,
      birthdayAudience: "SELECTED",
      birthdayViewers: [{ viewerId: "viewer-1" }, { viewerId: "viewer-2" }],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          birthday: {
            day: 29,
            month: 2,
            year: 2000,
            audience: "SELECTED",
            selectedViewerIds: ["viewer-1", "viewer-2"],
          },
        }),
        headers: { "content-type": "application/json" },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        birthday: {
          day: 29,
          month: 2,
          year: 2000,
          audience: "SELECTED",
          selectedViewerIds: ["viewer-1", "viewer-2"],
        },
      }),
    );
  });

  it("отклоняет несуществующую календарную дату", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          birthday: {
            day: 31,
            month: 2,
            year: null,
            audience: "ALL",
            selectedViewerIds: [],
          },
        }),
        headers: { "content-type": "application/json" },
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
