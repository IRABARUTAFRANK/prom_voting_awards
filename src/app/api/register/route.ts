import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getSettings } from "@/lib/db";
import { generateVoterCode, hashCode } from "@/lib/codes";
import { normalizeEmail } from "@/lib/utils";

const schema = z.object({
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
    return NextResponse.json(
      { error: "This email is already registered. Contact admin if you lost your code." },
      { status: 409 },
    );
  }

  // Ensure the email exists in the imported roster (senior sixes only)
  const rosterPerson = await prisma.person.findUnique({ where: { email } });
  if (!rosterPerson) {
    return NextResponse.json(
      {
        error:
          "Email not on the Senior Six roster. Only students imported by admin can register.",
      },
      { status: 403 },
    );
  }

  const plainCode = generateVoterCode();
  const codeHash = await hashCode(plainCode);

  const voter = await prisma.voter.create({
    data: {
      fullName: rosterPerson.fullName,
      email,
      codeHash,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "voter",
      actorId: voter.id,
      action: "REGISTER",
      metadata: JSON.stringify({ email }),
    },
  });

  return NextResponse.json({
    voterId: voter.id,
    code: plainCode,
    message: "Save this code — it will not be shown again.",
  });
}
