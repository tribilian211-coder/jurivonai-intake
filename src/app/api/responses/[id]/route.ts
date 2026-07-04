import { NextRequest, NextResponse } from "next/server";
import { db, withWriteRetry } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin/auth";

// PATCH /api/responses/[id] — save an answer, update top-level fields, or mark complete.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.response.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let answers: Record<string, string> = {};
    try {
      answers = JSON.parse(existing.answers);
    } catch {
      answers = {};
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };

    // Mode 1: mark complete
    if (body.completed === true) {
      update.completed = true;
      update.completedAt = new Date();
    }

    // Mode 2: update a single answer
    if (body.questionId) {
      answers[body.questionId] = body.answer ?? "";
      update.answers = JSON.stringify(answers);
      if (typeof body.currentSection === "number")
        update.currentSection = body.currentSection;
      if (typeof body.currentQuestion === "number")
        update.currentQuestion = body.currentQuestion;
    }

    // Mode 3: update top-level fields (lead info from Landing component)
    if (body.practiceArea !== undefined)
      update.practiceArea = body.practiceArea || null;
    if (body.city !== undefined) update.city = body.city || null;
    if (body.yearsOfPractice !== undefined)
      update.yearsOfPractice = body.yearsOfPractice || null;
    if (body.barNumber !== undefined) update.barNumber = body.barNumber || null;
    if (typeof body.started === "boolean" && body.started && !existing.started)
      update.started = true;

    const updated = await withWriteRetry(() =>
      db.response.update({ where: { id }, data: update })
    );

    return NextResponse.json({ response: updated });
  } catch (err) {
    console.error("[PATCH /api/responses/[id]] error", err);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}

// GET single response (admin)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get("x-admin-password");
  if (!isAdminAuthorized(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const response = await db.response.findUnique({ where: { id } });
  if (!response) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let answers: Record<string, string> = {};
  try {
    answers = JSON.parse(response.answers);
  } catch {
    answers = {};
  }

  return NextResponse.json({ response: { ...response, answers } });
}
