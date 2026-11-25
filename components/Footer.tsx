"use client";
import { useHiddenSections, useWedding } from "./WeddingProvider";
import Monogram from "./Monogram";
import { IconUp } from "./Icons";
import { menuSections } from "@/lib/sections";

const SHORT: Record<string, string> = { "Ceremony & Reception": "Details", "Save the Date": "Save the Date" };

const DEV = { name: "Lance Valle", url: "https://lance28-beep.github.io/portfolio-website/" };
const STUDIO = { name: "Wedding Invitation Naga", url: "https://www.facebook.com/WeddingInvitationNaga/" };

export default function Footer() {
  const wedding = useWedding();
  const year = new Date(wedding.dateISO).getFullYear();
  const hidden = useHiddenSections();
  const links = menuSections(wedding.layout?.order, hidden).map((s) => [SHORT[s.menu] ?? s.menu, s.anchor]);
  return (
    <footer className="footer">
      <div className="footer-main">
        <Monogram />
        <p className="footer-names">{wedding.groom} <span>&amp;</span> {wedding.bride}</p>
        <p className="footer-date"><span>{wedding.dateLabel}</span><i>·</i><span>{wedding.ceremony.name}</span></p>
        <p className="footer-hash">{wedding.hashtag}</p>

        <nav className="footer-links" aria-label="Sections">
          {links.map(([l, id]) => <a key={id} href={`#${id}`}>{l}</a>)}
        </nav>

        <button className="to-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <IconUp /><span>Back to top</span>
        </button>
      </div>

      <div className="footer-bottom">
        <p className="footer-love">Made with love · {year}</p>
        <p className="footer-credit">
          Developed by <a href={DEV.url} target="_blank" rel="noopener noreferrer">{DEV.name}</a>
        </p>
        <p className="footer-credit">
          Want a website like this? Visit <a href={STUDIO.url} target="_blank" rel="noopener noreferrer">{STUDIO.name}</a>
        </p>
      </div>
    </footer>
  );
}
