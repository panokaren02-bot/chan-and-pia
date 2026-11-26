import type { Metadata } from "next";
import FindTable from "@/components/FindTable";
import { WeddingProvider } from "@/components/WeddingProvider";
import { getContent } from "@/lib/content";
import "./table.css";

// The page behind the QR code at the reception door: guests type their name and see their table.
export async function generateMetadata(): Promise<Metadata> {
  const w = await getContent();
  return {
    title: `Find your table · ${w.groom} & ${w.bride}`,
    description: `Welcome to the reception of ${w.groom} & ${w.bride}! Type your name to find your table.`,
    robots: { index: false, follow: false },
    alternates: { canonical: "/table" },
    openGraph: { title: `Find your table · ${w.groom} & ${w.bride}`, url: "/table" },
  };
}

export default async function TablePage() {
  return (
    <WeddingProvider value={await getContent()}>
      <FindTable />
    </WeddingProvider>
  );
}
