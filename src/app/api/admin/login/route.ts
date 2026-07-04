import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PASSWORD } from "@/lib/admin/auth";

// POST /api/admin/login — verify password
export async function POST(req: NextRequest) {
  const body = await req.json();
  const password = body.password;

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
