import type { Metadata, Viewport } from "next";
import { Playfair_Display, EB_Garamond, Pinyon_Script } from "next/font/google";
import { getContent } from "@/lib/content";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-display" });
const garamond = EB_Garamond({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-body" });
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-script" });

// Link previews need absolute image URLs. Set NEXT_PUBLIC_SITE_URL to the live address (e.g. https://chanandpia.com);
// on Vercel the production domain is picked up automatically.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export async function generateMetadata(): Promise<Metadata> {
  const w = await getContent();
  const img = w.meta.image || w.photos.slots.hero.d || w.photos.slots.hero.m;
  const alt = `${w.groom} & ${w.bride} — Save the Date, ${w.dateLabel}`;
  const images = img ? [{ url: img, width: 1200, height: 630, alt, type: img.endsWith(".png") ? "image/png" : "image/jpeg" }] : [];
  return {
    metadataBase: new URL(siteUrl),
    title: w.meta.title,
    description: w.meta.description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website", url: "/", siteName: `${w.groom} & ${w.bride}`, locale: "en_PH",
      title: w.meta.title, description: w.meta.description, images,
    },
    twitter: { card: "summary_large_image", title: w.meta.title, description: w.meta.description, images: img ? [img] : [] },
  };
}

export const viewport: Viewport = { themeColor: "#511d29", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${garamond.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
