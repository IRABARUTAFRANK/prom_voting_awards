import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { normalizeEmail } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const email = normalizeEmail(body.data.email);
  const voter = await prisma.voter.findUnique({ where: { email } });

  if (!voter) {
    return NextResponse.json(
      { error: "No registration found for this email. Register first." },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  if (voter.removedAt) {
    return NextResponse.json(
      {
        status: "REMOVED",
        error: voter.removalReason ?? "Your account was removed by an admin.",
      },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  if (voter.status === "PENDING") {
    return NextResponse.json(
      {
        status: "PENDING",
        fullName: voter.fullName,
        message:
          "Your registration is waiting for admin approval. An admin will verify you are Senior Six before you receive a voter code.",
      },
      { headers: NO_STORE_HEADERS },
    );
  }

  if (voter.accessCodePlaintext && !voter.codeRevealedAt) {
    const code = voter.accessCodePlaintext;
    await prisma.voter.update({
      where: { id: voter.id },
      data: { codeRevealedAt: new Date() },
    });
    return NextResponse.json(
      {
        status: "APPROVED",
        fullName: voter.fullName,
        code,
        message: "Save this code — it is shown only once. Use it at voter login.",
      },
      { headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(
    {
      status: "APPROVED",
      fullName: voter.fullName,
      codeAlreadyRevealed: true,
      message:
        "You are approved. Use the voter code you saved earlier at login. Contact admin if you lost it.",
    },
    { headers: NO_STORE_HEADERS },
  );
}
