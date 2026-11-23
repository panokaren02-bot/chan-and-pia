"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWedding } from "./WeddingProvider";

type Wish = { id: string; name: string; message: string };

const WORD_MS = 70;     // stagger between words as they appear
const OUT_MS = 900;     // dissolve before the next wish
// Time on screen: at least 10 s, plus reading time for longer wishes (~3.3 words/s), capped at 22 s.
const durationFor = (message: string) => {
  const words = message.split(/\s+/).filter(Boolean).length;
  return Math.round(Math.min(22000, Math.max(10000, 2500 + words * WORD_MS + words * 300)));
};

const initials = (name: string) => name.replace(/[^A-Za-z\s]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "♡";
const excerpt = (m: string, n = 64) => (m.length > n ? m.slice(0, m.lastIndexOf(" ", n) > 30 ? m.lastIndexOf(" ", n) : n) + "…" : m);

/** One wish at a time, written in word by word, over columns of wish cards rising in soft focus. */
export default function Wishes() {
  const wedding = useWedding();
  const [wishes, setWishes] = useState<Wish[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/wishes", { cache: "no-store" });
      const data = await res.json();
      setWishes(Array.isArray(data.wishes) ? data.wishes : []);
    } catch { setWishes([]); }
  }, []);

  useEffect(() => {
    load();
    const onRefresh = () => setTimeout(load, 800);
    window.addEventListener("wishes-refresh", onRefresh);
    return () => window.removeEventListener("wishes-refresh", onRefresh);
  }, [load]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const n = wishes?.length ?? 0;

  const current = n ? wishes![idx % n] : null;
  const dur = current ? durationFor(current.message) : 10000;

  // hold each wish for its reading time, dissolve it, then write in the next
  useEffect(() => {
    if (!visible || n < 2) return;
    let t2: ReturnType<typeof setTimeout>;
    const t1 = setTimeout(() => {
      setPhase("out");
      t2 = setTimeout(() => { setIdx((i) => (i + 1) % n); setPhase("in"); }, OUT_MS);
    }, dur - OUT_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible, n, idx, dur]);

  // hidden until there is at least one wish (and when switched off in the dashboard)
  if (wedding.rsvp.showWishes === false || !n) return <section id="wishes" ref={ref} hidden />;

  const words = current ? current.message.split(/\s+/) : [];
  const size = !current ? "" : current.message.length > 220 ? "is-long" : current.message.length > 110 ? "is-mid" : "";
  // background: columns of wish cards rising slowly; repeated so each column is always full
  const all = wishes ?? [];
  const pool = Array.from({ length: Math.max(1, Math.ceil(8 / all.length)) }).flatMap(() => all);
  const cols = [0, 1, 2, 3].map((c) => { const k = (c * 3) % pool.length; return pool.slice(k).concat(pool.slice(0, k)).slice(0, 6); });

  return (
    <section id="wishes" ref={ref} className={`wishes ${visible ? "is-visible" : ""}`}>
      <div className="wd-cols" aria-hidden>
        {cols.map((col, c) => (
          <div key={c} className={`wd-col wd-col-${c}`}>
            <div className="wd-rise">
              {[0, 1].map((dup) => (
                <div key={dup} className="wd-set">
                  {col.map((w, i) => (
                    <div key={`${dup}-${i}`} className="wd-card">
                      <span className="wd-avatar">{initials(w.name)}</span>
                      <p>{excerpt(w.message, 120)}</p>
                      <b>{w.name}</b>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="wishes-veil" aria-hidden />
      <div className="wishes-glow" aria-hidden />

      <div className="wishes-inner">
        <header className="wishes-head">
          <p className="wishes-eyebrow">Wishes for {wedding.groom} &amp; {wedding.bride}</p>
          <h2 className="wishes-title">Love Notes</h2>
          <p className="wishes-count">{n} {n === 1 ? "wish" : "wishes"} and counting</p>
        </header>

        <div className="wish-stage">
          {current ? (
            <figure key={current.id + idx} className={`wish ${phase === "out" ? "is-out" : ""} ${size}`} aria-live="polite">
              <span className="wish-mark" aria-hidden>&ldquo;</span>
              <blockquote className="wish-text">
                {words.map((w, i) => <span key={i} className="wish-word" style={{ animationDelay: `${200 + i * WORD_MS}ms` }}>{w}{" "}</span>)}
              </blockquote>
              <figcaption className="wish-name" style={{ animationDelay: `${350 + words.length * WORD_MS}ms` }}>
                <span className="wish-seal" aria-hidden>
                  {n > 1 && visible && (
                    <svg key={`${idx}-${String(visible)}`} viewBox="0 0 48 48"><circle className="ring-bg" cx="24" cy="24" r="22.5" /><circle className="ring" cx="24" cy="24" r="22.5" pathLength={1} style={{ animationDuration: `${dur}ms` }} /></svg>
                  )}
                  <b>{initials(current.name)}</b>
                </span>
                <span className="wish-who">{current.name}</span>
              </figcaption>
            </figure>
          ) : null}
        </div>
      </div>
    </section>
  );
}
