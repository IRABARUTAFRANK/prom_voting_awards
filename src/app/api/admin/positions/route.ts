import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const positions = await prisma.position.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ positions });
}

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = createSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid position data" }, { status: 400 });
  }

  const maxOrder = await prisma.position.aggregate({ _max: { sortOrder: true } });
  const position = await prisma.position.create({
    data: {
      ...body.data,
      sortOrder: body.data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json({ position });
}

const patchSchema = z.object({
  id: z.string(),
  title: z.string().min(2).optional(),
  description: z.string().min(2).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { id, ...data } = body.data;
  const position = await prisma.position.update({ where: { id }, data });
  return NextResponse.json({ position });
}
