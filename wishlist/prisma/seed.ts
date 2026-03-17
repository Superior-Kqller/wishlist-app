import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  
  // Если пользователей нет, создаем их
  if (userCount === 0) {
    const user1Username = process.env.SEED_USER1_USERNAME || "user1";
    const user1Password = process.env.SEED_USER1_PASSWORD || "changeme";
    const user1Name = process.env.SEED_USER1_NAME || "User One";

    const user2Username = process.env.SEED_USER2_USERNAME || "user2";
    const user2Password = process.env.SEED_USER2_PASSWORD || "changeme";
    const user2Name = process.env.SEED_USER2_NAME || "User Two";

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
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
