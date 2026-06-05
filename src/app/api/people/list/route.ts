import { NextResponse } from "next/server";
import { getVoterSession } from "@/lib/auth";
import { prisma, tuneSqliteForConcurrency } from "@/lib/db";
import { NO_STORE_HEADERS } from "@/lib/api-headers";

export async function GET() {
  const session = await getVoterSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  await tuneSqliteForConcurrency();

  const people = await prisma.person.findMany({
    where: { active: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, email: true, className: true },
  });

  return NextResponse.json(
    { people },
    {
      headers: {
        ...NO_STORE_HEADERS,
        "Cache-Control": "private, max-age=120",
      },
    },
  );
}
