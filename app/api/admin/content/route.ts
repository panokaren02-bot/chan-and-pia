import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { scriptPost } from "@/lib/appsScript";
import { CONTENT_TAG } from "@/lib/content";

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "Please log in again." }, { status: 401 });
  const { content } = await req.json().catch(() => ({ content: null }));
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return NextResponse.json({ ok: false, error: "Invalid content." }, { status: 400 });
  }
  const res = await scriptPost("saveContent", { content });
  if (!res.ok) return NextResponse.json(res, { status: 502 });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
