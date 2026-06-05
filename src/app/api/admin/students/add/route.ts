import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { addStudentManual } from "@/lib/student-import";

const schema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  className: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return guard.error;

    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid student details." }, { status: 400 });
    }

    const student = await addStudentManual(prisma, body.data);

    await prisma.auditLog.create({
      data: {
        actorType: "admin",
        action: "ADD_STUDENT",
        metadata: JSON.stringify(student),
      },
    });

    return NextResponse.json({
      student,
      message: `${student.fullName} added with code ${student.loginCode}.`,
    });
  } catch (err) {
    console.error("[students/add]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not add student." },
      { status: 500 },
    );
  }
}
