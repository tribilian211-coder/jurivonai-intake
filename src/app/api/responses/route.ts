import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVisibleQuestions } from "@/lib/questions";
import { isAdminAuthorized } from "@/lib/admin/auth";

// POST /api/responses — create a new response (start survey)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, practiceArea, city, yearsOfPractice, barNumber } = body;

    if (!email || !practiceArea) {
      return NextResponse.json(
        { error: "Email and practice area are required." },
        { status: 400 }
      );
    }

    // Check if a response already exists for this email — if so, resume it
    const existing = await db.response.findFirst({
      where: { email: email.toLowerCase().trim() },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return NextResponse.json({ response: existing, resumed: true });
    }

    const response = await db.response.create({
      data: {
        email: email.toLowerCase().trim(),
        practiceArea,
        city: city || null,
        yearsOfPractice: yearsOfPractice || null,
        barNumber: barNumber || null,
      },
    });

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
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (practiceArea && practiceArea !== "all") where.practiceArea = practiceArea;
  if (completed === "true") where.completed = true;
  if (completed === "false") where.completed = false;

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
    const answered = visible.filter((q) => answers[q.id] && answers[q.id].trim().length > 0).length;
    const completionPct = visible.length > 0 ? Math.round((answered / visible.length) * 100) : 0;

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
