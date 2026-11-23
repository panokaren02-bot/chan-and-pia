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

export default async function Page() {
  const content = await getContent();
  return (
    <WeddingProvider value={content}>
      <Opening />
      <main>
        <Hero />
        <PersonalLetter />
        <SaveTheDate />
        <Venues />
        <DressCode />
        <Entourage />
        <Hashtag />
        <Gallery />
        <Invitation />
        <Rsvp />
        <Wishes />
        <Reminders />
        <ThankYou />
        <Gifts />
      </main>
      <Footer />
      <RevealObserver />
    </WeddingProvider>
  );
}
