import { unstable_cache } from "next/cache";
import { appsScriptConfigured, scriptPost } from "./appsScript";
import { getContent } from "./content";

export const WISHES_TAG = "wishes";
export type Wish = { id: string; name: string; message: string };

type Row = { submittedAt: string; name: string; message: string; attending?: string; guests?: number };

// RSVP rows are read with the admin secret on the server; only first name + initial and the message leave it.
export const loadRows = unstable_cache(
  async (): Promise<Row[]> => {
    const res = await scriptPost("rsvps");
    return res.ok && Array.isArray(res.rows) ? (res.rows as Row[]) : [];
  },
  ["rsvp-rows"],
  { revalidate: 60, tags: [WISHES_TAG] }
);

const shortName = (full: string) => {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A guest";
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
};

export async function getWishes(): Promise<Wish[]> {
  if (!appsScriptConfigured()) return [];
  const content = await getContent();
  if (content.rsvp.showWishes === false) return [];
  const hidden = new Set(content.rsvp.hiddenWishes ?? []);
  try {
    const rows = await loadRows();
    return rows
      .filter((r) => String(r.message || "").trim() && !hidden.has(String(r.submittedAt)))
      .reverse()
      .slice(0, 80)
      .map((r) => ({ id: String(r.submittedAt), name: shortName(r.name), message: String(r.message).trim().slice(0, 500) }));
  } catch (e) {
    console.error("Could not load wishes", e);
    return [];
  }
}
