import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function formatCodeForDisplay(code: string) {
  const c = code.replace(/\s|-/g, "");
  if (c.length <= 6) return c;
  return c.match(/.{1,4}/g)?.join("-") ?? code;
}
