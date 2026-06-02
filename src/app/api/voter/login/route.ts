import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyCode } from "@/lib/codes";
import { createVoterSession } from "@/lib/auth";

const schema = z.object({
  code: z.string().min(6).max(24),
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  }

  const voters = await prisma.voter.findMany();
  let matched: (typeof voters)[0] | null = null;
  for (const v of voters) {
    if (await verifyCode(body.data.code, v.codeHash)) {
      matched = v;
      break;
    }
  }

  if (!matched) {
    return NextResponse.json({ error: "Code not found." }, { status: 401 });
  }

  await createVoterSession(matched.id);

  return NextResponse.json({
    status: matched.status,
    fullName: matched.fullName,
  });
}
