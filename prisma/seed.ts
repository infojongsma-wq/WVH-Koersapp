import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "infojongsma@gmail.com")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  for (const email of adminEmails) {
    await prisma.whitelistEntry.upsert({
      where: { email },
      create: { email, note: "Admin bootstrap" },
      update: {},
    });
    console.log(`Whitelisted ${email}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
