/**
 * Load official 136-student S6 roster into the database.
 * Run: npm run import:roster
 */
import { PrismaClient } from "@prisma/client";
import { rosterToImportRows } from "../src/data/s6-roster";
import { importStudents } from "../src/lib/student-import";

const prisma = new PrismaClient();

async function main() {
  await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL");
  const rows = rosterToImportRows();
  console.log(`Importing ${rows.length} students…`);
  const result = await importStudents(prisma, rows, { replaceExisting: true });
  console.log(result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
