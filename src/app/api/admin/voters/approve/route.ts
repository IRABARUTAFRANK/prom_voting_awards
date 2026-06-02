import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

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

  const where =
    body.data.approveAllPending
      ? { status: "PENDING" as const }
      : { id: { in: body.data.voterIds ?? [] }, status: "PENDING" as const };

  const result = await prisma.voter.updateMany({
    where,
    data: { status: "APPROVED", approvedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "admin",
      action: "APPROVE_VOTERS",
      metadata: JSON.stringify({ count: result.count }),
    },
  });

  return NextResponse.json({ approved: result.count });
}
