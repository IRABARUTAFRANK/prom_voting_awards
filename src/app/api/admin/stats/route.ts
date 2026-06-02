import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma, getSettings } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const settings = await getSettings();
  const [pending, approved, nominationDone, finalVoted, positions] = await Promise.all([
    prisma.voter.count({ where: { status: "PENDING" } }),
    prisma.voter.count({ where: { status: "APPROVED" } }),
    prisma.voter.count({ where: { status: "NOMINATION_SUBMITTED" } }),
    prisma.voter.count({ where: { status: "FINAL_VOTED" } }),
    prisma.position.count({ where: { active: true } }),
  ]);

  return NextResponse.json({
    settings,
    counts: {
      pending,
      approved,
      nominationDone,
      finalVoted,
      approvedTotal: approved + nominationDone + finalVoted,
      positions,
    },
  });
}
