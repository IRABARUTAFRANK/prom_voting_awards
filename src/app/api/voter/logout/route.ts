import { NextResponse } from "next/server";
import { clearVoterSession } from "@/lib/auth";

export async function POST() {
  await clearVoterSession();
  return NextResponse.json({ ok: true });
}
