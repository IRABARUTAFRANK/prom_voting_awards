/**
 * Import Senior Six class list from Excel into voters + roster.
 * Place the file at: ./s6 class list.xlsx
 * Run: npm run import:s6
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { importStudents, parseStudentExcel } from "../src/lib/student-import";
const prisma = new PrismaClient();

async function tuneSqlite() {
  await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL");
  await prisma.$queryRawUnsafe("PRAGMA busy_timeout = 10000");
}

const CANDIDATES = [
  "s6 class list.xlsx",
  "S6 class list.xlsx",
  "data/s6 class list.xlsx",
];

async function main() {
  const filePath = CANDIDATES.map((name) => resolve(process.cwd(), name)).find((p) =>
    existsSync(p),
  );

  if (!filePath) {
    console.error(
      "Excel file not found. Copy your file to the project root as:\n  s6 class list.xlsx",
    );
    process.exit(1);
  }

  await tuneSqlite();
  const buffer = readFileSync(filePath);
  const rows = parseStudentExcel(buffer);
  if (rows.length === 0) {
    console.error("No rows parsed. Check that the sheet has name and class columns.");
    process.exit(1);
  }

  console.log(`Parsing ${filePath} — ${rows.length} student row(s)…`);
  const result = await importStudents(prisma, rows);
  console.log(result);
  console.log(`Done. Classes: ${result.classes.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
