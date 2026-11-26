import type { Metadata, Viewport } from "next";
import { Playfair_Display, EB_Garamond, Pinyon_Script } from "next/font/google";
import { getContent } from "@/lib/content";
import { shareMeta, siteUrl } from "@/lib/seo";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-display" });
const garamond = EB_Garamond({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-body" });
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-script" });

export async function generateMetadata(): Promise<Metadata> {
  const w = await getContent();
  return { metadataBase: new URL(siteUrl), applicationName: `${w.groom} & ${w.bride}`, ...shareMeta(w) };
}

export const viewport: Viewport = { themeColor: "#511d29", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${garamond.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
