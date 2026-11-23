import { NextResponse } from "next/server";
import { checkPassword, passwordConfigured, SESSION_COOKIE, sessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  if (!passwordConfigured()) return NextResponse.json({ ok: false, error: "DASHBOARD_PASSWORD is not set on the server." }, { status: 503 });
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!checkPassword(String(password ?? ""))) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return NextResponse.json({ ok: false, error: "Wrong password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken()!, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
