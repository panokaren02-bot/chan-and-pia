import type { Metadata } from "next";
import InviteLinks from "@/components/InviteLinks";
import { WeddingProvider } from "@/components/WeddingProvider";
import { getContent } from "@/lib/content";

export const metadata: Metadata = { title: "Personal Invite Links", robots: { index: false } };

export default async function Page() {
  return (
    <WeddingProvider value={await getContent()}>
      <InviteLinks />
    </WeddingProvider>
  );
}
