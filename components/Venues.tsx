"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import { useWedding, usePhotoSlot } from "./WeddingProvider";

const SLIDE_MS = 5000;

/** Crisp SVG QR code (one path, burgundy on white). */
function QR({ value, label }: { value: string; label: string }) {
  const { d, size } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let path = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
    return { d: path, size: n };
  }, [value]);
  return (
    <svg className="venue-qr" viewBox={`-2 -2 ${size + 4} ${size + 4}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#fff" />
      <path d={d} fill="currentColor" />
    </svg>
  );
}

/** Photo slideshow: soft crossfade with a gentle zoom, every 5 seconds. */
function VenueSlides({ images, alt, delay }: { images: string[]; alt: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [[idx, prev], setPair] = useState<[number, number | null]>([0, null]);
  const [visible, setVisible] = useState(false);
  const n = images.length;
  const next = () => setPair(([i]) => [(i + 1) % n, i]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id: ReturnType<typeof setInterval>;
    const t = setTimeout(() => { next(); id = setInterval(next, SLIDE_MS); }, delay);
    return () => { clearTimeout(t); clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, n, delay]);

  return (
    <div ref={ref} className="venue-photo" onClick={() => n > 1 && next()}>
      {images.map((src, i) => (
        <img key={src + i} src={src} alt={i === 0 ? alt : ""} loading="lazy" decoding="async"
          className={i === idx ? "on" : i === prev ? "prev" : ""} />
      ))}
    </div>
  );
}

function Venue({ v, i }: { v: ReturnType<typeof useWedding>["ceremony"]; i: number }) {
  const slot = usePhotoSlot(v.image);
  const images = v.images?.length ? v.images : [slot.d ?? slot.m].filter(Boolean) as string[];
  return (
    <article className={`venue reveal d${i + 1}`}>
      {images.length > 0 && <VenueSlides images={images} alt={v.name} delay={SLIDE_MS} />}
      <div className="venue-body">
        <div className="venue-top">
          <span className="venue-label">{v.label}</span>
          <span className="venue-time">{v.time}</span>
        </div>
        <h3 className="venue-name">{v.name}</h3>
        {v.address && <p className="venue-addr">{v.address}</p>}

        {v.mapUrl && (
          <div className="venue-map">
            <QR value={v.mapUrl} label={`QR code: directions to ${v.name}`} />
            <div className="venue-map-text">
              <p className="venue-scan">Scan the code or</p>
              <a className="venue-btn" href={v.mapUrl} target="_blank" rel="noopener noreferrer">
                <span>Get Directions</span>
                <svg viewBox="0 0 24 24" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
              <p className="venue-via">opens in Google Maps</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Venues() {
  const wedding = useWedding();

  return (
    <section id="details" className="section sec-ivory grain">
      <div className="container">
        <header className="sec-head reveal">
          <p className="eyebrow">The Wedding Day</p>
          <h2 className="title">Ceremony &amp; Reception</h2>
          <div className="rule" />
        </header>

        <div className="venues">
          {[wedding.ceremony, wedding.reception].map((v, i) => <Venue key={v.label} v={v} i={i} />)}
        </div>

        {wedding.schedule.length > 0 && (
          <div className="schedule">
            <header className="sec-head reveal">
              <p className="eyebrow">Order of the Day</p>
            </header>
            <ol className="tl reveal" style={{ ["--n" as string]: wedding.schedule.length }}>
              {wedding.schedule.map((s, i) => (
                <li key={s.label + i} style={{ ["--i" as string]: i }}>
                  <span className="tl-time">{s.time}</span>
                  <span className="tl-dot" aria-hidden />
                  <span className="tl-text">
                    <span className="tl-label">{s.label}</span>
                    {s.note && <span className="tl-note">{s.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
