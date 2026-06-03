import { NextResponse } from "next/server";
import { getVoterSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncMatchingVotersToRoster } from "@/lib/person-roster";

export async function GET(req: Request) {
  const session = await getVoterSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ people: [] });
  }

  await syncMatchingVotersToRoster(prisma, q);

  const qLower = q.toLowerCase();
  const allActive = await prisma.person.findMany({
    where: { active: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, email: true },
  });

  const people = allActive
    .filter((p) => p.fullName.toLowerCase().includes(qLower))
    .slice(0, 20);

  return NextResponse.json({ people });
}
