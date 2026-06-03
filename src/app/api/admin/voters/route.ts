import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const voters = await prisma.voter.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      accessCodePlaintext: true,
      codeRevealedAt: true,
      lastLoginAt: true,
      createdAt: true,
      approvedAt: true,
    },
  });

  return NextResponse.json({ voters });
}
