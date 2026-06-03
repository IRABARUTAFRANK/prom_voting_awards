import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/utils";

export async function GET(req: Request) {
  const email = normalizeEmail(
    new URL(req.url).searchParams.get("email")?.trim() ?? "",
  );
  if (!email || !email.includes("@")) {
    return NextResponse.json({ found: false });
  }

  const person = await prisma.person.findUnique({
    where: { email },
    select: { fullName: true, active: true },
  });

  if (!person || !person.active) {
    return NextResponse.json({
      found: false,
      error: "Email not on the Senior Six roster. Contact admin.",
    });
  }

  return NextResponse.json({ found: true, fullName: person.fullName });
}
