import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { DEFAULT_REMOVAL_MESSAGE } from "@/lib/voter-removal";

const schema = z.object({
  voterId: z.string(),
  reason: z.string().min(1).max(500).optional(),
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const voter = await prisma.voter.findUnique({ where: { id: body.data.voterId } });
  if (!voter) {
    return NextResponse.json({ error: "Voter not found" }, { status: 404 });
  }
  if (voter.removedAt) {
    return NextResponse.json({ error: "This voter is already removed." }, { status: 409 });
  }

  const reason = body.data.reason?.trim() || DEFAULT_REMOVAL_MESSAGE;

  await prisma.voter.update({
    where: { id: voter.id },
    data: {
      removedAt: new Date(),
      removalReason: reason,
      codeHash: null,
      accessCodePlaintext: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "admin",
      action: "REMOVE_VOTER",
      metadata: JSON.stringify({ voterId: voter.id, email: voter.email, reason }),
    },
  });

  return NextResponse.json({
    ok: true,
    message: `Removed ${voter.fullName}. They will see: "${reason}"`,
  });
}
