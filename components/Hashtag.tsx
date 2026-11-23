"use client";
import { useWedding } from "./WeddingProvider";
import Photo from "./Photo";
import { IconCopy } from "./Icons";
import { useToast, copyText } from "./useToast";

// Print formats for the flat-lay, in collage order: instant film, 4R landscape, square.
const FORMATS = ["instax", "wide", "square", "instax", "square", "instax", "wide", "instax"] as const;

export default function Hashtag() {
  const wedding = useWedding();
  const toast = useToast();
  const caps = wedding.photos.hashCaptions ?? [];
  const prints = (wedding.photos.hashCollage ?? []).filter(Boolean).slice(0, 8);

  return (
    <section className="hash">
      <p className="hash-eyebrow">Moments we treasure</p>

      <div className="flatlay">
        {prints.map((src, i) => {
          const fmt = FORMATS[i] ?? "square";
          return (
            <figure key={src + i} className={`print print-${fmt} fl${i + 1}`}>
              <div className="print-photo"><img src={src} alt="" loading="lazy" decoding="async" /></div>
              {fmt === "instax" && caps[i] && <figcaption>{caps[i]}</figcaption>}
            </figure>
          );
        })}
        <figure className="print print-instax print-main">
          <div className="print-photo"><Photo name="polaroid" alt={`${wedding.groom} and ${wedding.bride}`} /></div>
          <figcaption className="print-tag">{wedding.hashtag}</figcaption>
        </figure>
      </div>

      <p className="copy-hint">Share your photos with our hashtag</p>
      <button className="btn btn-sm" onClick={async () => (await copyText(wedding.hashtag)) && toast.show("Hashtag copied")}>
        <IconCopy /> Copy Hashtag
      </button>
      {toast.node}
    </section>
  );
}
