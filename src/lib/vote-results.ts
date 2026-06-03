import { prisma } from "@/lib/db";

export type RankedCandidate = {
  personId: string;
  fullName: string;
  votes: number;
  percent: number;
};

export type PositionResult = {
  positionId: string;
  title: string;
  description: string;
  totalVotes: number;
  ranked: RankedCandidate[];
  winner: RankedCandidate | null;
};

export async function getFinalVoteResults(): Promise<PositionResult[]> {
  const positions = await prisma.position.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      finalists: { include: { person: true } },
    },
  });

  return Promise.all(
    positions.map(async (pos) => {
      const voteGroups = await prisma.finalVote.groupBy({
        by: ["personId"],
        where: { positionId: pos.id },
        _count: { personId: true },
      });

      const voteMap = new Map(
        voteGroups.map((v) => [v.personId, v._count.personId]),
      );

      const finalistIds = new Set(pos.finalists.map((f) => f.personId));
      const allPersonIds = new Set([
        ...finalistIds,
        ...voteGroups.map((v) => v.personId),
      ]);

      const people = await prisma.person.findMany({
        where: { id: { in: [...allPersonIds] } },
      });
      const nameMap = new Map(people.map((p) => [p.id, p.fullName]));

      const ranked: RankedCandidate[] = [...allPersonIds]
        .map((personId) => ({
          personId,
          fullName:
            nameMap.get(personId) ??
            pos.finalists.find((f) => f.personId === personId)?.person.fullName ??
            "?",
          votes: voteMap.get(personId) ?? 0,
          percent: 0,
        }))
        .sort((a, b) => b.votes - a.votes);

      const totalVotes = ranked.reduce((sum, r) => sum + r.votes, 0);
      for (const r of ranked) {
        r.percent = totalVotes > 0 ? Math.round((r.votes / totalVotes) * 1000) / 10 : 0;
      }

      return {
        positionId: pos.id,
        title: pos.title,
        description: pos.description,
        totalVotes,
        ranked,
        winner: ranked[0] && ranked[0].votes > 0 ? ranked[0] : null,
      };
    }),
  );
}
