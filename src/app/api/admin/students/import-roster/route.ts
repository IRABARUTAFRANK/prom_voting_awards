import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma, tuneSqliteForConcurrency } from "@/lib/db";
import { rosterToImportRows } from "@/data/s6-roster";
import { importStudents } from "@/lib/student-import";

export const maxDuration = 120;

export async function POST() {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return guard.error;

    await tuneSqliteForConcurrency();

    const rows = rosterToImportRows();
    const result = await importStudents(prisma, rows, { replaceExisting: true });

    await prisma.auditLog.create({
      data: {
        actorType: "admin",
        action: "IMPORT_OFFICIAL_ROSTER",
        metadata: JSON.stringify({ ...result, count: rows.length, replace: true }),
      },
    });

    return NextResponse.json({
      ...result,
      total: rows.length,
      message: `Roster replaced: ${result.imported} students loaded with updated names and codes.`,
    });
  } catch (err) {
    console.error("[import-roster]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Import failed. Stop the dev server and run: npm run import:roster",
      },
      { status: 500 },
    );
  }
}
