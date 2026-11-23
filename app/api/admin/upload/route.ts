import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { scriptPost } from "@/lib/appsScript";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a"];
const MAX_BYTES = 4 * 1024 * 1024; // keep under hosting request limits (Vercel: 4.5 MB)

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "Please log in again." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const { name, mimeType, data } = (body ?? {}) as { name?: string; mimeType?: string; data?: string };
  if (!name || !mimeType || !data) return NextResponse.json({ ok: false, error: "Missing file." }, { status: 400 });
  if (!ALLOWED.includes(mimeType)) return NextResponse.json({ ok: false, error: `File type ${mimeType} is not allowed.` }, { status: 400 });
  if ((data.length * 3) / 4 > MAX_BYTES) return NextResponse.json({ ok: false, error: "File is larger than 4 MB." }, { status: 413 });

  const res = await scriptPost("upload", { name: name.slice(0, 120), mimeType, data });
  if (!res.ok || typeof res.id !== "string") return NextResponse.json({ ok: false, error: res.error ?? "Upload failed." }, { status: 502 });
  return NextResponse.json({ ok: true, id: res.id, url: `/api/photo/${res.id}` });
}
