import { NextResponse } from "next/server";
import { getVoterSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { voterMayParticipate } from "@/lib/voter-guards";
import { getFinalVoteResults } from "@/lib/vote-results";

export async function GET() {
  const session = await getVoterSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const voter = await prisma.voter.findUnique({
    where: { id: session.voterId },
    select: { status: true },
  });
  if (!voter || !voterMayParticipate(voter.status)) {
    return NextResponse.json({ error: "Not approved" }, { status: 403 });
  }

  const settings = await prisma.systemSettings.findFirst();
  const finalVoteOpen = settings?.finalVoteOpen ?? false;
  const mayView =
    finalVoteOpen || voter.status === "FINAL_VOTED" || voter.status === "NOMINATION_SUBMITTED";

  if (!mayView) {
    return NextResponse.json(
      { error: "Live results are not available until final voting opens." },
      { status: 403 },
    );
  }

  const results = await getFinalVoteResults();
  const totalBallots = await prisma.voter.count({
    where: { status: "FINAL_VOTED" },
  });

  return NextResponse.json({
    finalVoteOpen,
    totalBallots,
    results,
  });
}
