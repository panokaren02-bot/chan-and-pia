import { DEFAULT_ORDER } from "./sections";
// ─────────────────────────────────────────────────────────────
//  ALL INVITATION CONTENT LIVES HERE — edit this file per client.
// ─────────────────────────────────────────────────────────────

export const defaultWedding = {
  groom: "Chan",
  bride: "Pia",
  groomFull: "Christian Ortua",
  brideFull: "Pia Klariz Padilla",
  monogram: ["C", "P"] as [string, string],
  monogramImage: "/monogram/monogram-web.png", // transparent PNG, dark shapes
  hashtag: "#ChanAndPia2027", // TODO: confirm the couple's hashtag

  // ISO date with Philippine timezone offset (+08:00) — ceremony start
  dateISO: "2027-05-14T13:30:00+08:00",
  dateLabel: "May 14, 2027",

  meta: {
    title: "Chan & Pia · May 14, 2027",
    description: "You are cordially invited to celebrate the wedding of Chan & Pia.",
    // link preview shown in Messenger, Viber, WhatsApp, iMessage… (1200×630)
    image: "/og/save-the-date.jpg",
  },

  // Background music. TikTok links can't be played directly — save the song as an mp3
  // in /public/music and set e.g. "/music/song.mp3". Source: https://vt.tiktok.com/ZSpDoaxwU/
  music: "/audio/WALONG%20BILYON%20-%20TJ%20Monterde%20(Wedding%20Version).mp3", // "Walong Bilyon (Wedding Version)" — TJ Monterde; loops after the envelope opens

  ceremony: {
    label: "Ceremony",
    name: "Santuario di San Paolo",
    address: "Diocese of Novaliches",
    time: "1:30 PM",
    image: "ceremony",
    images: ["/images/venue/ceremony-3.webp", "/images/venue/ceremony-2.webp", "/images/venue/ceremony-1.webp"] as string[],
    mapUrl: "https://maps.app.goo.gl/6DMvTo9TzQ84hB1cA",
  },
  reception: {
    label: "Reception",
    name: "Casa Beatriz Events and Resort Place",
    address: "",
    time: "To follow after the ceremony",
    image: "reception",
    images: ["/images/venue/reception-2.webp", "/images/venue/reception-3.webp", "/images/venue/reception-1.webp"] as string[],
    mapUrl: "https://maps.app.goo.gl/xvPDxJtCWRQgQ5nK7",
  },

  // Order of the day (edit times in the dashboard)
  schedule: [
    { time: "1:00 PM", label: "Guest Arrival", note: "Kindly be seated by 1:15 PM" },
    { time: "1:30 PM", label: "Wedding Ceremony", note: "Santuario di San Paolo" },
    { time: "2:45 PM", label: "Photos", note: "Family, entourage & friends" },
    { time: "4:00 PM", label: "Cocktails", note: "Casa Beatriz" },
    { time: "5:00 PM", label: "Reception", note: "Dinner, toasts & first dance" },
    { time: "9:00 PM", label: "Send-off", note: "One last cheer for the newlyweds" },
  ] as { time: string; label: string; note?: string }[],

  // Color motif
  motif: [
    { name: "Warm Ivory", hex: "#F5F0E8" },
    { name: "Dark Burgundy", hex: "#511D29" },
    { name: "Soft Black", hex: "#181818" },
    { name: "Muted Champagne", hex: "#C5AA83" },
  ],

  dressCode: {
    intro:
      "Help us create a beautifully cohesive celebration. Our color motif is warm ivory, dark burgundy, soft black and muted champagne — here's the attire guide for each group.",
    groups: [
      {
        title: "Principal Sponsors",
        gentlemen: "Barong Tagalog with black slacks",
        ladies: "Long gown or Filipiniana in muted champagne",
        colors: ["#C5AA83", "#F5F0E8"],
      },
      {
        title: "Entourage",
        gentlemen: "Black suit with burgundy accent",
        ladies: "Floor-length dress in dark burgundy",
        colors: ["#511D29", "#181818"],
      },
      {
        title: "Guests",
        gentlemen: "Long sleeves or suit in soft black, burgundy or champagne",
        ladies: "Semi-formal dress in burgundy, champagne or soft black",
        colors: ["#511D29", "#181818", "#C5AA83"],
        note: "Kindly avoid wearing white and bright colors.",
      },
    ],
  },

  // Personal letter shown when the link has ?to=<slug> (slug = full name, lowercased, dashes).
  // See /invites for every guest's personal link. The Entourage section is built from the invites
  // (role → group) and shows only Approved people.
  letter: {
    lines: [
      "Yes, you read that right!",
      "As we count down the days to saying “I do,” we keep thinking about the people who have loved us, guided us and cheered us on — the ones we want closest to us when that moment comes.",
      "You are one of them.",
    ],
    // a short paragraph for each kind of role, shown just before the question ({nickname} works here too)
    notes: {
      sponsors: "Our day would not be complete without you walking down the aisle with us.",
      honor: "You have been there through every chapter of our story. There is no one we would rather have standing right beside us when we say “I do.”",
      squad: "You have filled our lives with laughter, support and so many memories. Our day would not be complete without you walking down the aisle with us.",
      little: "We have a very special job for you on our wedding day, and we can’t wait to see you walk down the aisle!",
      special: "You hold a special place in our hearts, and we would be honored to have you play a part in our ceremony.",
    },
    signoff: "With love,",
    // message the dashboard pre-fills when you share someone's link. {nickname} {name} {role} {couple} {link}
    shareMessage:
      "Hi {nickname}! 💌\n\n{couple} have a special question for you. Open your personal invitation here:\n{link}",
  },
  // Roles you add in the dashboard (Personal Invites → Roles), each with its own heading in the Entourage.
  // label = heading on the site, ask = the "Will you be …?" text. e.g. { label: "Candle Sponsors", ask: "our candle sponsor" }
  customRoles: [] as CustomRole[],
  // No names in the code: every invite (and so the whole Entourage) comes from the "Invites" tab
  // of the Google Sheet, loaded through the Apps Script web app (see lib/content.ts).
  invites: [] as Invite[],

  invitation:
    "We invite you to join us as we receive the blessing of God on our marriage and share the joy of this beautiful beginning of our life together.",

  rsvp: {
    deadline: "April 14, 2027", // TODO: confirm RSVP deadline
    message:
      "If we don't receive your response by the deadline, we'll unfortunately have to mark you as unable to attend.",
    maxGuests: 2,
    // wishes wall below the RSVP: guests' messages, newest first
    showWishes: true,
    hiddenWishes: [] as string[], // submittedAt of messages hidden from the dashboard
  },

  reminders: {
    dos: [
      "Please arrive early and be seated before the ceremony begins.",
      "Kindly observe the solemnity of the ceremony.",
      "Keep your phones on silent mode.",
      "Be present and enjoy this special moment with us.",
      "Feel free to take photos from your seat without blocking the view.",
    ],
    donts: [
      "Please do not stand in the aisles or block the photographers.",
      "Please refrain from using flash photography during the ceremony.",
      "Kindly do not bring uninvited plus-ones — our seats are limited.",
      "Please do not leave before the newlyweds' grand exit.",
    ],
  },

  thanks: {
    title: ["Thank You,", "from the bottom of our hearts."],
    body:
      "Thank you for being part of our special day and for celebrating this beautiful milestone with us. Your presence and love mean so much to us and are truly the greatest gifts we could ask for.",
  },

  gifts: {
    intro:
      "Should you wish to bless us further, a monetary gift in cash or through fund transfer would be sincerely appreciated as we begin this new chapter together.",
    // TODO: replace with the couple's real accounts and QR images
    accounts: [
      { bank: "Bank", accountName: "Pia Klariz Padilla", accountNumber: "To follow", qr: "" },
      { bank: "GCash", accountName: "Christian Ortua", accountNumber: "To follow", qr: "" },
    ],
  },

  // Page layout: order of the sections between the hero and the footer, and which are switched off.
  layout: {
    order: [...DEFAULT_ORDER] as string[],
    hidden: [] as string[],
  },

  // Every photo on the site. Local defaults live in /public/images; dashboard uploads become /api/photo/<driveId>.
  // m = portrait crop for phones, d = landscape crop for desktop (either may be missing).
  photos: {
    slots: {
      hero: { m: "/images/hero-m.webp", d: "/images/hero-d.webp" },
      savedate: { m: "/images/savedate-m.webp", d: "/images/savedate-d.webp" },
      ceremony: { d: "/images/ceremony-d.webp" },
      reception: { d: "/images/reception-d.webp" },
      dresscode: { m: "/images/dresscode-m.webp", d: "/images/dresscode-d.webp" },
      entourage: { m: "/images/entourage-m.webp", d: "/images/entourage-d.webp" },
      rsvp: { m: "/images/rsvp-m.webp", d: "/images/rsvp-d.webp" },
      thanks: { m: "/images/thanks-m.webp", d: "/images/thanks-d.webp" },
      card: { d: "/images/loader-d.webp" },
    } as Record<PhotoSlotKey, PhotoSlot>,
    gallery: [
      "/images/g1-m.webp", "/images/g2-d.webp", "/images/g3-m.webp", "/images/g4-d.webp",
      "/images/g5-m.webp", "/images/g6-d.webp", "/images/g7-m.webp", "/images/g8-d.webp",
      "/images/g9-m.webp", "/images/g10-d.webp", "/images/g11-m.webp", "/images/g12-d.webp",
    ] as string[],
    // hero background slideshow (crossfades in a loop); phone = portrait, computer = landscape
    heroSlides: [
      { m: "/images/hero-m.webp", d: "/images/hero-d.webp" },
      { m: "/images/g1-m.webp", d: "/images/g2-d.webp" },
      { m: "/images/g3-m.webp", d: "/images/g4-d.webp" },
      { m: "/images/g5-m.webp", d: "/images/g6-d.webp" },
      { m: "/images/g7-m.webp", d: "/images/g8-d.webp" },
    ] as { m?: string; d?: string }[],
    // opening-screen collage: exactly 12 prints (positions are fixed in CSS .c1 … .c12)
    collage: Array.from({ length: 12 }, (_, i) => `/images/c${i + 1}.webp`) as string[],
  },
};

export type PhotoSlot = { m?: string; d?: string };
export type InviteStatus = "pending" | "approved" | "declined";
export type CustomRole = { label: string; ask: string };
export type Invite = { name: string; nickname: string; role: string; status?: InviteStatus; respondedAt?: string };
export const photoSlotInfo = {
  hero: "Hero (top of the page)",
  savedate: "Save the Date background",
  ceremony: "Ceremony venue",
  reception: "Reception venue",
  dresscode: "Dress Code banner",
  entourage: "Entourage banner",
  rsvp: "RSVP background",
  thanks: "Thank You background",
  card: "Invitation card (inside the envelope)",
} as const;
export type PhotoSlotKey = keyof typeof photoSlotInfo;

export type Wedding = typeof defaultWedding;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function findInvite(w: Wedding, slug: string | null) {
  if (!slug) return undefined;
  return w.invites.find((i) => slugify(i.name) === slugify(slug));
}

// Saved content wins; objects merge key by key so fields added later still get their defaults.
export function mergeContent<T>(base: T, saved: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(saved) ? saved : base) as T;
  if (base && typeof base === "object") {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(saved as Record<string, unknown>)) {
      out[k] = k in out ? mergeContent(out[k], v) : v;
    }
    return out as T;
  }
  return (saved === undefined || saved === null ? base : saved) as T;
}
