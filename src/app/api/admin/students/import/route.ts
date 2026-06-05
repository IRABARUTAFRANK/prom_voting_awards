import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma, tuneSqliteForConcurrency } from "@/lib/db";
import { importStudents, parseStudentExcel } from "@/lib/student-import";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return guard.error;

    await tuneSqliteForConcurrency();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload an Excel file (.xlsx)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = parseStudentExcel(buffer);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No students found. Use columns for name and class." },
      { status: 400 },
    );
  }

  const result = await importStudents(prisma, rows);

  await prisma.auditLog.create({
    data: {
      actorType: "admin",
      action: "IMPORT_STUDENTS",
      metadata: JSON.stringify(result),
    },
  });

    return NextResponse.json({
      ...result,
      total: rows.length,
      message: `Imported ${result.imported}, updated ${result.updated}, skipped ${result.skipped}.`,
    });
  } catch (err) {
    console.error("[students/import]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed." },
      { status: 500 },
    );
  }
}
