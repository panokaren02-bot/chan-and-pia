import { defaultWedding, mergeContent, type Wedding } from "./wedding";
import { appsScriptConfigured, scriptGet } from "./appsScript";
import { normalizeInvites } from "./entourage";

export const CONTENT_TAG = "wedding-content";

/** Where the invite names came from: the sheet, no "Invites" tab yet, or an Apps Script deployment too old to send them. */
export type InvitesSource = "sheet" | "no-tab" | "old-script" | "offline";
export type LoadedContent = Wedding & { invitesSource?: InvitesSource };

// Live content = defaults (lib/wedding.ts) overlaid with what the dashboard saved to the Google Sheet.
// Personal invites (and so the Entourage) come only from the sheet's "Invites" tab; it can be edited by hand there.
// Cached and refreshed every 5 minutes, or immediately when the dashboard saves (revalidateTag).
export async function getContent(opts: { fresh?: boolean } = {}): Promise<LoadedContent> {
  if (!appsScriptConfigured()) return { ...defaultWedding, invitesSource: "offline" };
  try {
    const res = await scriptGet(
      "content",
      opts.fresh ? { cache: "no-store" } : { next: { revalidate: 300, tags: [CONTENT_TAG] } }
    );
    if (!res.ok) return defaultWedding;
    const content = res.content ? mergeContent(defaultWedding, res.content) : { ...defaultWedding };
    content.invites = normalizeInvites(res.invites); // [] until the Invites tab exists
    // the current Code.gs always sends `invites` (null when the tab is missing); older deployments don't send it
    const invitesSource: InvitesSource = Array.isArray(res.invites) ? "sheet" : res.invites === null ? "no-tab" : "old-script";
    if (invitesSource !== "sheet") console.warn(`Invite names not loaded from Google: ${invitesSource === "no-tab" ? "the sheet has no \"Invites\" tab — run setup() in Apps Script" : "the deployed Apps Script is an older version — redeploy google-apps-script/Code.gs as a New version"}.`);
    return { ...content, invitesSource };
  } catch (e) {
    console.error("Could not load content from Apps Script — using defaults.", e);
    return defaultWedding;
  }
}
