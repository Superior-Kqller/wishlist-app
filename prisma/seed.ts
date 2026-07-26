import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";

const UNSAFE_DEFAULT_PASSWORDS = new Set(["changeme"]);
const DEFAULT_SEED_USER1_USERNAME = "user1";
const DEFAULT_SEED_USER2_USERNAME = "user2";
const DEFAULT_SEED_USER1_PASSWORD = "changeme";
const DEFAULT_SEED_USER2_PASSWORD = "changeme";
const DEFAULT_SEED_USER1_NAME = "User One";
const DEFAULT_SEED_USER2_NAME = "User Two";

interface DefaultHoliday {
  seedKey: string;
  name: string;
  ruleKind: "FIXED" | "NTH_WEEKDAY";
  month: number;
  day?: number;
  weekday?: number;
  occurrence?: number;
  theme?: "MALE" | "FEMALE";
}

export const DEFAULT_HOLIDAYS: DefaultHoliday[] = [
  { seedKey: "new-year", name: "Новый год", ruleKind: "FIXED", month: 1, day: 1 },
  { seedKey: "christmas", name: "Рождество", ruleKind: "FIXED", month: 1, day: 7 },
  { seedKey: "valentines-day", name: "День святого Валентина", ruleKind: "FIXED", month: 2, day: 14 },
  { seedKey: "defender-day", name: "23 февраля", ruleKind: "FIXED", month: 2, day: 23, theme: "MALE" },
  { seedKey: "womens-day", name: "8 марта", ruleKind: "FIXED", month: 3, day: 8, theme: "FEMALE" },
  { seedKey: "spring-labor-day", name: "1 мая", ruleKind: "FIXED", month: 5, day: 1 },
  { seedKey: "victory-day", name: "День Победы", ruleKind: "FIXED", month: 5, day: 9 },
  { seedKey: "childrens-day", name: "День защиты детей", ruleKind: "FIXED", month: 6, day: 1 },
  { seedKey: "russia-day", name: "День России", ruleKind: "FIXED", month: 6, day: 12 },
  { seedKey: "family-day", name: "День семьи, любви и верности", ruleKind: "FIXED", month: 7, day: 8 },
  { seedKey: "knowledge-day", name: "День знаний", ruleKind: "FIXED", month: 9, day: 1 },
  { seedKey: "teachers-day", name: "День учителя", ruleKind: "FIXED", month: 10, day: 5 },
  { seedKey: "fathers-day", name: "День отца", ruleKind: "NTH_WEEKDAY", month: 10, weekday: 0, occurrence: 3 },
  { seedKey: "mothers-day", name: "День матери", ruleKind: "NTH_WEEKDAY", month: 11, weekday: 0, occurrence: -1 },
  { seedKey: "unity-day", name: "День народного единства", ruleKind: "FIXED", month: 11, day: 4 },
] ;

export async function seedDefaultHolidays(prisma: {
  holiday: {
    createMany(args: { data: DefaultHoliday[]; skipDuplicates: boolean }): Promise<unknown>;
  };
}) {
  await prisma.holiday.createMany({ data: DEFAULT_HOLIDAYS, skipDuplicates: true });
}

export function assertSafeSeedConfig(env: NodeJS.ProcessEnv = process.env): void {
  const normalizedEnv = env.NODE_ENV?.trim().toLowerCase();
  const isProtectedMode = !normalizedEnv || normalizedEnv === "production";
  if (!isProtectedMode) {
    return;
  }

  const unsafeVars: string[] = [];
  const checks: Array<[string, string | undefined]> = [
    ["SEED_USER1_PASSWORD", env.SEED_USER1_PASSWORD],
    ["SEED_USER2_PASSWORD", env.SEED_USER2_PASSWORD],
  ];

  for (const [name, rawValue] of checks) {
    const value = rawValue?.trim();
    if (!value || UNSAFE_DEFAULT_PASSWORDS.has(value.toLowerCase())) {
      unsafeVars.push(name);
    }
  }

  if (unsafeVars.length > 0) {
    throw new Error(
      `Unsafe seed config for production: ${unsafeVars.join(
        ", "
      )}. Set strong non-default passwords (forbidden default: "changeme").`
    );
  }
}

export function assertSafeSeedUsernames(
  env: NodeJS.ProcessEnv = process.env
): { user1Username: string; user2Username: string } {
  const user1Username = (env.SEED_USER1_USERNAME ?? DEFAULT_SEED_USER1_USERNAME).trim();
  const user2Username = (env.SEED_USER2_USERNAME ?? DEFAULT_SEED_USER2_USERNAME).trim();

  if (!user1Username) {
    throw new Error("Unsafe seed config: SEED_USER1_USERNAME must be non-empty.");
  }
  if (!user2Username) {
    throw new Error("Unsafe seed config: SEED_USER2_USERNAME must be non-empty.");
  }
  if (user1Username.toLowerCase() === user2Username.toLowerCase()) {
    throw new Error(
      "Unsafe seed config: SEED_USER1_USERNAME and SEED_USER2_USERNAME must be different."
    );
  }

  return { user1Username, user2Username };
}

async function main() {
  assertSafeSeedConfig(process.env);
  const { user1Username, user2Username } = assertSafeSeedUsernames(process.env);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await seedDefaultHolidays(prisma);
    const userCount = await prisma.user.count();

    // Если пользователей нет, создаем их
    if (userCount === 0) {
      const user1Password = process.env.SEED_USER1_PASSWORD || DEFAULT_SEED_USER1_PASSWORD;
      const user1Name = process.env.SEED_USER1_NAME || DEFAULT_SEED_USER1_NAME;

      const user2Password = process.env.SEED_USER2_PASSWORD || DEFAULT_SEED_USER2_PASSWORD;
      const user2Name = process.env.SEED_USER2_NAME || DEFAULT_SEED_USER2_NAME;

      const hash1 = await bcrypt.hash(user1Password, 12);
      const hash2 = await bcrypt.hash(user2Password, 12);

      await prisma.user.create({
        data: {
          username: user1Username,
          password: hash1,
          name: user1Name,
          role: "ADMIN", // Первый пользователь - админ
        },
      });

      await prisma.user.create({
        data: {
          username: user2Username,
          password: hash2,
          name: user2Name,
          role: "USER", // Второй пользователь - обычный пользователь
        },
      });

      console.log(`Created users: ${user1Username}, ${user2Username}`);
    } else {
      console.log("Users already exist, checking admin status...");

      // Проверяем, есть ли хотя бы один админ
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount === 0) {
        console.log("No admin found, promoting first user to ADMIN...");
        // Находим первого пользователя (по дате создания)
        const firstUser = await prisma.user.findFirst({
          orderBy: { createdAt: "asc" },
        });

        if (firstUser) {
          await prisma.user.update({
            where: { id: firstUser.id },
            data: { role: "ADMIN" },
          });
          console.log(`Promoted user "${firstUser.username}" to ADMIN`);
        }
      } else {
        console.log(`Found ${adminCount} admin(s), no changes needed.`);
      }
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

const isDirectExecution =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
