import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const positions = await prisma.position.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      finalists: { include: { person: true } },
    },
  });

  const results = await Promise.all(
    positions.map(async (pos) => {
      const votes = await prisma.finalVote.groupBy({
        by: ["personId"],
        where: { positionId: pos.id },
        _count: { personId: true },
      });
      const people = await prisma.person.findMany({
        where: { id: { in: votes.map((v) => v.personId) } },
      });
      const nameMap = new Map(people.map((p) => [p.id, p.fullName]));
      const ranked = votes
        .map((v) => ({
          personId: v.personId,
          fullName: nameMap.get(v.personId) ?? "?",
          votes: v._count.personId,
        }))
        .sort((a, b) => b.votes - a.votes);

      return {
        position: pos,
        ranked,
        winner: ranked[0] ?? null,
      };
    }),
  );

  return NextResponse.json({ results });
}
