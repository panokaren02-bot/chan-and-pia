"use client";
import { useWedding } from "./WeddingProvider";
import { IconHeart } from "./Icons";

const hearts = [
  { left: "12%", top: "18%", size: 18, delay: "0s" }, { left: "82%", top: "12%", size: 26, delay: "1.2s" },
  { left: "46%", top: "78%", size: 30, delay: "0.6s" }, { left: "78%", top: "84%", size: 38, delay: "2s" },
  { left: "8%", top: "70%", size: 22, delay: "3s" },
];

export default function Invitation() {
  const wedding = useWedding();
  return (
    <section className="invite center" style={{ position: "relative" }}>
      {hearts.map((h, i) => (
        <span key={i} className="heart" style={{ left: h.left, top: h.top, animationDelay: h.delay }} aria-hidden>
          <IconHeart size={h.size} />
        </span>
      ))}
      <div className="narrow" style={{ position: "relative" }}>
        <p className="eyebrow reveal">With Grateful Hearts</p>
        <div className="rule reveal" style={{ background: "var(--line)" }} />
        <p className="invite-names reveal d1">{wedding.groomFull} <span className="amp">&amp;</span> {wedding.brideFull}</p>
        <p className="invite-text reveal d2">{wedding.invitation}</p>
      </div>
    </section>
  );
}
