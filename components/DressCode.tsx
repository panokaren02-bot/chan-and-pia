"use client";
import { useState } from "react";
import { useWedding } from "./WeddingProvider";
import Photo from "./Photo";
import { IconChevron } from "./Icons";

export default function DressCode() {
  const wedding = useWedding();
  const [open, setOpen] = useState<number | null>(null);
  const { intro, groups } = wedding.dressCode;

  return (
    <section id="dress-code" className="sec-cream">
      <div className="dress-hero">
        <div className="bg-photo"><Photo name="dresscode" alt="" /></div>
        <div className="shade" />
        <div className="inner reveal">
          <p className="eyebrow">Dress Code</p>
          <h2 className="title">What to <em>Wear</em></h2>
          <div className="rule" />
        </div>
      </div>
      <div className="section dress-body" style={{ paddingTop: 30 }}>
        <div className="narrow">
          <p className="lead center reveal">{intro}</p>
          <div className="motif reveal d1">
            {wedding.motif.map((c) => (
              <div key={c.hex} className="motif-item">
                <span className="motif-dot" style={{ background: c.hex }} />
                <span className="motif-name">{c.name}</span>
              </div>
            ))}
          </div>
          <div className="acc reveal d1">
            {groups.map((g, i) => {
              const isOpen = open === i;
              return (
                <div key={g.title} className={`acc-item ${isOpen ? "open" : ""}`}>
                  <button className="acc-btn" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                    {g.title} <IconChevron />
                  </button>
                  <div className="acc-panel" role="region" aria-hidden={!isOpen}>
                    <div>
                      <div className="acc-content">
                        <div className="attire">
                          <div><h4>Gentlemen</h4><p>{g.gentlemen}</p></div>
                          <div><h4>Ladies</h4><p>{g.ladies}</p></div>
                        </div>
                        <div className="swatches">
                          <small>Palette</small>
                          {g.colors.map((c) => <span key={c} className="swatch" style={{ background: c }} title={c} />)}
                        </div>
                        {"note" in g && g.note && <p className="acc-note">{g.note}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
