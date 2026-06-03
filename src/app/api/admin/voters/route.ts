import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
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
  } catch (err) {
    console.error("[admin/voters]", err);
    return NextResponse.json(
      { error: "Failed to load voters. Run database migrations (npx prisma migrate deploy)." },
      { status: 500 },
    );
  }
}
