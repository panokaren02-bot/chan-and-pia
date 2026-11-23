import { defaultWedding, mergeContent, type Wedding } from "./wedding";
import { appsScriptConfigured, scriptGet } from "./appsScript";

export const CONTENT_TAG = "wedding-content";

// Live content = defaults (lib/wedding.ts) overlaid with what the dashboard saved to the Google Sheet.
// Cached and refreshed every 5 minutes, or immediately when the dashboard saves (revalidateTag).
export async function getContent(opts: { fresh?: boolean } = {}): Promise<Wedding> {
  if (!appsScriptConfigured()) return defaultWedding;
  try {
    const res = await scriptGet(
      "content",
      opts.fresh ? { cache: "no-store" } : { next: { revalidate: 300, tags: [CONTENT_TAG] } }
    );
    if (!res.ok || !res.content) return defaultWedding;
    return mergeContent(defaultWedding, res.content);
  } catch (e) {
    console.error("Could not load content from Apps Script — using defaults.", e);
    return defaultWedding;
  }
}
