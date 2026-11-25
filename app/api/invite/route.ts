import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { scriptPost } from "@/lib/appsScript";
import { CONTENT_TAG } from "@/lib/content";
import { WISHES_TAG } from "@/lib/wishes";
import { slugify } from "@/lib/wedding";

// Public, for the person on a personal link (?to=<slug>):
//   { to, answer: "approved" | "declined" }  accept or decline their role (a yes also adds them to the RSVP list)
//   { to, message }                          leave a message for the couple on their RSVP row (wishes wall)
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const to = slugify(String(b?.to ?? "").slice(0, 160));
  if (!to) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });

  if (typeof b?.message === "string") {
    const message = b.message.trim().slice(0, 500);
    if (message.length < 3) return NextResponse.json({ ok: false, error: "Please write a few words." }, { status: 400 });
    const res = await scriptPost("inviteMessage", { to, message });
    if (!res.ok) return NextResponse.json({ ok: false, error: "We couldn’t send your message. Please try again." }, { status: res.error === "Invite not found" ? 404 : 502 });
    revalidateTag(WISHES_TAG);
    return NextResponse.json({ ok: true });
  }

  const answer = b?.answer === "approved" ? "approved" : b?.answer === "declined" ? "declined" : "";
  if (!answer) return NextResponse.json({ ok: false, error: "Invalid response." }, { status: 400 });
  const res = await scriptPost("respond", { to, answer });
  if (!res.ok) return NextResponse.json({ ok: false, error: "Could not save your answer. Please try again." }, { status: res.error === "Invite not found" ? 404 : 502 });
  revalidateTag(CONTENT_TAG); // approved names appear in the Entourage right away
  revalidateTag(WISHES_TAG);  // a yes also added them to the RSVP list
  return NextResponse.json({ ok: true, status: answer, respondedAt: res.respondedAt });
}
