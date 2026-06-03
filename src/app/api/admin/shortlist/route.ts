import { NextResponse } from "next/server";
import { z } from "zod";
import { FinalistSource } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import {
  applyAutoShortlist,
  getNominationCounts,
  computeAutoShortlist,
} from "@/lib/shortlist";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const positionId = new URL(req.url).searchParams.get("positionId");
  const positions = await prisma.position.findMany({
    where: positionId ? { id: positionId } : { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      finalists: { include: { person: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  const tallies = await Promise.all(
    positions.map(async (p) => {
      const counts = await getNominationCounts(prisma, p.id);
      const preview = computeAutoShortlist(counts);
      return { positionId: p.id, counts, preview };
    }),
  );

  return NextResponse.json({ positions, tallies });
}

const autoSchema = z.object({
  positionId: z.string().optional(),
  all: z.boolean().optional(),
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = autoSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const positions = await prisma.position.findMany({
    where: body.data.positionId
      ? { id: body.data.positionId }
      : body.data.all
        ? { active: true }
        : { id: "__none__" },
  });

  const results = [];
  for (const p of positions) {
    results.push({ positionId: p.id, ...(await applyAutoShortlist(prisma, p.id)) });
  }

  return NextResponse.json({ results });
}

const addSchema = z.object({
  positionId: z.string(),
  personId: z.string(),
});

export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = addSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = await prisma.finalist.findUnique({
    where: {
      positionId_personId: {
        positionId: body.data.positionId,
        personId: body.data.personId,
      },
    },
  });

  const count = await prisma.finalist.count({
    where: { positionId: body.data.positionId },
  });

  if (!existing && count >= 4) {
    return NextResponse.json(
      { error: "This position already has 4 finalists. Remove one before adding another." },
      { status: 400 },
    );
  }

  const finalist = await prisma.finalist.upsert({
    where: {
      positionId_personId: {
        positionId: body.data.positionId,
        personId: body.data.personId,
      },
    },
    create: {
      positionId: body.data.positionId,
      personId: body.data.personId,
      source: FinalistSource.ADMIN,
      sortOrder: count,
    },
    update: { source: FinalistSource.ADMIN },
  });

  return NextResponse.json({ finalist });
}

const removeSchema = z.object({
  positionId: z.string(),
  personId: z.string(),
});

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = removeSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await prisma.finalist.delete({
    where: {
      positionId_personId: {
        positionId: body.data.positionId,
        personId: body.data.personId,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
