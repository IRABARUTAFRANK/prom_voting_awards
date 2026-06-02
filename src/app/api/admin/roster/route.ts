import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/utils";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const people = await prisma.person.findMany({
    orderBy: { fullName: "asc" },
    take: 500,
  });
  return NextResponse.json({ people });
}

const addSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional().nullable(),
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = addSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const email = body.data.email ? normalizeEmail(body.data.email) : null;
  const person = await prisma.person.create({
    data: {
      fullName: body.data.fullName.trim(),
      email,
    },
  });

  return NextResponse.json({ person });
}

const importSchema = z.object({
  rows: z.array(
    z.object({
      fullName: z.string().min(2),
      email: z.string().email().optional(),
    }),
  ),
});

export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = importSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid import" }, { status: 400 });
  }

  let imported = 0;
  for (const row of body.data.rows) {
    const email = row.email ? normalizeEmail(row.email) : null;
    if (email) {
      await prisma.person.upsert({
        where: { email },
        create: { fullName: row.fullName.trim(), email },
        update: { fullName: row.fullName.trim(), active: true },
      });
    } else {
      await prisma.person.create({
        data: { fullName: row.fullName.trim() },
      });
    }
    imported++;
  }

  return NextResponse.json({ imported });
}
