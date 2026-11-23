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
  music: "/audio/palagi.mp3", // "Palagi (Wedding Version)" — TJ Monterde; loops after the envelope opens

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

  entourage: {
    ninongs: [
      "Orlando Balbuena",
      "Jason Cruz",
      "Rolando Montecillo",
      "Raphael Luis Marcelo",
      "Larry Ramo",
      "Bill Dela Pena",
    ],
    ninangs: [
      "Ma. Christina Pabayo",
      "Cynthia Baclagon",
      "Dorothy Dela Pena",
      "Riza Ramo",
      "Rosemarie Pelone",
    ],
    bestMan: "David Angelo Arquero",
    maidOfHonor: "Nefeteri Anne Ual",
    groomSquad: [
      "Paul Santos",
      "Maureen Doydora",
      "Edrian Caranagan",
      "Mari Grace Balbuena",
      "Luigie Gavino",
      "Marjorie Ortua",
      "Karl Dajalos",
      "Jefferson Visaya",
      "Marridel Del Rosario",
    ],
    brideSquad: [
      "Danelyn Sumaylo",
      "Paul Krizchan Padilla",
      "Kathleen Claire Girang",
      "Patrick Kenneth Padilla",
      "Sheila Marey Librao",
      "Maria Angelica Visaya",
      "Mikee Soriano",
      "Iris Sia",
    ],
    bearers: [
      { role: "Bible Bearer", name: "Prince Yuri Madrid" },
      { role: "Ring Bearer", name: "Jace Kendrei Padilla" },
      { role: "Coin Bearer", name: "Jacine Kaliyah Padilla" },
    ],
    flowerGirls: ["Jacel Kamilah Padilla", "Gemma Rich Madrid"],
  },

  // Personal letter shown when the link has ?to=<slug> (slug = full name, lowercased, dashes).
  // See /invites for every guest's personal link.
  letter: {
    lines: [
      "We are getting married!",
      "As we look forward to saying “I do”, we have been thinking about the people we want closest to us when that moment finally comes.",
      "Of course, you’re one of them!",
    ],
    signoff: "With love,",
  },
  invites: [
    { name: "Orlando Balbuena", nickname: "Tito Orly", role: "our Ninong" },
    { name: "Jason Cruz", nickname: "Sir Cruz", role: "our Ninong" },
    { name: "Rolando Montecillo", nickname: "Tito Tikboy", role: "our Ninong" },
    { name: "Raphael Luis Marcelo", nickname: "Raph", role: "our Ninong" },
    { name: "Larry Ramo", nickname: "Tito Larry", role: "our Ninong" },
    { name: "Bill Dela Pena", nickname: "Tito Bill", role: "our Ninong" },
    { name: "Ma. Christina Pabayo", nickname: "Mam Pabayo", role: "our Ninang" },
    { name: "Cynthia Baclagon", nickname: "Tita Ching", role: "our Ninang" },
    { name: "Dorothy Dela Pena", nickname: "Tita Dorie", role: "our Ninang" },
    { name: "Riza Ramo", nickname: "Tita Riza", role: "our Ninang" },
    { name: "Rosemarie Pelone", nickname: "Rose", role: "our Ninang" },
    { name: "David Angelo Arquero", nickname: "David", role: "Chan’s Best Man" },
    { name: "Nefeteri Anne Ual", nickname: "Nef", role: "Pia’s Maid of Honor" },
    { name: "Paul Santos", nickname: "Paul", role: "part of our groom’s squad" },
    { name: "Maureen Doydora", nickname: "Ate Mau", role: "part of our groom’s squad" },
    { name: "Edrian Caranagan", nickname: "Ian", role: "part of our groom’s squad" },
    { name: "Mari Grace Balbuena", nickname: "Ate Grace", role: "part of our groom’s squad" },
    { name: "Luigie Gavino", nickname: "Gie", role: "part of our groom’s squad" },
    { name: "Marjorie Ortua", nickname: "Ate Jeng", role: "part of our groom’s squad" },
    { name: "Karl Dajalos", nickname: "Karl", role: "part of our groom’s squad" },
    { name: "Jefferson Visaya", nickname: "Jeff", role: "part of our groom’s squad" },
    { name: "Marridel Del Rosario", nickname: "Mads", role: "part of our groom’s squad" },
    { name: "Danelyn Sumaylo", nickname: "Dan", role: "part of our bride’s squad" },
    { name: "Paul Krizchan Padilla", nickname: "Krizchan", role: "part of our bride’s squad" },
    { name: "Kathleen Claire Girang", nickname: "Kat", role: "part of our bride’s squad" },
    { name: "Patrick Kenneth Padilla", nickname: "Kuya Kenneth", role: "part of our bride’s squad" },
    { name: "Sheila Marey Librao", nickname: "She", role: "part of our bride’s squad" },
    { name: "Maria Angelica Visaya", nickname: "Angge", role: "part of our bride’s squad" },
    { name: "Mikee Soriano", nickname: "Mikes", role: "part of our bride’s squad" },
    { name: "Iris Sia", nickname: "Iris", role: "part of our bride’s squad" },
    { name: "Prince Yuri Madrid", nickname: "Yuri", role: "our Bible bearer" },
    { name: "Jace Kendrei Padilla", nickname: "Ace", role: "our ring bearer" },
    { name: "Jacine Kaliyah Padilla", nickname: "Jacine", role: "our coin bearer" },
    { name: "Jacel Kamilah Padilla", nickname: "Jacel", role: "our flower girl" },
    { name: "Gemma Rich Madrid", nickname: "Dudang", role: "our flower girl" },
  ],

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
      polaroid: { m: "/images/polaroid-m.webp" },
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
    // prints scattered around the hashtag polaroid (up to 8)
    hashCollage: [
      "/images/c7.webp", "/images/g10-d.webp", "/images/c4.webp", "/images/c5.webp",
      "/images/g11-m.webp", "/images/c9.webp", "/images/c8.webp", "/images/c1.webp",
    ] as string[],
    // handwritten captions under the hanging prints (same order as hashCollage)
    hashCaptions: ["leap of faith", "always laughing", "you & me", "our happy place", "sunny days", "just us", "golden hour", "forever"] as string[],
    // opening-screen collage: exactly 12 prints (positions are fixed in CSS .c1 … .c12)
    collage: Array.from({ length: 12 }, (_, i) => `/images/c${i + 1}.webp`) as string[],
  },
};

export type PhotoSlot = { m?: string; d?: string };
export const photoSlotInfo = {
  hero: "Hero (top of the page)",
  savedate: "Save the Date background",
  ceremony: "Ceremony venue",
  reception: "Reception venue",
  dresscode: "Dress Code banner",
  entourage: "Entourage banner",
  polaroid: "Hashtag polaroid",
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
