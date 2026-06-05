import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const classFilter = new URL(req.url).searchParams.get("class")?.trim();

  const voters = await prisma.voter.findMany({
    where: {
      removedAt: null,
      loginCode: { not: null },
      ...(classFilter ? { className: classFilter } : {}),
    },
    orderBy: [{ className: "asc" }, { rosterIndex: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      className: true,
      rosterIndex: true,
      loginCode: true,
      accessCodePlaintext: true,
      status: true,
    },
  });

  const byClass = new Map<string, typeof voters>();
  for (const v of voters) {
    const key = v.className ?? "Unassigned";
    const list = byClass.get(key) ?? [];
    list.push(v);
    byClass.set(key, list);
  }

  const classes = [...byClass.keys()].sort((a, b) => a.localeCompare(b));

  return NextResponse.json({
    classes,
    byClass: Object.fromEntries(
      classes.map((c) => [
        c,
        (byClass.get(c) ?? []).map((v) => ({
          fullName: v.fullName,
          rosterIndex: v.rosterIndex,
          code: v.loginCode ?? v.accessCodePlaintext,
          status: v.status,
        })),
      ]),
    ),
    students: voters.map((v) => ({
      fullName: v.fullName,
      className: v.className,
      code: v.loginCode ?? v.accessCodePlaintext,
      status: v.status,
    })),
  });
}
