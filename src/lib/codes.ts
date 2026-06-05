import bcrypt from "bcryptjs";
import { randomBytes, randomInt } from "crypto";
import type { PrismaClient } from "@prisma/client";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateVoterCode(length = 12): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i]! % CHARSET.length];
  }
  return code;
}

/** First two letters of the student's first name (e.g. Lyna → LY). */
export function namePrefixForCode(firstNameOrFullName: string): string {
  const first = firstNameOrFullName.trim().split(/\s+/)[0] ?? firstNameOrFullName;
  const letters = first.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (letters.length >= 2) return letters.slice(0, 2);
  if (letters.length === 1) return `${letters}X`;
  return "XX";
}

/** Official code: two letters of first name + roster index (e.g. LY01, RA20). */
export function buildRosterCode(firstName: string, rosterIndex: number): string {
  return `${namePrefixForCode(firstName)}${String(rosterIndex).padStart(2, "0")}`;
}

export async function nextRosterIndex(prisma: PrismaClient): Promise<number> {
  const max = await prisma.voter.aggregate({
    _max: { rosterIndex: true },
    where: { rosterIndex: { not: null } },
  });
  return (max._max.rosterIndex ?? 0) + 1;
}

/** Fallback when no roster index (legacy / manual). */
export function generateSimpleStudentCode(fullName: string): string {
  const prefix = namePrefixForCode(fullName);
  const digits = String(randomInt(0, 100)).padStart(2, "0");
  return `${prefix}${digits}`;
}

export async function generateUniqueSimpleCode(
  prisma: PrismaClient,
  fullName: string,
  firstName?: string,
): Promise<string> {
  const idx = await nextRosterIndex(prisma);
  const code = buildRosterCode(firstName ?? fullName, idx);
  const taken = await prisma.voter.findUnique({ where: { loginCode: code }, select: { id: true } });
  if (!taken) return code;
  return `${namePrefixForCode(firstName ?? fullName)}${String(idx).padStart(3, "0")}`.slice(0, 8);
}

/** Canonical form stored for admin lookup and hashing. */
export function normalizeVoterCode(code: string) {
  return code.replace(/\s|-/g, "").toUpperCase();
}

const BCRYPT_ROUNDS =
  process.env.BCRYPT_ROUNDS != null ? Number(process.env.BCRYPT_ROUNDS) : 8;

export async function hashCode(code: string) {
  return bcrypt.hash(normalizeVoterCode(code), BCRYPT_ROUNDS);
}

export async function verifyCode(code: string, hash: string) {
  return bcrypt.compare(normalizeVoterCode(code), hash);
}
