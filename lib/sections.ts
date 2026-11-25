// The movable sections of the page, in their default order. The hero always comes first and the footer last.
// `anchor` is the section's id on the page; `menu` is its label in the site menu / footer (omit to keep it out of the menu).
export const SECTIONS = [
  { key: "letter", label: "Personal letter", note: "Only shown on personal invite links", anchor: "letter" },
  { key: "savedate", label: "Save the Date", anchor: "save-the-date", menu: "Save the Date" },
  { key: "venues", label: "Ceremony & Reception", note: "With map QR codes and the day timeline", anchor: "details", menu: "Ceremony & Reception" },
  { key: "dresscode", label: "Dress Code", anchor: "dress-code", menu: "Dress Code" },
  { key: "entourage", label: "Entourage", anchor: "entourage", menu: "Entourage" },
  { key: "gallery", label: "Gallery & hashtag", anchor: "gallery", menu: "Gallery" },
  { key: "invitation", label: "“With grateful hearts” invitation", anchor: "invitation" },
  { key: "rsvp", label: "RSVP", anchor: "rsvp", menu: "RSVP" },
  { key: "wishes", label: "Wishes wall", note: "Hidden automatically until there are messages", anchor: "wishes" },
  { key: "reminders", label: "Reminders (do's & don'ts)", anchor: "reminders", menu: "Reminders" },
  { key: "thanks", label: "Thank you note", anchor: "thanks" },
  { key: "gifts", label: "Gifts", anchor: "gifts", menu: "Gifts" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];
export const DEFAULT_ORDER = SECTIONS.map((s) => s.key) as SectionKey[];
const KNOWN = new Set<string>(DEFAULT_ORDER);

/** Saved order, cleaned: unknown keys dropped, duplicates removed, sections added since the save appended at their default spot. */
export function normalizeOrder(order: readonly string[] | undefined): SectionKey[] {
  const seen = new Set<string>();
  const out = (order ?? []).filter((k) => KNOWN.has(k) && !seen.has(k) && seen.add(k)) as SectionKey[];
  DEFAULT_ORDER.forEach((k, i) => {
    if (seen.has(k)) return;
    // insert after the nearest preceding default section that is present
    const prev = DEFAULT_ORDER.slice(0, i).reverse().find((p) => out.includes(p));
    out.splice(prev ? out.indexOf(prev) + 1 : 0, 0, k);
  });
  return out;
}

/** Ordered, visible sections that belong in the menu. */
export function menuSections(order: readonly string[] | undefined, hidden: readonly string[] | undefined) {
  const off = new Set(hidden ?? []);
  return normalizeOrder(order)
    .filter((k) => !off.has(k))
    .map((k) => SECTIONS.find((s) => s.key === k)!)
    .filter((s): s is Extract<(typeof SECTIONS)[number], { menu: string }> => "menu" in s);
}
