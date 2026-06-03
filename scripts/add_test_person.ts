import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "benatah.rhema0138@hopehavenschool.org";
  const fullName = "Benatah Rhema";

  const person = await prisma.person.upsert({
    where: { email },
    create: { fullName, email },
    update: { fullName, active: true },
  });

  console.log("Person upserted:", person);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
