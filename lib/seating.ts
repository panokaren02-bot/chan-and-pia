import { appsScriptConfigured } from "./appsScript";
import { getContent } from "./content";
import { slugify } from "./wedding";
import { loadRows } from "./wishes";

export type TableMatch = { name: string; table: string; guests: number };

const words = (s: string) => slugify(s).split("-").filter(Boolean);

/**
 * Public table lookup for /table. Only attending guests are searched, every word typed must start one of the
 * name's words, and at most 6 matches come back (name, table, party size): enough to find yourself, not a guest list.
 */
export async function findTables(query: string): Promise<TableMatch[]> {
  const q = words(query.slice(0, 80));
  if (!q.length || q.join("").length < 3 || !appsScriptConfigured()) return [];
  const [content, rows] = await Promise.all([getContent(), loadRows()]);
  const tables = content.seating?.tables ?? {};
  const seen = new Set<string>();
  const out: TableMatch[] = [];
  for (const r of [...rows].reverse()) { // newest reply first
    const name = String(r.name || "").trim();
    const key = slugify(name);
    if (!key || seen.has(key) || !/^(y|yes|attending|accept)/i.test(String(r.attending ?? ""))) continue;
    const nw = words(name);
    if (!q.every((w) => nw.some((n) => n.startsWith(w)))) continue;
    seen.add(key);
    out.push({ name, table: String(tables[key] ?? "").trim(), guests: Math.max(1, Number(r.guests) || 1) });
    if (out.length >= 6) break;
  }
  return out;
}
