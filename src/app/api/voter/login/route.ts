import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyCode } from "@/lib/codes";
import { createVoterSession } from "@/lib/auth";
import { NO_STORE_HEADERS } from "@/lib/api-headers";

const schema = z.object({
  code: z.string().min(6).max(24),
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const voters = await prisma.voter.findMany({
    where: { codeHash: { not: null } },
  });
  let matched: (typeof voters)[0] | null = null;
  for (const v of voters) {
    if (v.codeHash && (await verifyCode(body.data.code, v.codeHash))) {
      matched = v;
      break;
    }
  }

  if (!matched) {
    return NextResponse.json({ error: "Code not found." }, { status: 401, headers: NO_STORE_HEADERS });
  }

  if (matched.status === "PENDING") {
    return NextResponse.json(
      {
        error:
          "Your registration is still pending admin approval. Check the voter portal after you are approved.",
      },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  await createVoterSession(matched.id);

  return NextResponse.json(
    {
      status: matched.status,
      fullName: matched.fullName,
    },
    { headers: NO_STORE_HEADERS },
  );
}
