import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import {
  buildRosterCode,
  hashCode,
  nextRosterIndex,
  normalizeVoterCode,
} from "@/lib/codes";
import { ensurePersonForVoter } from "@/lib/person-roster";

const schema = z.object({
  voterIds: z.array(z.string()).optional(),
  approveAllPending: z.boolean().optional(),
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const where = body.data.approveAllPending
    ? { status: "PENDING" as const, removedAt: null }
    : {
        id: { in: body.data.voterIds ?? [] },
        status: "PENDING" as const,
        removedAt: null,
      };

  const pending = await prisma.voter.findMany({ where });
  let approved = 0;

  for (const voter of pending) {
    const rosterIndex = await nextRosterIndex(prisma);
    const firstName = voter.fullName.trim().split(/\s+/)[0] ?? voter.fullName;
    const normalized = normalizeVoterCode(buildRosterCode(firstName, rosterIndex));
    const codeHash = await hashCode(normalized);
    await prisma.voter.update({
      where: { id: voter.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        rosterIndex,
        loginCode: normalized,
        codeHash,
        accessCodePlaintext: normalized,
        codeRevealedAt: null,
      },
    });
    await ensurePersonForVoter(prisma, {
      fullName: voter.fullName,
      email: voter.email,
    });
    approved += 1;
  }

  if (approved > 0) {
    await prisma.auditLog.create({
      data: {
        actorType: "admin",
        action: "APPROVE_VOTERS",
        metadata: JSON.stringify({ count: approved, phasesUnchanged: true }),
      },
    });
  }

  return NextResponse.json({
    approved,
    message:
      "Voters approved. They must collect their code from the voter portal. Nomination and final vote forms stay closed until you release each phase.",
  });
}
