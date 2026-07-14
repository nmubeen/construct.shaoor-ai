import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(
    "Admin@123",
    12
  );

  await prisma.user.upsert({
    where: {
      email: "admin@samconstruction.com",
    },
    update: {},
    create: {
      name: "Administrator",

      email: "admin@samconstruction.com",

      passwordHash,

      role: "ADMIN",
    },
  });

  console.log("✅ Admin user created");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });