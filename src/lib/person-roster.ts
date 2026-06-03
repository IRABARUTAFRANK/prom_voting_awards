import type { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "@/lib/utils";

type VoterLike = { fullName: string; email: string };

/** Keeps Person roster in sync with voter registration names (email is for login only). */
export async function ensurePersonForVoter(
  prisma: PrismaClient,
  voter: VoterLike,
) {
  const email = normalizeEmail(voter.email);
  const fullName = voter.fullName.trim();

  const byEmail = await prisma.person.findUnique({ where: { email } });
  if (byEmail) {
    if (byEmail.fullName !== fullName || !byEmail.active) {
      return prisma.person.update({
        where: { id: byEmail.id },
        data: { fullName, active: true },
      });
    }
    return byEmail;
  }

  const byName = await prisma.person.findFirst({
    where: { fullName, email: null },
  });
  if (byName) {
    return prisma.person.update({
      where: { id: byName.id },
      data: { email, active: true },
    });
  }

  return prisma.person.create({
    data: { fullName, email, active: true },
  });
}

export async function syncMatchingVotersToRoster(
  prisma: PrismaClient,
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return;

  const voters = await prisma.voter.findMany({
    where: { status: { not: "PENDING" } },
    select: { fullName: true, email: true },
  });

  for (const voter of voters) {
    if (voter.fullName.toLowerCase().includes(q)) {
      await ensurePersonForVoter(prisma, voter);
    }
  }
}
