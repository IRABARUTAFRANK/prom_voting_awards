import type { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import {
  buildRosterCode,
  hashCode,
  nextRosterIndex,
  normalizeVoterCode,
} from "@/lib/codes";
import { normalizeEmail } from "@/lib/utils";

export type StudentRow = {
  fullName: string;
  className: string;
  firstName?: string;
  rosterIndex?: number;
};

function cellString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

/** Parse Excel buffer; expects name + class columns (flexible headers). */
export function parseStudentExcel(buffer: Buffer): StudentRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const rows: StudentRow[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });
    if (data.length === 0) continue;

    const keys = Object.keys(data[0] ?? {});
    const nameKey =
      keys.find((k) => /name/i.test(k) && !/class/i.test(k)) ??
      keys.find((k) => /student/i.test(k)) ??
      keys[0];
    const classKey =
      keys.find((k) => /class/i.test(k)) ??
      keys.find((k) => /form|stream|section/i.test(k)) ??
      keys[1];
    const indexKey = keys.find((k) => /^(no|#|index|id)$/i.test(k));

    if (!nameKey) continue;

    for (const row of data) {
      const fullName = cellString(row[nameKey]);
      if (!fullName || /^name$/i.test(fullName)) continue;
      const className =
        cellString(classKey ? row[classKey] : "") || sheetName.trim() || "S6";
      const idxRaw = indexKey ? Number(row[indexKey]) : NaN;
      const rosterIndex = Number.isFinite(idxRaw) && idxRaw > 0 ? idxRaw : undefined;
      const firstName = fullName.trim().split(/\s+/)[0];
      rows.push({ fullName, className, firstName, rosterIndex });
    }
  }

  return rows;
}

function syntheticEmail(loginCode: string) {
  return `${loginCode.toLowerCase()}@student.vote.local`;
}

export type ImportStudentsResult = {
  imported: number;
  updated: number;
  skipped: number;
  classes: string[];
};

/** Remove all voters and nomination roster (keeps positions, settings, admin). */
export async function clearVoterAndRosterData(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.finalVote.deleteMany(),
    prisma.nomination.deleteMany(),
    prisma.finalist.deleteMany(),
    prisma.voter.deleteMany(),
    prisma.person.deleteMany(),
  ]);
}

async function upsertStudent(prisma: PrismaClient, row: StudentRow) {
  const fullName = row.fullName.trim();
  const className = row.className.trim() || "S6";
  const firstName = row.firstName ?? fullName.split(/\s+/)[0] ?? fullName;
  let rosterIndex = row.rosterIndex ?? null;

  if (!fullName) return "skipped" as const;

  if (rosterIndex == null) {
    rosterIndex = await nextRosterIndex(prisma);
  }

  const normalized = normalizeVoterCode(buildRosterCode(firstName, rosterIndex));

  const codeHash = await hashCode(normalized);

  const existingByIndex =
    rosterIndex != null
      ? await prisma.voter.findUnique({ where: { rosterIndex } })
      : null;

  const existingVoter =
    existingByIndex ??
    (await prisma.voter.findFirst({
      where: { fullName, className, removedAt: null },
    }));

  const email = existingVoter?.email ?? syntheticEmail(normalized);

  const voter = existingVoter
    ? await prisma.voter.update({
        where: { id: existingVoter.id },
        data: {
          fullName,
          className,
          rosterIndex: rosterIndex ?? existingVoter.rosterIndex,
          loginCode: normalized,
          accessCodePlaintext: normalized,
          codeHash,
          status: "APPROVED",
          approvedAt: existingVoter.approvedAt ?? new Date(),
        },
      })
    : await prisma.voter.create({
        data: {
          fullName,
          className,
          rosterIndex,
          email,
          loginCode: normalized,
          accessCodePlaintext: normalized,
          codeHash,
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });

  const personEmail = normalizeEmail(voter.email);
  await prisma.person.upsert({
    where: { email: personEmail },
    create: { fullName, className, email: personEmail, active: true },
    update: { fullName, className, active: true },
  });

  return existingVoter ? ("updated" as const) : ("imported" as const);
}

/** Import students as approved voters + roster persons with index-based login codes. */
export async function importStudents(
  prisma: PrismaClient,
  rows: StudentRow[],
  options?: { replaceExisting?: boolean },
): Promise<ImportStudentsResult> {
  if (options?.replaceExisting) {
    await clearVoterAndRosterData(prisma);
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const classes = new Set<string>();

  for (const row of rows) {
    if (!row.fullName?.trim()) {
      skipped += 1;
      continue;
    }
    classes.add(row.className.trim() || "S6");
    const result = await upsertStudent(prisma, row);
    if (result === "skipped") skipped += 1;
    else if (result === "updated") updated += 1;
    else imported += 1;
  }

  return {
    imported,
    updated,
    skipped,
    classes: [...classes].sort((a, b) => a.localeCompare(b)),
  };
}

/** Add one student manually (admin); assigns next roster index + code. */
export async function addStudentManual(
  prisma: PrismaClient,
  input: { firstName: string; lastName: string; className: string },
) {
  const rosterIndex = await nextRosterIndex(prisma);
  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`;
  const row: StudentRow = {
    fullName,
    firstName: input.firstName.trim(),
    className: input.className.trim() || "S6",
    rosterIndex,
  };
  await upsertStudent(prisma, row);
  const code = normalizeVoterCode(buildRosterCode(row.firstName!, rosterIndex));
  return { fullName, className: row.className, rosterIndex, loginCode: code };
}
