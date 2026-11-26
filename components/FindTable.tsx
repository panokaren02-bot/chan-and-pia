"use client";
import { useEffect, useRef, useState } from "react";
import { useWedding } from "./WeddingProvider";
import Monogram from "./Monogram";

type Match = { name: string; table: string; guests: number };

/** "Find your table": a guest types their name and sees their reception table, big and clear. */
export default function FindTable() {
  const w = useWedding();
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "err">("idle");
  const [matches, setMatches] = useState<Match[]>([]);
  const [err, setErr] = useState("");
  const seq = useRef(0);

  // look up as they type (a short pause first), keeping only the newest answer
  useEffect(() => {
    const term = q.trim();
    if (term.replace(/\s+/g, "").length < 3) { setState("idle"); setMatches([]); return; }
    const id = ++seq.current;
    setState("loading");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/table?q=${encodeURIComponent(term)}`, { cache: "no-store" });
        const data = await res.json();
        if (id !== seq.current) return;
        if (!data.ok) throw new Error(data.error);
        setMatches(data.matches); setState("done");
      } catch (e) {
        if (id !== seq.current) return;
        setErr(e instanceof Error && e.message ? e.message : "We couldn’t look that up. Please ask an usher."); setState("err");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const one = state === "done" && matches.length === 1 ? matches[0] : null;

  return (
    <main className="ft">
      <div className="ft-card">
        <span className="ft-frame" aria-hidden />
        <Monogram />
        <p className="ft-eyebrow">Welcome to our celebration</p>
        <h1 className="ft-title">Find your table</h1>
        <p className="ft-lead">Type your name as you wrote it on your RSVP.</p>

        <label className="ft-search">
          <span className="sr-only">Your name</span>
          <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Maria Santos" autoComplete="name"
            autoCapitalize="words" enterKeyHint="search" spellCheck={false} autoFocus />
          {q && <button type="button" className="ft-clear" onClick={() => setQ("")} aria-label="Clear">×</button>}
        </label>

        <div className="ft-results" aria-live="polite">
          {state === "loading" && <p className="ft-hint">Looking for you…</p>}
          {state === "err" && <p className="ft-hint ft-err">{err}</p>}
          {state === "done" && !matches.length && (
            <p className="ft-hint">We couldn’t find that name. Try your first or last name only, or ask one of our ushers.</p>
          )}

          {one ? (
            <div className="ft-one">
              <p className="ft-hello">Hello, {one.name.split(/\s+/)[0]}!</p>
              {one.table ? (
                <>
                  <p className="ft-label">Your table</p>
                  <p className="ft-table">{one.table}</p>
                  {one.guests > 1 && <p className="ft-party">Party of {one.guests}</p>}
                </>
              ) : <p className="ft-hint">Your seat is still being arranged. Please ask one of our ushers.</p>}
            </div>
          ) : state === "done" && matches.length > 1 && (
            <ul className="ft-list">
              {matches.map((m) => (
                <li key={m.name}>
                  <span className="ft-name">{m.name}{m.guests > 1 && <small>Party of {m.guests}</small>}</span>
                  <b className={m.table ? "" : "ft-tbd"}>{m.table || "Ask an usher"}</b>
                </li>
              ))}
            </ul>
          )}
        </div>

        {w.seating?.note && <p className="ft-note">{w.seating.note}</p>}
        <p className="ft-sign">{w.groom} <span>&amp;</span> {w.bride}</p>
      </div>
    </main>
  );
}
