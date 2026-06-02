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

export async function hashCode(code: string) {
  return bcrypt.hash(code.replace(/\s|-/g, "").toUpperCase(), 10);
}

export async function verifyCode(code: string, hash: string) {
  return bcrypt.compare(code.replace(/\s|-/g, "").toUpperCase(), hash);
}
