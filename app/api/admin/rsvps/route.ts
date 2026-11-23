import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { scriptPost } from "@/lib/appsScript";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "Please log in again." }, { status: 401 });
  const res = await scriptPost("rsvps");
  return NextResponse.json(res, { status: res.ok ? 200 : 502 });
}
