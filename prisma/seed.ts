import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const POSITIONS = [
  {
    slug: "social-butterfly-26",
    title: "SOCIAL BUTTERFLY '26",
    description: "Most social",
    sortOrder: 1,
  },
  {
    slug: "prayer-warrior-26",
    title: "PRAYER WARRIOR '26",
    description: "Most spiritual",
    sortOrder: 2,
  },
  {
    slug: "golden-26",
    title: "GOLDEN '26",
    description: "Most kind, humble",
    sortOrder: 3,
  },
  {
    slug: "flawless-26",
    title: "FLAWLESS '26",
    description: "Smartest / imonga",
    sortOrder: 4,
  },
  {
    slug: "serene-26",
    title: "SERENE '26",
    description: "Most nonchalant",
    sortOrder: 5,
  },
];

const SAMPLE_ROSTER = [
  { fullName: "Alice Mukamana", email: "alice@school.edu" },
  { fullName: "Brian Niyonzima", email: "brian@school.edu" },
  { fullName: "Claire Uwase", email: "claire@school.edu" },
  { fullName: "David Habimana", email: "david@school.edu" },
  { fullName: "Esther Ingabire", email: "esther@school.edu" },
  { fullName: "Frank Irabaruta", email: "frank@school.edu" },
  { fullName: "Grace Manzi", email: "grace@school.edu" },
  { fullName: "Henry Nshuti", email: "henry@school.edu" },
];

async function main() {
  await prisma.systemSettings.upsert({
    where: { id: 1 },
    create: { id: 1, minApprovedVoters: 1, schoolEmailDomain: "school.edu" },
    update: { minApprovedVoters: 1 },
  });

  for (const p of POSITIONS) {
    await prisma.position.upsert({
      where: { slug: p.slug },
      create: p,
      update: {
        title: p.title,
        description: p.description,
        sortOrder: p.sortOrder,
      },
    });
  }

  for (const person of SAMPLE_ROSTER) {
    await prisma.person.upsert({
      where: { email: person.email },
      create: person,
      update: { fullName: person.fullName, active: true },
    });
  }

  console.log("Seed complete: positions + sample roster");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
