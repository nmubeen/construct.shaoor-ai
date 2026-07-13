import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminEmail = "admin@2yards.com";
  const adminPassword = "Admin@123";

  const existingUser = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        name: "Administrator",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });

    console.log("✅ Admin user created");
    console.log("--------------------------------");
    console.log(`Email    : ${adminEmail}`);
    console.log(`Password : ${adminPassword}`);
    console.log("--------------------------------");
  } else {
    console.log("ℹ️ Admin user already exists");
  }

  console.log("✅ Database seeded successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });