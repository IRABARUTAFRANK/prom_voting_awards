import { NextResponse } from "next/server";
import { clearVoterSession } from "@/lib/auth";
import { NO_STORE_HEADERS } from "@/lib/api-headers";

export async function POST() {
  await clearVoterSession();
  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
