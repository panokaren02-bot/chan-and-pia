"use client";
import { useCallback, useEffect, useState } from "react";
import { useWedding } from "./WeddingProvider";
import { IconCopy } from "./Icons";
import { useToast, copyText } from "./useToast";

export default function Gallery() {
  const [idx, setIdx] = useState<number | null>(null);
  const wedding = useWedding();
  const srcs = wedding.photos.gallery;
  const toast = useToast();
  const go = useCallback((d: number) => setIdx((i) => (i === null ? i : (i + d + srcs.length) % srcs.length)), [srcs.length]);

  useEffect(() => {
    if (idx === null) return;
    document.body.classList.add("locked");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIdx(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.classList.remove("locked"); };
  }, [idx, go]);

  return (
    <section id="gallery" className="section sec-ivory">
      <div className="container">
        <header className="sec-head reveal">
          <p className="eyebrow">Moments</p>
          <h2 className="title">Our <em>Story</em> in Frames</h2>
          <div className="rule" />
        </header>
        {wedding.hashtag && (
          <div className="gal-tag reveal">
            <p className="gal-tag-hint">Share your photos with our hashtag</p>
            <p className="gal-tag-name">{wedding.hashtag}</p>
            <button className="btn btn-outline btn-sm" onClick={async () => (await copyText(wedding.hashtag)) && toast.show("Hashtag copied")}>
              <IconCopy /> Copy hashtag
            </button>
          </div>
        )}
        <div className="gallery-grid">
          {srcs.map((src, i) => (
            <button key={src} className="g-item reveal" onClick={() => setIdx(i)} aria-label={`Open photo ${i + 1}`}>
              <img src={src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      </div>

      {idx !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setIdx(null)}>
          <img src={srcs[idx]} alt="" onClick={(e) => e.stopPropagation()} />
          <button className="lb-btn lb-close" aria-label="Close" onClick={() => setIdx(null)}>✕</button>
          <button className="lb-btn lb-prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); go(-1); }}>‹</button>
          <button className="lb-btn lb-next" aria-label="Next" onClick={(e) => { e.stopPropagation(); go(1); }}>›</button>
          <div className="lb-count">{idx + 1} / {srcs.length}</div>
        </div>
      )}
      {toast.node}
    </section>
  );
}
