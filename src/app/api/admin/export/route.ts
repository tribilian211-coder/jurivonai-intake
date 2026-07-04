import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { QUESTIONS, getVisibleQuestions } from "@/lib/questions";
import { isAdminAuthorized } from "@/lib/admin/auth";

// GET /api/admin/export — returns CSV of all responses with one column per question
export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-admin-password");
  if (!isAdminAuthorized(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const responses = await db.response.findMany({
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "id",
    "email",
    "practiceArea",
    "city",
    "yearsOfPractice",
    "completed",
    "completionPct",
    "createdAt",
    "completedAt",
    ...QUESTIONS.map((q) => `${q.id}_${q.prompt.slice(0, 40).replace(/,/g, ";")}`),
  ];

  const rows = responses.map((r) => {
    let answers: Record<string, string> = {};
    try {
      answers = JSON.parse(r.answers);
    } catch {
      answers = {};
    }
    const visible = getVisibleQuestions(answers);
    const answered = visible.filter((q) => answers[q.id] && answers[q.id].trim().length > 0).length;
    const completionPct = visible.length > 0 ? Math.round((answered / visible.length) * 100) : 0;

    const csvSafe = (s: string | null | undefined) => {
      if (s == null) return "";
      return `"${String(s).replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, " ")}"`;
    };

    return [
      csvSafe(r.id),
      csvSafe(r.email),
      csvSafe(r.practiceArea),
      csvSafe(r.city),
      csvSafe(r.yearsOfPractice),
      r.completed ? "yes" : "no",
      `${completionPct}%`,
      csvSafe(r.createdAt.toISOString()),
      csvSafe(r.completedAt?.toISOString() || ""),
      ...QUESTIONS.map((q) => csvSafe(answers[q.id] || "")),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jurivon-lawyer-survey-${Date.now()}.csv"`,
    },
  });
}
