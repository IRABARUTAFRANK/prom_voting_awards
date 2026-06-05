import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, tuneSqliteForConcurrency } from "@/lib/db";
import { normalizeVoterCode, verifyCode } from "@/lib/codes";
import { createVoterSession } from "@/lib/auth";
import { NO_STORE_HEADERS } from "@/lib/api-headers";

const schema = z.object({
  code: z.string().min(4).max(24),
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  await tuneSqliteForConcurrency();

  const normalizedCode = normalizeVoterCode(body.data.code);

  let matched = await prisma.voter.findFirst({
    where: {
      removedAt: null,
      OR: [{ loginCode: normalizedCode }, { accessCodePlaintext: normalizedCode }],
    },
  });

  if (!matched) {
    const withHash = await prisma.voter.findMany({
      where: { codeHash: { not: null }, removedAt: null },
      take: 500,
    });
    for (const v of withHash) {
      if (v.codeHash && (await verifyCode(body.data.code, v.codeHash))) {
        matched = v;
        break;
      }
    }
  }

  if (!matched) {
    return NextResponse.json({ error: "Code not found." }, { status: 401, headers: NO_STORE_HEADERS });
  }

  if (matched.removedAt) {
    return NextResponse.json(
      { error: matched.removalReason ?? "Your account was removed by an admin." },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  if (matched.status === "PENDING") {
    return NextResponse.json(
      {
        error:
          "Your account is not active yet. Ask the admin for your voter code.",
      },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }
  await prisma.voter.update({
    where: { id: matched.id },
    data: {
      accessCodePlaintext: matched.accessCodePlaintext ?? normalizedCode,
      lastLoginAt: new Date(),
    },
  });

  await createVoterSession(matched.id);

  return NextResponse.json(
    {
      status: matched.status,
      fullName: matched.fullName,
    },
    { headers: NO_STORE_HEADERS },
  );
}
