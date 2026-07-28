import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

export async function createPglitePrisma() {
  const database = await PGlite.create();
  const migrationsRoot = path.resolve(process.cwd(), "prisma/migrations");
  const migrationDirectories = (await readdir(migrationsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const directory of migrationDirectories) {
    const sql = await readFile(path.join(migrationsRoot, directory, "migration.sql"), "utf8");
    await database.exec(sql);
  }

  const server = new PGLiteSocketServer({
    db: database,
    host: "127.0.0.1",
    port: 0,
    maxConnections: 10,
  });
  await server.start();

  const pool = new Pool({
    connectionString: `postgresql://postgres:postgres@${server.getServerConn()}/postgres?sslmode=disable`,
    max: 5,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  return {
    prisma,
    async close() {
      await prisma.$disconnect();
      await pool.end();
      await server.stop();
      await database.close();
    },
  };
}
