import { NextRequest, NextResponse } from "next/server";
import { db, withWriteRetry } from "@/lib/db";
import { getVisibleQuestions } from "@/lib/questions";
import { isAdminAuthorized } from "@/lib/admin/auth";

// POST /api/responses — create or update a response.
// Accepts ANY subset of fields — used for two flows:
//   1. Lead capture: lawyer just typed their email; we create a row with
//      started=false so admin sees them land even if they never click Begin.
//   2. Begin interview: lawyer clicked Begin; we mark started=true.
// If a response already exists for this email, we PATCH it instead of
// creating a duplicate (idempotent upsert by email).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email as string | undefined)?.toLowerCase().trim();
    const { practiceArea, city, yearsOfPractice, barNumber, started } = body;

    // Email is the only required field for creating a lead row
    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // Find existing by email — if found, PATCH instead of duplicating.
    // This makes the endpoint idempotent: same email always returns same row.
    const existing = await db.response.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      const update: Record<string, unknown> = { updatedAt: new Date() };
      // Only update fields that were actually provided in the request body
      if (practiceArea !== undefined) update.practiceArea = practiceArea || null;
      if (city !== undefined) update.city = city || null;
      if (yearsOfPractice !== undefined) update.yearsOfPractice = yearsOfPractice || null;
      if (barNumber !== undefined) update.barNumber = barNumber || null;
      // started only goes true→true (we never downgrade a started response)
      if (started === true && !existing.started) update.started = true;

      const updated = await withWriteRetry(() =>
        db.response.update({ where: { id: existing.id }, data: update })
      );
      return NextResponse.json({ response: updated, resumed: true });
    }

    // Create new row (lead or started, depending on `started` flag)
    const response = await withWriteRetry(() =>
      db.response.create({
        data: {
          email,
          practiceArea: practiceArea || null,
          city: city || null,
          yearsOfPractice: yearsOfPractice || null,
          barNumber: barNumber || null,
          started: started === true,
        },
      })
    );

    return NextResponse.json({ response, resumed: false });
  } catch (err) {
    console.error("[POST /api/responses] error", err);
    return NextResponse.json(
      { error: "Failed to create response." },
      { status: 500 }
    );
  }
}

// Admin: list all responses (requires password)
export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-admin-password");
  if (!isAdminAuthorized(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const practiceArea = searchParams.get("practiceArea");
  const completed = searchParams.get("completed");
  const started = searchParams.get("started");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (practiceArea && practiceArea !== "all") where.practiceArea = practiceArea;
  if (completed === "true") where.completed = true;
  if (completed === "false") where.completed = false;
  if (started === "true") where.started = true;
  if (started === "false") where.started = false;

  const responses = await db.response.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Compute completion % for each response based on visible questions answered
  const enriched = responses.map((r) => {
    let answers: Record<string, string> = {};
    try {
      answers = JSON.parse(r.answers);
    } catch {
      answers = {};
    }
    const visible = getVisibleQuestions(answers);
    const answered = visible.filter(
      (q) => answers[q.id] && answers[q.id].trim().length > 0
    ).length;
    const completionPct =
      visible.length > 0 ? Math.round((answered / visible.length) * 100) : 0;

    if (search) {
      const haystack = Object.values(answers).join(" ").toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return null;
    }

    return {
      ...r,
      answers,
      completionPct,
      answeredCount: answered,
      totalQuestions: visible.length,
    };
  });

  return NextResponse.json({ responses: enriched.filter(Boolean) });
}
