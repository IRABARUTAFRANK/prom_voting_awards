import { NextResponse } from "next/server";
import { z } from "zod";
import { getVoterSession } from "@/lib/auth";
import { prisma, getSettings, tuneSqliteForConcurrency } from "@/lib/db";
import { voterMayParticipate } from "@/lib/voter-guards";
import { resolveNomineeId } from "@/lib/resolve-nominee";

const schema = z.object({
  nominations: z.array(
    z.object({
      positionId: z.string(),
      nomineeId: z.string().optional(),
      nomineeName: z.string().optional(),
    }),
  ),
});

export async function POST(req: Request) {
  const session = await getVoterSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  if (!settings.nominationOpen) {
    return NextResponse.json({ error: "Nomination phase is closed." }, { status: 403 });
  }

  const voter = await prisma.voter.findUnique({ where: { id: session.voterId } });
  if (!voter || !voterMayParticipate(voter.status)) {
    return NextResponse.json(
      { error: "Awaiting admin approval. An admin must approve you before you can nominate." },
      { status: 403 },
    );
  }
  if (voter.status === "NOMINATION_SUBMITTED" || voter.status === "FINAL_VOTED") {
    return NextResponse.json({ error: "You already submitted nominations." }, { status: 409 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  await tuneSqliteForConcurrency();

  const resolved: Array<{ positionId: string; nomineeId: string }> = [];
  for (const n of body.data.nominations) {
    const nomineeId = await resolveNomineeId(prisma, n.nomineeId, n.nomineeName);
    if (!nomineeId) {
      return NextResponse.json(
        {
          error:
            "One or more names were not found. Pick from the list or type the full name exactly as on the roster.",
        },
        { status: 400 },
      );
    }
    resolved.push({ positionId: n.positionId, nomineeId });
  }

  const positions = await prisma.position.findMany({
    where: { active: true },
  });
  if (resolved.length !== positions.length) {
    return NextResponse.json(
      { error: `Nominate one person for each of the ${positions.length} positions.` },
      { status: 400 },
    );
  }

  const nomineeIds = resolved.map((n) => n.nomineeId);
  const uniqueNomineeIds = [...new Set(nomineeIds)];
  const validNominees = await prisma.person.findMany({
    where: { id: { in: uniqueNomineeIds }, active: true },
    select: { id: true },
  });
  if (validNominees.length !== uniqueNomineeIds.length) {
    return NextResponse.json(
      { error: "One or more nominees are invalid. Pick each name from the list." },
      { status: 400 },
    );
  }

  const positionIds = new Set(resolved.map((n) => n.positionId));
  if (positionIds.size !== resolved.length) {
    return NextResponse.json({ error: "Duplicate position in submission." }, { status: 400 });
  }

  const nominees = await prisma.person.findMany({
    where: { id: { in: uniqueNomineeIds } },
    select: { id: true, email: true, fullName: true },
  });
  const voterName = voter.fullName.trim().toLowerCase();
  const selfNominee = nominees.find(
    (n) =>
      n.email?.toLowerCase() === voter.email.toLowerCase() ||
      n.fullName.trim().toLowerCase() === voterName,
  );
  if (selfNominee) {
    return NextResponse.json({ error: "You cannot nominate yourself." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const n of resolved) {
      await tx.nomination.upsert({
        where: {
          voterId_positionId: {
            voterId: voter.id,
            positionId: n.positionId,
          },
        },
        create: {
          voterId: voter.id,
          positionId: n.positionId,
          nomineeId: n.nomineeId,
        },
        update: { nomineeId: n.nomineeId },
      });
    }
    await tx.voter.update({
      where: { id: voter.id },
      data: { status: "NOMINATION_SUBMITTED" },
    });
  });

  await prisma.auditLog.create({
    data: {
      actorType: "voter",
      actorId: voter.id,
      action: "NOMINATION_SUBMITTED",
    },
  });

  return NextResponse.json({ ok: true });
}
