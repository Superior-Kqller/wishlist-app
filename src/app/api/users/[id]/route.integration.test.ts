import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { createPglitePrisma } from "@/test/pglite-prisma";

describe("DELETE /api/users/[id] with the Prisma/Postgres boundary", () => {
  let prisma: PrismaClient;
  let close: () => Promise<void>;
  let deleteUser: (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => Promise<Response>;
  let patchUser: (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => Promise<Response>;

  beforeAll(async () => {
    const context = await createPglitePrisma();
    prisma = context.prisma;
    close = context.close;

    vi.doMock("@/lib/rate-limit", () => ({
      rateLimit: vi.fn().mockResolvedValue(null),
      rateLimitPresets: { default: {}, read: {} },
    }));
    vi.doMock("@/lib/auth-utils", () => ({
      requireAdmin: vi.fn().mockResolvedValue({ id: "request-admin", role: "ADMIN" }),
    }));
    vi.doMock("@/lib/prisma", () => ({ prisma }));
    vi.doMock("@/lib/logger", () => ({ sanitizeError: vi.fn() }));

    const route = await import("./route");
    deleteUser = route.DELETE;
    patchUser = route.PATCH;
  }, 30_000);

  afterAll(async () => {
    vi.resetModules();
    await close();
  });

  async function seedUsers(adminCount = 2) {
    await prisma.user.deleteMany();
    await prisma.user.create({
      data: {
        id: "admin-a",
        username: "admin_a",
        password: "hash",
        name: "Admin A",
        role: "ADMIN",
      },
    });
    if (adminCount >= 2) {
      await prisma.user.create({
        data: {
          id: "admin-b",
          username: "admin_b",
          password: "hash",
          name: "Admin B",
          role: "ADMIN",
        },
      });
    }
    await prisma.user.create({
      data: {
        id: "user-c",
        username: "user_c",
        password: "hash",
        name: "User C",
        role: "USER",
      },
    });
  }

  function requestFor(id: string) {
    return deleteUser(new NextRequest(`http://localhost/api/users/${id}`, { method: "DELETE" }), {
      params: Promise.resolve({ id }),
    });
  }

  function patchFor(id: string, body: Record<string, unknown>) {
    return patchUser(
      new NextRequest(`http://localhost/api/users/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) },
    );
  }

  it("сохраняет администратора при повторной конкуренции двух DELETE", async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await seedUsers();
      const [first, second] = await Promise.all([requestFor("admin-a"), requestFor("admin-b")]);

      expect([first.status, second.status].sort()).toEqual([200, 400]);
      await expect(prisma.user.count({ where: { role: "ADMIN" } })).resolves.toBeGreaterThanOrEqual(
        1,
      );
    }
  });

  it("сохраняет обычное удаление пользователя", async () => {
    await seedUsers();

    const response = await requestFor("user-c");

    expect(response.status).toBe(200);
    await expect(prisma.user.findUnique({ where: { id: "user-c" } })).resolves.toBeNull();
    await expect(prisma.user.count({ where: { role: "ADMIN" } })).resolves.toBe(2);
  });

  it("возвращает текущую ошибку при попытке удалить последнего администратора", async () => {
    await seedUsers(1);

    const response = await requestFor("admin-a");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Нельзя удалить последнего администратора",
    });
    await expect(prisma.user.findUnique({ where: { id: "admin-a" } })).resolves.not.toBeNull();
  });

  it("сохраняет администратора при повторной конкуренции двух PATCH-demote", async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await seedUsers();
      const [first, second] = await Promise.all([
        patchFor("admin-a", { role: "USER" }),
        patchFor("admin-b", { role: "USER" }),
      ]);

      expect([first.status, second.status].sort()).toEqual([200, 400]);
      await expect(prisma.user.count({ where: { role: "ADMIN" } })).resolves.toBeGreaterThanOrEqual(
        1,
      );
    }
  });

  it("сохраняет администратора при конкуренции PATCH-demote и DELETE", async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await seedUsers();
      const [patchResponse, deleteResponse] = await Promise.all([
        patchFor("admin-a", { role: "USER" }),
        requestFor("admin-b"),
      ]);

      expect([patchResponse.status, deleteResponse.status].sort()).toEqual([200, 400]);
      await expect(prisma.user.count({ where: { role: "ADMIN" } })).resolves.toBeGreaterThanOrEqual(
        1,
      );
    }
  });

  it("сохраняет обычное обновление профиля", async () => {
    await seedUsers();

    const response = await patchFor("user-c", { name: "User C Updated" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: "user-c", name: "User C Updated" });
    await expect(prisma.user.count({ where: { role: "ADMIN" } })).resolves.toBe(2);
  });

  it("разрешает снять роль администратора при наличии другого администратора", async () => {
    await seedUsers();

    const response = await patchFor("admin-a", { role: "USER" });

    expect(response.status).toBe(200);
    await expect(prisma.user.findUnique({ where: { id: "admin-a" } })).resolves.toMatchObject({
      role: "USER",
    });
    await expect(prisma.user.count({ where: { role: "ADMIN" } })).resolves.toBe(1);
  });

  it("возвращает текущую ошибку при снятии роли с последнего администратора", async () => {
    await seedUsers(1);

    const response = await patchFor("admin-a", { role: "USER" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Нельзя снять роль с последнего администратора",
    });
    await expect(prisma.user.findUnique({ where: { id: "admin-a" } })).resolves.toMatchObject({
      role: "ADMIN",
    });
  });
});
