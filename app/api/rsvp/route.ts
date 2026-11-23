import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { scriptPost } from "@/lib/appsScript";
import { WISHES_TAG } from "@/lib/wishes";

// Public RSVP endpoint — forwards to the Apps Script so its URL stays private.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return NextResponse.json({ ok: false, error: "Invalid RSVP." }, { status: 400 });
  const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);
  const name = clip(b.name, 120).trim();
  const attending = b.attending === "yes" ? "yes" : b.attending === "no" ? "no" : "";
  if (!name || !attending) return NextResponse.json({ ok: false, error: "Name and attendance are required." }, { status: 400 });
  if (clip(b.message, 1000).trim().length < 3) return NextResponse.json({ ok: false, error: "Please leave a message for the couple." }, { status: 400 });
  const res = await scriptPost("rsvp", {
    name, attending,
    guests: attending === "yes" ? Math.max(1, Math.min(10, Number(b.guests) || 1)) : 0,
    message: clip(b.message, 1000),
    guestLink: clip(b.guestLink, 80),
    submittedAt: new Date().toISOString(),
  });
  if (res.ok) revalidateTag(WISHES_TAG); // new message shows on the wishes wall right away
  return NextResponse.json({ ok: res.ok, error: res.ok ? undefined : "Could not save your RSVP." }, { status: res.ok ? 200 : 502 });
}
