/**
 * One-time backfill: create Person rows for all approved+ voters so nomination search works.
 * Run: npx tsx scripts/sync_voter_roster.ts
 */
import { PrismaClient } from "@prisma/client";
import { ensurePersonForVoter } from "../src/lib/person-roster";

const prisma = new PrismaClient();

async function main() {
  const voters = await prisma.voter.findMany({
    where: { status: { not: "PENDING" } },
    select: { fullName: true, email: true },
  });
  for (const v of voters) {
    await ensurePersonForVoter(prisma, v);
  }
  console.log(`Synced ${voters.length} voter(s) to Person roster.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
