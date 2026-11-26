"use client";
import { useEffect, useRef, useState } from "react";
import { useWedding, useHiddenSections } from "./WeddingProvider";
import { weddingDate, weekdayOf } from "@/lib/date";
import Monogram from "./Monogram";

const SLIDE_MS = 6500;

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const s = Math.floor(ms / 1000);
  return { done: ms === 0, units: { Days: Math.floor(s / 86400), Hours: Math.floor((s % 86400) / 3600), Minutes: Math.floor((s % 3600) / 60), Seconds: s % 60 } };
}

export default function Hero() {
  const wedding = useWedding();
  const ref = useRef<HTMLElement>(null);
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);
  const [play, setPlay] = useState(false);
  const [slide, setSlide] = useState(0);

  // slideshow photos; falls back to the single hero photo
  const slides = (wedding.photos.heroSlides ?? []).filter((s) => s.m || s.d);
  if (!slides.length) slides.push(wedding.photos.slots.hero ?? {});

  useEffect(() => {
    const target = weddingDate(wedding);
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [wedding]);

  // Start the entrance once the envelope intro has finished and the page unlocks.
  useEffect(() => {
    const check = () => !document.body.classList.contains("locked") && (setPlay(true), true);
    let mo: MutationObserver | undefined;
    const t0 = setTimeout(() => {
      if (check()) return;
      mo = new MutationObserver(() => { if (check()) mo?.disconnect(); });
      mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }, 50);
    return () => { clearTimeout(t0); mo?.disconnect(); };
  }, []);

  // Crossfade loop (paused for reduced motion).
  useEffect(() => {
    if (!play || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setSlide((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [play, slides.length]);

  // Gentle scroll parallax.
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => el.style.setProperty("--p", Math.min(1, Math.max(0, window.scrollY / el.offsetHeight)).toFixed(4)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); };
  }, []);

  const rsvpOn = !useHiddenSections().includes("rsvp");
  const units = Object.entries(t?.units ?? { Days: 0, Hours: 0, Minutes: 0, Seconds: 0 });

  return (
    <section id="home" ref={ref} className="hero" data-play={play} style={{ "--slide-ms": `${SLIDE_MS}ms` } as React.CSSProperties}>
      <div className="hero-bg">
        {slides.map((s, i) => (
          <picture key={i} className={`hero-slide ${i === slide ? "on" : ""}`}>
            {s.m && s.d && <source media="(min-width: 760px)" srcSet={s.d} />}
            <img src={s.m ?? s.d} alt={i === 0 ? `${wedding.groom} and ${wedding.bride}` : ""}
              loading={i < 2 ? "eager" : "lazy"} decoding="async" fetchPriority={i === 0 ? "high" : "auto"} />
          </picture>
        ))}
      </div>
      <div className="shade" />

      <div className="hero-inner">
        <p className="hero-eyebrow">We&rsquo;re getting married!</p>
        <Monogram />
        <h1>{wedding.groom} <span className="amp">&amp;</span> {wedding.bride}</h1>

        <p className="hero-date">{weekdayOf(wedding)}, {wedding.dateLabel}</p>
        <p className="hero-meta">{wedding.ceremony.time} <span>·</span> {wedding.ceremony.name}</p>

        {t?.done ? (
          <p className="hero-today">Today, we say &ldquo;I do&rdquo;</p>
        ) : (
          <div className="countdown" role="timer" aria-label="Countdown to the wedding">
            {units.map(([label, n]) => (
              <div key={label} className="unit">
                <div className="num" suppressHydrationWarning>{t ? String(n).padStart(2, "0") : "--"}</div>
                <div className="lbl">{label}</div>
              </div>
            ))}
          </div>
        )}

        {rsvpOn && (
          <div className="hero-cta">
            <a className="hero-btn" href="#rsvp">Kindly RSVP</a>
          </div>
        )}
      </div>

      {slides.length > 1 && (
        <div className="hero-dots" aria-hidden>
          {slides.map((_, i) => <i key={i} className={i === slide ? "on" : ""} />)}
        </div>
      )}
    </section>
  );
}
