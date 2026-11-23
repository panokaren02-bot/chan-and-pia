"use client";
import { useEffect, useRef, useState } from "react";
import { findInvite } from "@/lib/wedding";
import { weekdayOf } from "@/lib/date";
import { useWedding } from "./WeddingProvider";
import Monogram from "./Monogram";
import IntroScene, { type Stage } from "./IntroScene";

const sections = [
  ["Home", "home"], ["Save the Date", "save-the-date"], ["Ceremony & Reception", "details"],
  ["Dress Code", "dress-code"], ["Entourage", "entourage"], ["Gallery", "gallery"],
  ["RSVP", "rsvp"], ["Reminders", "reminders"], ["Gifts", "gifts"],
] as const;


export default function Opening() {
  const wedding = useWedding();
  const weekday = weekdayOf(wedding);
  const [stage, setStage] = useState<Stage>("closed");
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const [, setPlaying] = useState(false);
  const [guest, setGuest] = useState<string>();
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setGuest(findInvite(wedding, new URLSearchParams(window.location.search).get("to"))?.nickname);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("locked", stage !== "open" || menu);
  }, [stage, menu]);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, next: Stage) => timers.current.push(setTimeout(() => setStage(next), ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const open = () => {
    if (stage !== "closed") return;
    window.scrollTo({ top: 0 });
    startMusic();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage("leaving");
      later(500, "open");
      return;
    }
    // seal cracks + flap opens → card is pulled out → card lifts to the front → fade into the site
    setStage("opening");
    later(1150, "rising");
    later(2950, "lifted");
    later(5600, "leaving");
    later(6500, "open");
  };

  // tapping while the card is held up skips straight into the site
  const skip = () => {
    if (stage !== "lifted") return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStage("leaving");
    later(900, "open");
  };

  // The envelope tap starts the song (browsers only allow sound after a tap). If that is blocked,
  // the next tap or key press anywhere starts it. It then loops for as long as the page is open.
  const userPaused = useRef(false);
  const startMusic = () => {
    const a = audio.current;
    if (!a || userPaused.current) return;
    a.volume = 0.7;
    a.play().then(() => setPlaying(true)).catch(() => {
      const retry = () => { if (!userPaused.current) a.play().then(() => setPlaying(true)).catch(() => {}); };
      window.addEventListener("pointerdown", retry, { once: true });
      window.addEventListener("keydown", retry, { once: true });
    });
  };


  return (
    <>
      {/* ── Opening scene ── */}
      {stage !== "open" && <IntroScene stage={stage} guest={guest} onOpen={open} onSkip={skip} />}

      {/* ── Nav ── */}
      <header className={`nav ${solid ? "solid" : ""} ${menu ? "menu-open" : ""}`}>
        <a href="#home" className="brand" onClick={() => setMenu(false)}><Monogram /></a>
        <div className="nav-right">
          <a href="#rsvp" className="nav-rsvp" onClick={() => setMenu(false)}>RSVP</a>
          <button className={`burger ${menu ? "open" : ""}`} onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      <nav className={`menu ${menu ? "open" : ""}`} aria-hidden={!menu}>
        <div className="menu-photo">
          <img src={wedding.photos.slots.hero.d ?? wedding.photos.slots.hero.m} alt="" />
          <div className="menu-photo-cap">
            <Monogram />
            <span>{wedding.dateLabel}</span>
          </div>
        </div>
        <div className="menu-panel">
          <p className="menu-eyebrow">The Wedding of {wedding.groom} &amp; {wedding.bride}</p>
          <ol>
            {sections.map(([label, id], i) => (
              <li key={id} style={{ transitionDelay: menu ? `${0.15 + i * 0.05}s` : "0s" }}>
                <a href={`#${id}`} onClick={() => setMenu(false)} tabIndex={menu ? 0 : -1}>
                  <span className="mn-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mn-label">{label}</span>
                </a>
              </li>
            ))}
          </ol>
          <div className="menu-foot">
            <span>{wedding.ceremony.name}</span>
            <span>{weekday}, {wedding.dateLabel} · {wedding.ceremony.time}</span>
          </div>
        </div>
      </nav>

      {/* ── Background music (only if configured) ── */}
      {wedding.music && (
        <>
          {/* no on-screen control: the song plays and loops in the background */}
          <audio ref={audio} src={wedding.music} loop preload="metadata" playsInline onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
        </>
      )}
    </>
  );
}
