import { NextResponse } from "next/server";
import { z } from "zod";
import { getVoterSession } from "@/lib/auth";
import { prisma, getSettings } from "@/lib/db";

const schema = z.object({
  phase: z.enum(["nomination", "final"]),
});

/** After completing Google Form, voter confirms here so the system marks their phase complete. */
export async function POST(req: Request) {
  const session = await getVoterSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid phase." }, { status: 400 });
  }

  const [voter, settings] = await Promise.all([
    prisma.voter.findUnique({ where: { id: session.voterId } }),
    getSettings(),
  ]);

  if (!voter || voter.status === "PENDING") {
    return NextResponse.json({ error: "Not approved." }, { status: 403 });
  }

  if (body.data.phase === "nomination") {
    if (!settings.nominationOpen) {
      return NextResponse.json({ error: "Nomination closed." }, { status: 403 });
    }
    if (!settings.nominationGoogleFormUrl) {
      return NextResponse.json({ error: "No Google Form URL configured." }, { status: 400 });
    }
    if (voter.status !== "APPROVED") {
      return NextResponse.json({ error: "Already marked for nomination phase." }, { status: 409 });
    }
    await prisma.voter.update({
      where: { id: voter.id },
      data: {
        status: "NOMINATION_SUBMITTED",
        usedGoogleFormNomination: true,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorType: "voter",
        actorId: voter.id,
        action: "GOOGLE_FORM_NOMINATION_CONFIRMED",
      },
    });
    return NextResponse.json({
      ok: true,
      note: "Nomination tallies use in-app submissions. Ask admin to import Google Form responses if needed.",
    });
  }

  if (!settings.finalVoteOpen) {
    return NextResponse.json({ error: "Final vote closed." }, { status: 403 });
  }
  if (!settings.finalVoteGoogleFormUrl) {
    return NextResponse.json({ error: "No Google Form URL configured." }, { status: 400 });
  }
  if (voter.status === "FINAL_VOTED") {
    return NextResponse.json({ error: "Already voted." }, { status: 409 });
  }

  await prisma.voter.update({
    where: { id: voter.id },
    data: {
      status: "FINAL_VOTED",
      usedGoogleFormFinal: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "voter",
      actorId: voter.id,
      action: "GOOGLE_FORM_FINAL_CONFIRMED",
    },
  });

  return NextResponse.json({ ok: true });
}
