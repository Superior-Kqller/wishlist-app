const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Checking admin status...");
  
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
      console.log(`✅ Promoted user "${firstUser.username}" (${firstUser.name}) to ADMIN`);
    } else {
      console.log("❌ No users found in database");
    }
  } else {
    console.log(`✅ Found ${adminCount} admin(s), no changes needed.`);
    // Показываем список админов
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { username: true, name: true, createdAt: true },
    });
    admins.forEach(admin => {
      console.log(`   - ${admin.username} (${admin.name})`);
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
