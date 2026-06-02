import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession, verifyAdminPassword } from "@/lib/auth";

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!verifyAdminPassword(body.data.password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  await createAdminSession();
  return NextResponse.json({ ok: true });
}
