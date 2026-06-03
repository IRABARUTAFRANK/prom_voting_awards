import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { generateVoterCode, hashCode } from "@/lib/codes";

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
    ? { status: "PENDING" as const }
    : { id: { in: body.data.voterIds ?? [] }, status: "PENDING" as const };

  const pending = await prisma.voter.findMany({ where });
  let approved = 0;

  for (const voter of pending) {
    const plainCode = generateVoterCode();
    const codeHash = await hashCode(plainCode);
    await prisma.voter.update({
      where: { id: voter.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        codeHash,
        accessCodePlaintext: plainCode,
        codeRevealedAt: null,
      },
    });
    approved += 1;
  }

  if (approved > 0) {
    await prisma.auditLog.create({
      data: {
        actorType: "admin",
        action: "APPROVE_VOTERS",
        metadata: JSON.stringify({ count: approved }),
      },
    });
  }

  return NextResponse.json({ approved });
}
