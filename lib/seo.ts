import type { Metadata } from "next";
import { findInvite, type Wedding } from "./wedding";

// Link previews need absolute URLs. Set NEXT_PUBLIC_SITE_URL to the live address (e.g. https://chanandpia.com);
// on Vercel the production domain is picked up automatically.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const abs = (u: string) => new URL(u, siteUrl).toString();

/** The link preview (Messenger, Viber, WhatsApp, Telegram, iMessage…) for the site, or for one guest's personal link. */
export function shareMeta(w: Wedding, to?: string | null): Metadata {
  const img = w.meta.image || w.photos.slots.hero.d || w.photos.slots.hero.m;
  const couple = `${w.groom} & ${w.bride}`;
  const invite = findInvite(w, to ?? null);
  const nick = invite ? invite.nickname.trim() || invite.name.trim().split(/\s+/)[0] : "";

  // a personal link keeps the question a surprise: it only says there is one, just for them
  const title = invite ? `${nick}, ${couple} have a special question for you` : w.meta.title;
  const description = invite
    ? `We’re getting married on ${w.dateLabel}! Open your personal invitation from ${couple}.`
    : w.meta.description;
  const alt = `${couple} — ${w.dateLabel}`;
  const type = img?.endsWith(".png") ? "image/png" : img?.endsWith(".webp") ? "image/webp" : "image/jpeg";
  const images = img ? [{ url: abs(img), width: 1200, height: 630, alt, type }] : [];

  return {
    title, description,
    // personal links: no og:url / canonical (Next would strip the ?to=, and Messenger would then fetch the plain
    // site's preview instead); apps use the shared link itself. They're also kept out of search engines.
    robots: invite ? { index: false, follow: false } : null,
    alternates: { canonical: invite ? null : "/" },
    openGraph: { type: "website", ...(invite ? {} : { url: abs("/") }), siteName: couple, locale: "en_PH", title, description, images },
    twitter: { card: "summary_large_image", title, description, images: img ? [{ url: abs(img), alt }] : [] },
  };
}
