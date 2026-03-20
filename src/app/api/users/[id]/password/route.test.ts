import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRateLimit = vi.fn();
const mockGetCurrentUserId = vi.fn();
const mockGetCurrentUserWithDbCheck = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockHash = vi.fn();
const mockCompare = vi.fn();
const mockSanitizeError = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
  rateLimitPresets: {
    default: { maxRequests: 20, windowMs: 60000, useIP: true },
  },
}));

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUserId: mockGetCurrentUserId,
  getCurrentUserWithDbCheck: mockGetCurrentUserWithDbCheck,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  sanitizeError: mockSanitizeError,
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: mockHash,
    compare: mockCompare,
  },
}));

describe("PATCH /api/users/[id]/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockGetCurrentUserId.mockResolvedValue("user-1");
    mockGetCurrentUserWithDbCheck.mockResolvedValue({ id: "user-1", role: "USER" });
    mockFindUnique.mockResolvedValue({ id: "user-1", password: "stored-hash" });
    mockUpdate.mockResolvedValue({ id: "user-1" });
    mockHash.mockResolvedValue("new-hash");
    mockCompare.mockResolvedValue(true);
  });

  it("требует currentPassword для self-change не-админа", async () => {
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/user-1/password", {
      method: "PATCH",
      body: JSON.stringify({ password: "Strong1!" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never, {
      params: Promise.resolve({ id: "user-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Для смены пароля укажите текущий пароль",
    });
    expect(mockCompare).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("возвращает 401 без авторизации", async () => {
    mockGetCurrentUserId.mockResolvedValue(null);
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/user-1/password", {
      method: "PATCH",
      body: JSON.stringify({ password: "Strong1!", currentPassword: "Correct1!" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never, {
      params: Promise.resolve({ id: "user-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Необходима авторизация" });
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("возвращает 403 для non-admin при попытке менять чужой пароль", async () => {
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/user-2/password", {
      method: "PATCH",
      body: JSON.stringify({ password: "Strong1!", currentPassword: "Correct1!" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never, {
      params: Promise.resolve({ id: "user-2" }),
    });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: "Можно менять только свой пароль" });
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("делает early return при rate-limit", async () => {
    mockRateLimit.mockResolvedValueOnce(new Response("Too Many Requests", { status: 429 }));
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/user-1/password", {
      method: "PATCH",
      body: JSON.stringify({ password: "Strong1!", currentPassword: "Correct1!" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never, {
      params: Promise.resolve({ id: "user-1" }),
    });

    expect(response.status).toBe(429);
    expect(mockGetCurrentUserId).not.toHaveBeenCalled();
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("возвращает 400 для невалидного JSON", async () => {
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/user-1/password", {
      method: "PATCH",
      body: "{",
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never, {
      params: Promise.resolve({ id: "user-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Невалидный JSON в теле запроса" });
    expect(mockSanitizeError).not.toHaveBeenCalled();
  });

  it("возвращает 400 при неверном currentPassword", async () => {
    mockCompare.mockResolvedValue(false);
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/user-1/password", {
      method: "PATCH",
      body: JSON.stringify({
        password: "Strong1!",
        currentPassword: "Wrong1!",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never, {
      params: Promise.resolve({ id: "user-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Текущий пароль указан неверно",
    });
    expect(mockCompare).toHaveBeenCalledWith("Wrong1!", "stored-hash");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("меняет пароль при корректном currentPassword для self-change", async () => {
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/user-1/password", {
      method: "PATCH",
      body: JSON.stringify({
        password: "Strong1!",
        currentPassword: "Correct1!",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never, {
      params: Promise.resolve({ id: "user-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(mockCompare).toHaveBeenCalledWith("Correct1!", "stored-hash");
    expect(mockHash).toHaveBeenCalledWith("Strong1!", 12);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "new-hash" },
    });
  });

  it("не требует currentPassword для admin reset-flow чужого пароля", async () => {
    mockGetCurrentUserId.mockResolvedValue("admin-1");
    mockGetCurrentUserWithDbCheck.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    mockFindUnique.mockResolvedValue({ id: "user-2", password: "stored-hash-user-2" });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/user-2/password", {
      method: "PATCH",
      body: JSON.stringify({ password: "Strong1!" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never, {
      params: Promise.resolve({ id: "user-2" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(mockCompare).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { password: "new-hash" },
    });
  });

  it("требует currentPassword для admin self-change", async () => {
    mockGetCurrentUserId.mockResolvedValue("admin-1");
    mockGetCurrentUserWithDbCheck.mockResolvedValue({ id: "admin-1", role: "ADMIN" });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/admin-1/password", {
      method: "PATCH",
      body: JSON.stringify({ password: "Strong1!" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never, {
      params: Promise.resolve({ id: "admin-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Для смены пароля укажите текущий пароль",
    });
    expect(mockCompare).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
