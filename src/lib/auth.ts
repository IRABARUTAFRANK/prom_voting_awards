import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const VOTER_COOKIE = "voter_session";
const ADMIN_COOKIE = "admin_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export type VoterSession = { voterId: string; type: "voter" };
export type AdminSession = { type: "admin" };

export async function createVoterSession(voterId: string) {
  const token = await new SignJWT({ voterId, type: "voter" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const jar = await cookies();
  jar.set(VOTER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function createAdminSession() {
  const token = await new SignJWT({ type: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(getSecret());

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function getVoterSession(): Promise<VoterSession | null> {
  const jar = await cookies();
  const token = jar.get(VOTER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== "voter" || typeof payload.voterId !== "string") return null;
    return { voterId: payload.voterId, type: "voter" };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== "admin") return null;
    return { type: "admin" };
  } catch {
    return null;
  }
}

export async function clearVoterSession() {
  const jar = await cookies();
  jar.delete(VOTER_COOKIE);
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  return expected.length > 0 && password === expected;
}
