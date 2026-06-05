import type { PrismaClient } from "@prisma/client";

/** Match nominee by id or exact full name (typed without picking from list). */
export async function resolveNomineeId(
  prisma: PrismaClient,
  nomineeId: string | undefined,
  nomineeName: string | undefined,
): Promise<string | null> {
  if (nomineeId) {
    const byId = await prisma.person.findFirst({
      where: { id: nomineeId, active: true },
      select: { id: true },
    });
    if (byId) return byId.id;
  }

  const name = nomineeName?.trim();
  if (!name) return null;

  const exact = await prisma.person.findFirst({
    where: { fullName: name, active: true },
    select: { id: true },
  });
  if (exact) return exact.id;

  const insensitive = await prisma.person.findMany({
    where: { active: true },
    select: { id: true, fullName: true },
  });
  const lower = name.toLowerCase();
  const match = insensitive.find((p) => p.fullName.trim().toLowerCase() === lower);
  return match?.id ?? null;
}
