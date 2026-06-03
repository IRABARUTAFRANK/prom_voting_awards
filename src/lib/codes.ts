import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateVoterCode(length = 12): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i]! % CHARSET.length];
  }
  return code;
}

/** Canonical form stored for admin lookup and hashing. */
export function normalizeVoterCode(code: string) {
  return code.replace(/\s|-/g, "").toUpperCase();
}

export async function hashCode(code: string) {
  return bcrypt.hash(normalizeVoterCode(code), 10);
}

export async function verifyCode(code: string, hash: string) {
  return bcrypt.compare(normalizeVoterCode(code), hash);
}
