import { Fragment } from "react";
import Opening from "@/components/Opening";
import Hero from "@/components/Hero";
import PersonalLetter from "@/components/PersonalLetter";
import SaveTheDate from "@/components/SaveTheDate";
import Venues from "@/components/Venues";
import DressCode from "@/components/DressCode";
import Entourage from "@/components/Entourage";
import Hashtag from "@/components/Hashtag";
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

// Each movable section; the order and visibility come from the dashboard (Layout tab).
const BLOCKS: Record<SectionKey, () => React.ReactNode> = {
  letter: () => <PersonalLetter />,
  savedate: () => <SaveTheDate />,
  venues: () => <Venues />,
  dresscode: () => <DressCode />,
  entourage: () => <Entourage />,
  hashtag: () => <Hashtag />,
  gallery: () => <Gallery />,
  invitation: () => <Invitation />,
  rsvp: () => <Rsvp />,
  wishes: () => <Wishes />,
  reminders: () => <Reminders />,
  thanks: () => <ThankYou />,
  gifts: () => <Gifts />,
};

export default async function Page() {
  const content = await getContent();
  const hidden = new Set(content.layout?.hidden ?? []);
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
