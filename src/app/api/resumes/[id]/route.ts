import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/resumes/[id] — load an in-progress response by ID (for localStorage resume)
// No auth required — anyone with the cuid can resume (cuids are unguessable).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
