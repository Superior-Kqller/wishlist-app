import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

/**
 * Пул для PrismaPg. Версия `pg` зафиксирована на 8.18.x: с 8.19 драйвер предупреждает
 * (и в 9.0 запретит) параллельные `client.query()` на одном соединении; адаптер Prisma
 * в отдельных случаях всё ещё провоцирует это. См. package.json → `pg`.
 */
const pool =
  globalForPrisma.pool ??
  (globalForPrisma.pool = new Pool({ connectionString: databaseUrl }));
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  (globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  }));
