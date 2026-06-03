import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getSettings } from "@/lib/db";
import { ensurePersonForVoter } from "@/lib/person-roster";
import { normalizeEmail } from "@/lib/utils";

const schema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
});

export async function POST(req: Request) {
  const settings = await getSettings();
  if (!settings.registrationOpen) {
    return NextResponse.json({ error: "Registration is closed." }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid name or email." }, { status: 400 });
  }

  const fullName = body.data.fullName.trim();
  const email = normalizeEmail(body.data.email);
  const domain =
    settings.schoolEmailDomain ||
    process.env.SCHOOL_EMAIL_DOMAIN ||
    "";
  if (domain && !email.endsWith(`@${domain}`) && !email.endsWith(domain)) {
    return NextResponse.json(
      { error: `Use your school email (@${domain.replace(/^@/, "")}).` },
      { status: 400 },
    );
  }

  const existing = await prisma.voter.findUnique({ where: { email } });
  if (existing) {
    if (existing.removedAt) {
      return NextResponse.json(
        { error: existing.removalReason ?? "This account was removed by an admin." },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: "This email is already registered. Check the voter portal for your status." },
      { status: 409 },
    );
  }

  const voter = await prisma.voter.create({
    data: {
      fullName,
      email,
    },
  });

  await ensurePersonForVoter(prisma, { fullName, email });

  await prisma.auditLog.create({
    data: {
      actorType: "voter",
      actorId: voter.id,
      action: "REGISTER",
      metadata: JSON.stringify({ email, fullName }),
    },
  });

  return NextResponse.json({
    voterId: voter.id,
    fullName: voter.fullName,
    message:
      "Registration submitted. An admin will verify you are Senior Six. Check the voter portal after approval to get your access code.",
  });
}
