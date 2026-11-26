import { Fragment } from "react";
import Opening from "@/components/Opening";
import Hero from "@/components/Hero";
import PersonalLetter from "@/components/PersonalLetter";
import SaveTheDate from "@/components/SaveTheDate";
import Venues from "@/components/Venues";
import DressCode from "@/components/DressCode";
import Entourage from "@/components/Entourage";
import Gallery from "@/components/Gallery";
import Invitation from "@/components/Invitation";
import Rsvp from "@/components/Rsvp";
import Wishes from "@/components/Wishes";
import Reminders from "@/components/Reminders";
import ThankYou from "@/components/ThankYou";
import Gifts from "@/components/Gifts";
import Footer from "@/components/Footer";
import RevealObserver from "@/components/RevealObserver";
import { WeddingProvider } from "@/components/WeddingProvider";
import { getContent } from "@/lib/content";
import { normalizeOrder, type SectionKey } from "@/lib/sections";
import { approvedEntourage } from "@/lib/entourage";
import { shareMeta } from "@/lib/seo";
import type { Metadata } from "next";

// A personal link (?to=<slug>) gets its own preview: "Tito Orly, Chan & Pia have a special question for you".
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ to?: string | string[] }> }): Promise<Metadata> {
  const to = (await searchParams).to;
  return shareMeta(await getContent(), Array.isArray(to) ? to[0] : to);
}

// Each movable section; the order and visibility come from the dashboard (Layout tab).
const BLOCKS: Record<SectionKey, () => React.ReactNode> = {
  letter: () => <PersonalLetter />,
  savedate: () => <SaveTheDate />,
  venues: () => <Venues />,
  dresscode: () => <DressCode />,
  entourage: () => <Entourage />,
  gallery: () => <Gallery />,
  invitation: () => <Invitation />,
  rsvp: () => <Rsvp />,
  wishes: () => <Wishes />,
  reminders: () => <Reminders />,
  thanks: () => <ThankYou />,
  gifts: () => <Gifts />,
};

export default async function Page() {
  const loaded = await getContent();
  const hidden = new Set(loaded.layout?.hidden ?? []);
  // the Entourage shows only approved people; until someone says yes, drop it (and its menu link)
  if (!Object.values(approvedEntourage(loaded.invites, loaded.customRoles)).some((l) => l.length)) hidden.add("entourage");
  const content = { ...loaded, layout: { order: loaded.layout?.order ?? [], hidden: [...hidden] } };
  const order = normalizeOrder(content.layout?.order).filter((k) => !hidden.has(k));
  return (
    <WeddingProvider value={content}>
      <Opening />
      <main>
        <Hero />
        {order.map((k) => <Fragment key={k}>{BLOCKS[k]()}</Fragment>)}
      </main>
      <Footer />
      <RevealObserver />
    </WeddingProvider>
  );
}
