import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { scriptPost } from "@/lib/appsScript";
import { CONTENT_TAG } from "@/lib/content";
import { normalizeInvites } from "@/lib/entourage";

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "Please log in again." }, { status: 401 });
  const { content } = await req.json().catch(() => ({ content: null }));
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return NextResponse.json({ ok: false, error: "Invalid content." }, { status: 400 });
  }
  const invites = normalizeInvites(content.invites);
  delete content.invites; // names live only in the sheet's "Invites" tab
  // slugs the dashboard loaded: rows added in the sheet since then are kept, not wiped
  const loaded = Array.isArray(content._loadedInvites) ? content._loadedInvites.map((s: unknown) => String(s).slice(0, 160)) : null;
  delete content._loadedInvites;

  const inv = await scriptPost("saveInvites", { invites, loaded });
  if (!inv.ok) {
    const old = /unknown action/i.test(String(inv.error));
    return NextResponse.json({ ok: false, error: old ? "Your Google Apps Script is an older version. Paste the new google-apps-script/Code.gs and redeploy it (New version), then save again." : inv.error || "Could not save invites." }, { status: 502 });
  }

  const res = await scriptPost("saveContent", { content });
  if (!res.ok) return NextResponse.json(res, { status: 502 });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
  return NextResponse.json({
    ok: true, savedAt: new Date().toISOString(),
    // the sheet's merged list: includes replies that came in while the dashboard was open
    invites: inv.ok && Array.isArray(inv.invites) ? normalizeInvites(inv.invites) : invites,
  });
}
