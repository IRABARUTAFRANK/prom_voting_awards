import { NextResponse } from "next/server";
import { getVoterSession } from "@/lib/auth";
import { prisma, getSettings } from "@/lib/db";
import { voterIsRemoved, voterMayParticipate } from "@/lib/voter-guards";
import { NO_STORE_HEADERS } from "@/lib/api-headers";

export async function GET() {
  const session = await getVoterSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const [voter, settings, positions] = await Promise.all([
    prisma.voter.findUnique({ where: { id: session.voterId } }),
    getSettings(),
    prisma.position.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        finalists: { include: { person: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  if (!voter) {
    return NextResponse.json({ error: "Voter not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  if (voterIsRemoved(voter.removedAt)) {
    return NextResponse.json(
      { error: voter.removalReason ?? "Your account was removed by an admin." },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  const nominations = await prisma.nomination.findMany({
    where: { voterId: voter.id },
    include: { position: true, nominee: true },
  });

  const finalVotes = await prisma.finalVote.findMany({
    where: { voterId: voter.id },
    include: { position: true, person: true },
  });

  const approvedCount = await prisma.voter.count({
    where: { status: { not: "PENDING" } },
  });

  const finalistsReady = positions.every((p) => p.finalists.length >= 4);

  return NextResponse.json(
    {
      voter: {
        id: voter.id,
        fullName: voter.fullName,
        email: voter.email,
        status: voter.status,
        canParticipate: voterMayParticipate(voter.status),
      },
      settings: {
        registrationOpen: settings.registrationOpen,
        nominationOpen: settings.nominationOpen,
        finalVoteOpen: settings.finalVoteOpen,
        liveResultsVisibleToVoters: settings.liveResultsVisibleToVoters,
        minApprovedVoters: settings.minApprovedVoters,
      },
      approvedCount,
      finalistsReady,
      positions,
      nominations,
      finalVotes,
    },
    { headers: NO_STORE_HEADERS },
  );
}
