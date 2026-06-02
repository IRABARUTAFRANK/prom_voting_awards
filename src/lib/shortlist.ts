import { FinalistSource, PrismaClient } from "@prisma/client";

export type NominationCount = {
  personId: string;
  fullName: string;
  count: number;
};

export async function getNominationCounts(
  prisma: PrismaClient,
  positionId: string,
): Promise<NominationCount[]> {
  const rows = await prisma.nomination.groupBy({
    by: ["nomineeId"],
    where: { positionId },
    _count: { nomineeId: true },
  });

  const people = await prisma.person.findMany({
    where: { id: { in: rows.map((r) => r.nomineeId) } },
  });
  const nameMap = new Map(people.map((p) => [p.id, p.fullName]));

  return rows
    .map((r) => ({
      personId: r.nomineeId,
      fullName: nameMap.get(r.nomineeId) ?? "Unknown",
      count: r._count.nomineeId,
    }))
    .sort((a, b) => b.count - a.count || a.fullName.localeCompare(b.fullName));
}

export type AutoShortlistResult = {
  selected: NominationCount[];
  needsAdmin: boolean;
  tieNote?: string;
};

/** Pick up to 4; clear top 4 unless tie at 4th boundary */
export function computeAutoShortlist(
  counts: NominationCount[],
  slots = 4,
): AutoShortlistResult {
  if (counts.length === 0) {
    return { selected: [], needsAdmin: true, tieNote: "No nominations yet" };
  }

  if (counts.length <= slots) {
    return { selected: counts, needsAdmin: counts.length < slots };
  }

  const cutoffCount = counts[slots - 1]!.count;
  const aboveCutoff = counts.filter((c) => c.count > cutoffCount);
  const atCutoff = counts.filter((c) => c.count === cutoffCount);

  if (aboveCutoff.length >= slots) {
    return { selected: aboveCutoff.slice(0, slots), needsAdmin: false };
  }

  const slotsRemaining = slots - aboveCutoff.length;
  if (atCutoff.length === slotsRemaining) {
    return { selected: [...aboveCutoff, ...atCutoff], needsAdmin: false };
  }

  if (atCutoff.length > slotsRemaining) {
    return {
      selected: aboveCutoff,
      needsAdmin: true,
      tieNote: `Tie at ${cutoffCount} nomination(s) for remaining slot(s). Admin must choose.`,
    };
  }

  return {
    selected: [...aboveCutoff, ...atCutoff],
    needsAdmin: true,
    tieNote: "Fewer than 4 unique nominees — admin can add more.",
  };
}

export async function applyAutoShortlist(
  prisma: PrismaClient,
  positionId: string,
) {
  const counts = await getNominationCounts(prisma, positionId);
  const { selected, needsAdmin, tieNote } = computeAutoShortlist(counts);

  await prisma.finalist.deleteMany({
    where: { positionId, source: FinalistSource.AUTO },
  });

  for (let i = 0; i < selected.length; i++) {
    const s = selected[i]!;
    await prisma.finalist.upsert({
      where: {
        positionId_personId: { positionId, personId: s.personId },
      },
      create: {
        positionId,
        personId: s.personId,
        source: FinalistSource.AUTO,
        sortOrder: i,
      },
      update: { source: FinalistSource.AUTO, sortOrder: i },
    });
  }

  return { selected, needsAdmin, tieNote, totalNominees: counts.length };
}
