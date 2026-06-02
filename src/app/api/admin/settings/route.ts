import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  registrationOpen: z.boolean().optional(),
  nominationOpen: z.boolean().optional(),
  finalVoteOpen: z.boolean().optional(),
  minApprovedVoters: z.number().int().min(1).optional(),
  nominationGoogleFormUrl: z.string().nullable().optional(),
  finalVoteGoogleFormUrl: z.string().nullable().optional(),
  schoolEmailDomain: z.string().optional(),
});

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  const settings = await prisma.systemSettings.update({
    where: { id: 1 },
    data: body.data,
  });

  return NextResponse.json({ settings });
}
