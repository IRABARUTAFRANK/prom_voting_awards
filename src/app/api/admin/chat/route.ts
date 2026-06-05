import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const messages = await prisma.adminMessage.findMany({
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, author: true, body: true, createdAt: true },
  });

  return NextResponse.json({ messages });
}

const postSchema = z.object({
  body: z.string().min(1).max(2000),
  author: z.string().min(1).max(60).optional(),
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = postSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Message required." }, { status: 400 });
  }

  const message = await prisma.adminMessage.create({
    data: {
      body: body.data.body.trim(),
      author: body.data.author?.trim() || "Admin",
    },
    select: { id: true, author: true, body: true, createdAt: true },
  });

  return NextResponse.json({ message });
}
