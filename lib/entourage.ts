import type { CustomRole, Invite, InviteStatus, Wedding } from "./wedding";

// The Entourage is built from the personal invites: an invite's role ("our Ninong",
// "Chan’s Best Man", "part of our bride’s squad", "our ring bearer"…) puts the person in a group.
// The site shows only Approved people; the dashboard shows everyone with their status.

export type Group = "ninongs" | "ninangs" | "bestMan" | "maidOfHonor" | "groomSquad" | "brideSquad" | "bearers" | "flowerGirls" | "custom";
export type Slot = { group: Group; sub?: string }; // sub = bearer title ("Ring Bearer") or a custom role's label ("Candle Sponsors")

export const GROUPS: { key: Group; label: string; add: string }[] = [
  { key: "ninongs", label: "Ninong", add: "Add ninong" },
  { key: "ninangs", label: "Ninang", add: "Add ninang" },
  { key: "bestMan", label: "Best Man", add: "Add best man" },
  { key: "maidOfHonor", label: "Maid of Honor", add: "Add maid of honor" },
  { key: "groomSquad", label: "Groom's Squad", add: "Add to groom's squad" },
  { key: "brideSquad", label: "Bride's Squad", add: "Add to bride's squad" },
  { key: "bearers", label: "Bearers", add: "Add bearer" },
  { key: "flowerGirls", label: "Flower Girls", add: "Add flower girl" },
  { key: "custom", label: "Other roles", add: "Add person" },
];

export const STATUS_LABEL: Record<InviteStatus, string> = { pending: "Pending", approved: "Approved", declined: "Declined" };
export const statusOf = (i: Pick<Invite, "status">): InviteStatus =>
  i.status === "approved" || i.status === "declined" ? i.status : "pending";

const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** "our Candle Sponsors" → "candle sponsor": lowercase, no our/the/a/part of, no plural s. */
export const roleCore = (s: string) =>
  (s || "").toLowerCase().replace(/[’']/g, "'").replace(/^\s*(part of\s+)?(our|the|a|an|my)\s+/, "").replace(/[^a-z0-9' ]+/g, " ").replace(/s\b/g, "").replace(/\s+/g, " ").trim();

/** The custom role an invite's role text belongs to, if any. */
export function customRoleOf(role: string, custom: CustomRole[] = []): CustomRole | undefined {
  const r = roleCore(role);
  if (!r) return undefined;
  return custom.find((c) => { const a = roleCore(c.ask), l = roleCore(c.label); return (!!a && r === a) || (!!l && r === l); });
}

/** Which entourage group an invite's role points to, or null for a guest-only invite. Custom roles win over the built-in ones. */
export function slotOf(role: string, custom: CustomRole[] = []): Slot | null {
  const c = customRoleOf(role, custom);
  if (c) return { group: "custom", sub: c.label.trim() || c.ask.trim() };
  const r = (role || "").toLowerCase().replace(/[’']/g, "'");
  if (/best\s*man/.test(r)) return { group: "bestMan" };
  if (/(maid|matron) of honou?r/.test(r)) return { group: "maidOfHonor" };
  if (/ninong|godfather/.test(r)) return { group: "ninongs" };
  if (/ninang|godmother/.test(r)) return { group: "ninangs" };
  const bearer = r.match(/(?:^|\s)(?!(?:our|the|a|my)\s)([a-z]+)\s+bearer/);
  if (bearer || /\bbearer\b/.test(r)) return { group: "bearers", sub: title(bearer ? `${bearer[1]} bearer` : "bearer") };
  if (/flower\s*girl/.test(r)) return { group: "flowerGirls" };
  if (/groomsm[ae]n|groom'?s\s+(squad|side|men)/.test(r)) return { group: "groomSquad" };
  if (/bridesmaid|bride'?s\s+(squad|side|maid)/.test(r)) return { group: "brideSquad" };
  return null;
}

/** The "Will you be …?" text for a group. */
export function roleFor(s: Slot, w: Pick<Wedding, "groom" | "bride">): string {
  switch (s.group) {
    case "ninongs": return "our Ninong";
    case "ninangs": return "our Ninang";
    case "bestMan": return `${w.groom}’s Best Man`;
    case "maidOfHonor": return `${w.bride}’s Maid of Honor`;
    case "groomSquad": return "part of our groom’s squad";
    case "brideSquad": return "part of our bride’s squad";
    case "bearers": return `our ${(s.sub || "Bearer").trim().toLowerCase().replace(/^bible\b/, "Bible")}`;
    case "flowerGirls": return "our flower girl";
    case "custom": return s.sub ? `our ${s.sub.replace(/s$/, "").toLowerCase()}` : "";
  }
}

export const BEARER_TYPES = ["Bible Bearer", "Ring Bearer", "Coin Bearer", "Cord Bearer", "Veil Bearer", "Candle Bearer"];

/** Suggestions for the invite "Role" field: the built-in roles, then your own. */
export function roleSuggestions(w: Pick<Wedding, "groom" | "bride" | "customRoles">): string[] {
  return GROUPS.flatMap((g) => g.key === "custom" ? (w.customRoles ?? []).map((c) => c.ask.trim()).filter(Boolean)
    : g.key === "bearers" ? BEARER_TYPES.map((sub) => roleFor({ group: "bearers", sub }, w)) : [roleFor({ group: g.key }, w)]);
}

/** A ready-made custom role from whatever was typed: "our candle sponsor" → { label: "Candle Sponsors", ask: "our candle sponsor" }. */
export function customRoleFrom(typed: string): CustomRole {
  const ask = typed.trim();
  const core = ask.replace(/^\s*(part of\s+)?(our|the|a|an|my)\s+/i, "").trim();
  const label = core.replace(/\b\w/g, (c) => c.toUpperCase());
  return { label: /s$/i.test(label) ? label : `${label}s`, ask: /^(our|the|a|an|my|part of)\b/i.test(ask) ? ask : `our ${ask}` };
}

export type Member = { invite: Invite; index: number; sub?: string };

/** Invites grouped by entourage group, in invite order. */
export function groupInvites(invites: Invite[], custom: CustomRole[] = [], keep: (i: Invite) => boolean = () => true): Record<Group, Member[]> {
  const out = Object.fromEntries(GROUPS.map((g) => [g.key, [] as Member[]])) as Record<Group, Member[]>;
  invites.forEach((invite, index) => {
    const s = slotOf(invite.role, custom);
    if (s && keep(invite)) out[s.group].push({ invite, index, sub: s.sub });
  });
  return out;
}

/** What the site's Entourage section shows: approved people only. */
export const approvedEntourage = (invites: Invite[], custom: CustomRole[] = []) =>
  groupInvites(invites, custom, (i) => statusOf(i) === "approved" && !!i.name.trim());

/** The custom-role members split by role, in the order the roles are listed in the dashboard. */
export function customGroups(members: Member[], custom: CustomRole[] = []) {
  const labels = [...new Set([...custom.map((c) => c.label.trim() || c.ask.trim()), ...members.map((m) => m.sub ?? "")])].filter(Boolean);
  return labels.map((label) => ({ label, members: members.filter((m) => m.sub === label) })).filter((g) => g.members.length);
}

/** Clean up invite rows coming from the sheet or the browser. */
export function normalizeInvites(raw: unknown): Invite[] {
  if (!Array.isArray(raw)) return [];
  const s = (v: unknown, n = 200) => String(v ?? "").slice(0, n);
  return raw.filter((r) => r && typeof r === "object").map((r) => {
    const o = r as Record<string, unknown>;
    return { name: s(o.name).trim(), nickname: s(o.nickname), role: s(o.role), status: statusOf(o as Invite), respondedAt: s(o.respondedAt, 40) };
  }).filter((i) => i.name);
}
