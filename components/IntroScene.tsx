"use client";
import { useLayoutEffect, useRef } from "react";
import { useWedding } from "./WeddingProvider";
import { weekdayOf } from "@/lib/date";
import Monogram from "./Monogram";

export type Stage = "closed" | "opening" | "rising" | "lifted" | "leaving" | "open";

// Card geometry, in envelope heights (H). Keep in sync with .env-card-wrap / .env-card in globals.css.
const CARD_TOP = 0.04;   // card's top edge sits just inside the envelope
const CARD_H = 1.85;     // card is taller than the envelope (the rest is hidden in the pocket)
const RISE = 1.45;       // how far it is pulled out — its bottom stays tucked inside

// Deterministic "random" gold dust (same on server and client → no hydration mismatch)
const rand = (i: number, n: number) => { const x = Math.sin(i * 91.37 + n * 12.9) * 43758.5453; return +(x - Math.floor(x)).toFixed(3); };
const dust = Array.from({ length: 26 }, (_, i) => ({
  left: rand(i, 1) * 100, delay: -rand(i, 2) * 18, dur: 12 + rand(i, 3) * 14,
  size: 2 + rand(i, 4) * 3.5, drift: Math.round((rand(i, 5) - 0.5) * 120), op: 0.3 + rand(i, 6) * 0.5,
}));

// Background collage: c1..c12 from scripts/optimize-images.mjs. Positions live in CSS (.c1 … .c12).
const collage: { kind: "pola" | "print"; cap?: string; tape?: "l" | "r" }[] = [
  { kind: "pola", cap: "first chapter" }, { kind: "print", tape: "r" }, { kind: "pola", cap: "you & me" },
  { kind: "print", tape: "l" }, { kind: "pola", cap: "forever" }, { kind: "print" },
  { kind: "pola", cap: "us, always", tape: "l" }, { kind: "pola" }, { kind: "print", tape: "r" },
  { kind: "pola", cap: "♡" }, { kind: "print" }, { kind: "pola", cap: "2027" },
];


export default function IntroScene({ stage, guest, onOpen, onSkip }: { stage: Stage; guest?: string; onOpen: () => void; onSkip: () => void }) {
  const wedding = useWedding();
  const weekday = weekdayOf(wedding);
  const cardPhoto = wedding.photos.slots.card.d ?? wedding.photos.slots.card.m;
  const scene = useRef<HTMLDivElement>(null);
  const envRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLSpanElement>(null);
  const envScale = useRef(1);

  useLayoutEffect(() => {
    const sc = scene.current, env = envRef.current, wrap = wrapRef.current, card = cardRef.current;
    if (!sc || !env || !wrap || !card) return;
    const vw = window.innerWidth, vh = window.innerHeight;

    if (stage === "rising") {
      // fit envelope + pulled-out card on screen: scale down if needed and re-centre
      const r = env.getBoundingClientRect();
      const H = r.height;
      const top = r.top + (CARD_TOP - RISE) * H;
      const bottom = r.bottom + 0.06 * H;
      const s = Math.min(1, (vh * 0.9) / (bottom - top));
      const cy = r.top + H / 2;
      const ty = vh / 2 - cy - ((top + bottom) / 2 - cy) * s;
      envScale.current = s;
      sc.style.setProperty("--rs", s.toFixed(4));
      sc.style.setProperty("--rty", `${ty.toFixed(1)}px`);
    }

    if (stage === "lifted") {
      // bring the card to the centre of the screen, as large as fits
      const c = card.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      const s = envScale.current;
      const k = Math.min((vh * 0.82) / c.height, (vw * 0.9) / c.width);
      const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
      wrap.style.transformOrigin = `${((cx - w.left) / s).toFixed(1)}px ${((cy - w.top) / s).toFixed(1)}px`;
      wrap.style.setProperty("--lx", `${((vw / 2 - cx) / s).toFixed(1)}px`);
      wrap.style.setProperty("--ly", `${((vh * 0.47 - cy) / s).toFixed(1)}px`); // a little above centre, leaving room for the hint
      wrap.style.setProperty("--lk", k.toFixed(4));
    }
  }, [stage]);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !scene.current) return;
    scene.current.style.setProperty("--px", ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
    scene.current.style.setProperty("--py", ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
  };

  return (
    <div ref={scene} className={`intro stage-${stage}`} onPointerMove={onMove} onClick={onSkip}>
      <div className="intro-bg" />

      {/* photo collage on the "table" */}
      <div className="collage" aria-hidden>
        {collage.map((c, i) => (
          <figure key={i} className={`cl ${c.kind} c${i + 1}`} style={{ animationDelay: `${0.05 + i * 0.07}s` }}>
            <img src={wedding.photos.collage[i] ?? `/images/c${i + 1}.webp`} alt="" decoding="async" />
            {c.cap && <figcaption>{c.cap}</figcaption>}
            {c.tape && <span className={`tape tape-${c.tape}`} />}
          </figure>
        ))}
      </div>

      <div className="intro-shade" />
      <div className="intro-linen" />
      <div className="intro-leak" />

      <div className="intro-dust" aria-hidden>
        {dust.map((d, i) => (
          <span key={i} style={{
            left: `${d.left}%`, width: d.size, height: d.size, opacity: d.op,
            animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s`, ["--drift" as string]: `${d.drift}px`,
          }} />
        ))}
      </div>

      <div className="intro-content">
        <header className="intro-head">
          <p className="intro-eyebrow">Together with their families</p>
          <h1 className="intro-names">{wedding.groom} <span className="amp">&amp;</span> {wedding.bride}</h1>
          <p className="intro-date">{weekday} <i /> {wedding.dateLabel}</p>
        </header>

        <button ref={envRef} className="env" onClick={onOpen} aria-label="Open the invitation">
          <span className="env-shadow" />
          <span className="env-back"><EnvelopeLiner id="back" /></span>

          <span ref={wrapRef} className="env-card-wrap">
            <span ref={cardRef} className="env-card">
              <span className="card-foil" />
              <span className="card-foil card-foil-inner" />
              <span className="card-inner">
                <span className="card-arch"><img src={cardPhoto} alt="" /></span>
                <span className="card-eyebrow">Together with their families</span>
                <span className="card-names">
                  <span>{wedding.groomFull}</span>
                  <span className="card-amp">&amp;</span>
                  <span>{wedding.brideFull}</span>
                </span>
                <span className="card-request">request the honour of your presence<br />as they celebrate their marriage</span>
                <span className="card-date">
                  <span>{weekday}</span>
                  <b>{wedding.dateLabel.replace(/,\s*\d{4}$/, "")}</b>
                  <span>{wedding.dateISO.slice(0, 4)}</span>
                </span>
                <span className="card-time">at {wedding.ceremony.time}</span>
                <span className="card-venue">
                  {wedding.ceremony.name}
                  {wedding.ceremony.address && <small>{wedding.ceremony.address}</small>}
                </span>
                <span className="card-recep">Reception to follow at {wedding.reception.name}</span>
                <span className="card-mono"><Monogram /></span>
              </span>
            </span>
          </span>

          <span className="env-pocket">
            <EnvelopeFront />
            <span className="env-to">
              <small>To</small>
              <span>{guest ?? "Our Dearest Family & Friends"}</span>
            </span>
            <span className="env-sheen" />
          </span>

          <span className="env-flap">
            <span className="flap-out"><FlapOuter /></span>
            <span className="flap-in"><FlapInner /></span>
          </span>

          <span className="env-seal">
            <Sprig />
            <span className="seal-pulse" />
            <span className="seal-half seal-l"><SealBody id="l" /></span>
            <span className="seal-half seal-r"><SealBody id="r" /></span>
          </span>
        </button>

        <p className="intro-hint"><span className="hint-dot" /> Tap the seal to open</p>
      </div>

      <p className="intro-skip">Tap anywhere to continue</p>
    </div>
  );
}

/* ───────── envelope artwork (SVG) ───────── */

const PAPER_LIGHT = "#f7f2ea";
const PAPER_MID = "#efe6d8";
const PAPER_DARK = "#e2d6c3";

function PaperDefs({ id }: { id: string }) {
  return (
    <>
      <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="4" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0.09 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <filter id={`fiber-${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.35" numOctaves="2" seed="9" result="f" />
        <feColorMatrix in="f" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
    </>
  );
}

function EnvelopeFront() {
  const left = "M0 3 Q0 0 3 0 L283 205 Q300 218 283 232 L3 414 Q0 414 0 411 Z";
  const right = "M600 3 Q600 0 597 0 L317 205 Q300 218 317 232 L597 414 Q600 414 600 411 Z";
  const bottom = "M0 414 L0 404 C 110 332, 220 252, 286 206 Q300 196 314 206 C 380 252, 490 332, 600 404 L600 414 Z";
  return (
    <svg className="env-svg" viewBox="0 0 600 414" preserveAspectRatio="none" aria-hidden>
      <defs>
        <PaperDefs id="front" />
        <linearGradient id="sideL" x1="0" x2="1">
          <stop offset="0" stopColor={PAPER_MID} /><stop offset=".85" stopColor={PAPER_DARK} />
        </linearGradient>
        <linearGradient id="sideR" x1="1" x2="0">
          <stop offset="0" stopColor={PAPER_MID} /><stop offset=".85" stopColor={PAPER_DARK} />
        </linearGradient>
        <linearGradient id="bottomG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={PAPER_LIGHT} /><stop offset="1" stopColor="#f1e9dd" />
        </linearGradient>
        <filter id="foldShadow" x="-10%" y="-20%" width="120%" height="140%">
          <feDropShadow dx="0" dy="-3" stdDeviation="4" floodColor="#4a2a1c" floodOpacity="0.2" />
        </filter>
        <filter id="sideShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#4a2a1c" floodOpacity="0.14" />
        </filter>
      </defs>
      <path d={left} fill="url(#sideL)" filter="url(#sideShadow)" />
      <path d={right} fill="url(#sideR)" filter="url(#sideShadow)" />
      <path d={bottom} fill="url(#bottomG)" filter="url(#foldShadow)" />
      {/* fold highlight along the bottom flap edge */}
      <path d="M0 404 C 110 332, 220 252, 286 206 Q300 196 314 206 C 380 252, 490 332, 600 404" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" />
      {/* paper grain + fibres over everything */}
      <g opacity="1">
        <path d={left} fill="#fff" filter="url(#grain-front)" />
        <path d={right} fill="#fff" filter="url(#grain-front)" />
        <path d={bottom} fill="#fff" filter="url(#grain-front)" />
        <path d={bottom} fill="#fff" filter="url(#fiber-front)" />
      </g>
    </svg>
  );
}

function FlapOuter() {
  const d = "M0 0 L600 0 L600 5 C 486 88, 368 190, 316 226 Q300 237 284 226 C 232 190, 114 88, 0 5 Z";
  return (
    <svg className="env-svg flap-svg" viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden>
      <defs>
        <PaperDefs id="flap" />
        <linearGradient id="flapG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ece2d3" /><stop offset=".55" stopColor={PAPER_LIGHT} /><stop offset="1" stopColor="#faf6ef" />
        </linearGradient>
        <filter id="flapShadow" x="-5%" y="-5%" width="110%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#3b2015" floodOpacity="0.28" />
        </filter>
      </defs>
      <path d={d} fill="url(#flapG)" filter="url(#flapShadow)" />
      <path d="M0 5 C 114 88, 232 190, 284 226 Q300 237 316 226 C 368 190, 486 88, 600 5" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.4" />
      <path d={d} fill="#fff" filter="url(#grain-flap)" />
    </svg>
  );
}

function FlapInner() {
  const d = "M0 240 L600 240 L600 235 C 486 152, 368 50, 316 14 Q300 3 284 14 C 232 50, 114 152, 0 235 Z";
  return (
    <svg className="env-svg flap-svg" viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden>
      <defs>
        <LinerPattern id="flapin" />
      </defs>
      <path d={d} fill="url(#liner-flapin)" />
      <path d={d} fill="none" stroke="#c5aa83" strokeWidth="3" strokeOpacity=".85" transform="translate(0 -2)" />
    </svg>
  );
}

function LinerPattern({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`linerbg-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6b2738" /><stop offset="1" stopColor="#3f1522" />
      </linearGradient>
      <pattern id={`linerdots-${id}`} width="26" height="26" patternUnits="userSpaceOnUse">
        <path d="M13 6 C 15 10, 16 11, 20 13 C 16 15, 15 16, 13 20 C 11 16, 10 15, 6 13 C 10 11, 11 10, 13 6 Z" fill="#c5aa83" fillOpacity=".38" />
        <circle cx="0" cy="0" r="1.4" fill="#c5aa83" fillOpacity=".45" />
        <circle cx="26" cy="0" r="1.4" fill="#c5aa83" fillOpacity=".45" />
        <circle cx="0" cy="26" r="1.4" fill="#c5aa83" fillOpacity=".45" />
        <circle cx="26" cy="26" r="1.4" fill="#c5aa83" fillOpacity=".45" />
      </pattern>
      <pattern id={`liner-${id}`} width="600" height="414" patternUnits="userSpaceOnUse">
        <rect width="600" height="414" fill={`url(#linerbg-${id})`} />
        <rect width="600" height="414" fill={`url(#linerdots-${id})`} />
      </pattern>
    </>
  );
}

function EnvelopeLiner({ id }: { id: string }) {
  return (
    <svg className="env-svg" viewBox="0 0 600 414" preserveAspectRatio="none" aria-hidden>
      <defs><LinerPattern id={id} /></defs>
      <rect width="600" height="414" rx="6" fill={`url(#liner-${id})`} />
      <rect width="600" height="414" rx="6" fill="none" stroke="#2b0d15" strokeOpacity=".4" strokeWidth="2" />
    </svg>
  );
}

function SealBody({ id }: { id: string }) {
  return (
    <>
      <WaxSeal id={id} />
      <span className="seal-mono seal-mono-shadow"><Monogram /></span>
      <span className="seal-mono seal-mono-light"><Monogram /></span>
      <span className="seal-mono"><Monogram /></span>
    </>
  );
}

function WaxSeal({ id }: { id: string }) {
  return (
    <svg className="seal-svg" viewBox="0 0 120 120" aria-hidden>
      <defs>
        <radialGradient id={`waxG-${id}`} cx="36%" cy="30%" r="75%">
          <stop offset="0" stopColor="#a8455c" /><stop offset=".45" stopColor="#74253a" /><stop offset="1" stopColor="#3e1120" />
        </radialGradient>
        <radialGradient id={`waxInner-${id}`} cx="60%" cy="65%" r="70%">
          <stop offset="0" stopColor="#5a1a2b" /><stop offset="1" stopColor="#7c2a40" />
        </radialGradient>
        <filter id={`waxShadow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1" dy="4" stdDeviation="3.5" floodColor="#1c0509" floodOpacity=".55" />
        </filter>
      </defs>
      {/* irregular poured-wax edge */}
      <path filter={`url(#waxShadow-${id})`} fill={`url(#waxG-${id})`}
        d="M60 4 C 74 3, 82 9, 92 12 C 104 16, 109 26, 113 37 C 118 48, 116 58, 117 68 C 118 82, 111 92, 102 101 C 93 110, 82 115, 68 116 C 55 118, 44 117, 33 111 C 21 105, 12 97, 7 85 C 2 73, 3 62, 4 51 C 5 39, 10 27, 19 19 C 29 10, 44 5, 60 4 Z" />
      {/* stamped recess */}
      <circle cx="60" cy="60" r="38" fill={`url(#waxInner-${id})`} />
      <circle cx="60" cy="60" r="38" fill="none" stroke="#2c0a14" strokeOpacity=".5" strokeWidth="2" />
      <circle cx="60" cy="60" r="40.5" fill="none" stroke="#c46a80" strokeOpacity=".35" strokeWidth="1.5" />
      {/* glossy highlight */}
      <ellipse cx="40" cy="30" rx="16" ry="7" fill="#fff" fillOpacity=".16" transform="rotate(-30 40 30)" />
    </svg>
  );
}

function Sprig() {
  return (
    <svg className="seal-sprig" viewBox="0 0 120 200" aria-hidden>
      <path d="M60 196 C 58 150, 62 100, 52 20" fill="none" stroke="#9c8a63" strokeWidth="2" />
      <path d="M57 120 C 46 100, 40 84, 30 70" fill="none" stroke="#9c8a63" strokeWidth="1.4" />
      <path d="M58 92 C 70 74, 76 62, 88 48" fill="none" stroke="#9c8a63" strokeWidth="1.4" />
      {[[52, 18], [48, 30], [57, 28], [30, 68], [26, 76], [35, 74], [88, 46], [92, 54], [83, 52], [54, 44], [60, 56], [50, 62]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.2 + (i % 3) * 0.8} fill="#f4ecdc" stroke="#d9c9a8" strokeWidth=".8" />
      ))}
      {[[62, 140, 30], [56, 160, -30], [63, 176, 28]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x + (r > 0 ? 9 : -9)} cy={y} rx="11" ry="4.5" transform={`rotate(${r} ${x + (r > 0 ? 9 : -9)} ${y})`} fill="#8f9a78" />
      ))}
    </svg>
  );
}
