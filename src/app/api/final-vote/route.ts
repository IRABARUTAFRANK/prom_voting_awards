import { NextResponse } from "next/server";
import { z } from "zod";
import { getVoterSession } from "@/lib/auth";
import { prisma, getSettings } from "@/lib/db";

const schema = z.object({
  votes: z.array(
    z.object({
      positionId: z.string(),
      personId: z.string(),
    }),
  ),
});

export async function POST(req: Request) {
  const session = await getVoterSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  if (!settings.finalVoteOpen) {
    return NextResponse.json({ error: "Final voting is closed." }, { status: 403 });
  }

  const voter = await prisma.voter.findUnique({ where: { id: session.voterId } });
  if (!voter || voter.status === "PENDING") {
    return NextResponse.json({ error: "Not approved to vote." }, { status: 403 });
  }
  if (voter.status === "FINAL_VOTED") {
    return NextResponse.json({ error: "You already cast your final vote." }, { status: 409 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const positions = await prisma.position.findMany({
    where: { active: true },
    include: { finalists: true },
  });

  for (const pos of positions) {
    if (pos.finalists.length < 4) {
      return NextResponse.json(
        { error: `Position "${pos.title}" does not have 4 finalists yet.` },
        { status: 403 },
      );
    }
  }

  if (body.data.votes.length !== positions.length) {
    return NextResponse.json(
      { error: "Vote for exactly one finalist per position." },
      { status: 400 },
    );
  }

  for (const vote of body.data.votes) {
    const pos = positions.find((p) => p.id === vote.positionId);
    if (!pos) {
      return NextResponse.json({ error: "Invalid position." }, { status: 400 });
    }
    const allowed = pos.finalists.some((f) => f.personId === vote.personId);
    if (!allowed) {
      return NextResponse.json({ error: "Invalid finalist choice." }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const v of body.data!.votes) {
      await tx.finalVote.upsert({
        where: {
          voterId_positionId: { voterId: voter.id, positionId: v.positionId },
        },
        create: {
          voterId: voter.id,
          positionId: v.positionId,
          personId: v.personId,
        },
        update: { personId: v.personId },
      });
    }
    await tx.voter.update({
      where: { id: voter.id },
      data: { status: "FINAL_VOTED" },
    });
  });

  await prisma.auditLog.create({
    data: {
      actorType: "voter",
      actorId: voter.id,
      action: "FINAL_VOTE_SUBMITTED",
    },
  });

  return NextResponse.json({ ok: true });
}
