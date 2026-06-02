import { NextResponse } from "next/server";
import { getVoterSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getVoterSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ people: [] });
  }

  const people = await prisma.person.findMany({
    where: {
      active: true,
      fullName: { contains: q },
    },
    take: 20,
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, email: true },
  });

  return NextResponse.json({ people });
}
