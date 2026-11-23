"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWedding } from "./WeddingProvider";
import { findInvite } from "@/lib/wedding";
import Photo from "./Photo";
import Monogram from "./Monogram";
import { IconArrow } from "./Icons";

type Status = "idle" | "sending" | "done" | "error";
const MAX_MSG = 500;

/** Other sections can open the form with: window.dispatchEvent(new Event("open-rsvp")) */
export const openRsvp = () => window.dispatchEvent(new Event("open-rsvp"));

export default function Rsvp() {
  const wedding = useWedding();
  const { deadline, message, maxGuests } = wedding.rsvp;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const end = Date.parse(`${deadline} 23:59:59`);
    if (!Number.isNaN(end)) setDaysLeft(Math.max(-1, Math.floor((end - Date.now()) / 86400000)));
    const onOpen = () => setOpen(true);
    window.addEventListener("open-rsvp", onOpen);
    return () => window.removeEventListener("open-rsvp", onOpen);
  }, [deadline]);

  return (
    <section id="rsvp" className="rsvp">
      <div className="bg-photo kenburns"><Photo name="rsvp" alt="" /></div>
      <div className="shade" />
      <div className="rsvp-panel reveal">
        <Monogram />
        <p className="rsvp-script">Will you join us?</p>
        <h2 className="rsvp-title">RSVP</h2>
        <div className="rsvp-deadline">
          <span>Kindly reply by</span>
          <strong>{deadline}</strong>
          {daysLeft !== null && daysLeft >= 0 && <small>{daysLeft === 0 ? "Today is the last day" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left to respond`}</small>}
        </div>
        <p className="rsvp-text">{message}</p>
        <button className="rsvp-btn" onClick={() => setOpen(true)}>
          <span>Respond Now</span> <IconArrow />
        </button>
      </div>

      {mounted && open && createPortal(
        <RsvpModal deadline={deadline} maxGuests={maxGuests} onClose={() => setOpen(false)}
          defaultName={findInvite(wedding, new URLSearchParams(window.location.search).get("to"))?.name ?? ""} />,
        document.body
      )}
    </section>
  );
}

function RsvpModal({ deadline, maxGuests, defaultName, onClose }: { deadline: string; maxGuests: number; defaultName: string; onClose: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState(defaultName);
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [guests, setGuests] = useState(1);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.classList.add("locked");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    if (!defaultName) setTimeout(() => first.current?.focus({ preventScroll: true }), 350);
    return () => { document.body.classList.remove("locked"); window.removeEventListener("keydown", onKey); };
  }, [onClose, defaultName]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setErr("Please enter your name.");
    if (!attending) return setErr("Please let us know if you can attend.");
    if (msg.trim().length < 3) return setErr("Please leave a short message for the couple.");
    setErr("");
    setStatus("sending");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), attending, guests: attending === "yes" ? guests : 0, message: msg.trim(),
          guestLink: new URLSearchParams(window.location.search).get("to") ?? "",
        }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) throw new Error(data.error || `RSVP failed (${res.status})`);
      setStatus("done");
      if (msg.trim()) window.dispatchEvent(new Event("wishes-refresh"));
    } catch (ex) {
      console.error(ex);
      setStatus("error");
    }
  }

  const seeWishes = () => { onClose(); setTimeout(() => document.getElementById("wishes")?.scrollIntoView({ behavior: "smooth" }), 50); };

  return (
    <div className="rm" role="dialog" aria-modal="true" aria-labelledby="rm-title" onClick={onClose}>
      <div className="rm-card" onClick={(e) => e.stopPropagation()}>
        <span className="rm-frame" aria-hidden />
        <button className="rm-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>

        {status === "done" ? (
          <div className="rm-done">
            <div className="rm-seal"><Monogram /></div>
            <h3 className="rm-title">Thank you{name ? `, ${name.trim().split(/\s+/)[0]}` : ""}!</h3>
            <p className="rm-lead">
              {attending === "yes" ? "Your seat is saved. We can’t wait to celebrate with you." : "You’ll be missed. Thank you for letting us know."}
            </p>
            {msg.trim() && <button className="rm-link" onClick={seeWishes}>See your wish on our wall →</button>}
            <button className="rm-submit" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <header className="rm-head">
              <Monogram />
              <h3 id="rm-title" className="rm-title">Will you join us?</h3>
              <p className="rm-eyebrow">Kindly reply by {deadline}</p>
            </header>

            <div className="rm-body">
              <label className="rm-field">
                <span className="rm-label">Full name</span>
                <input ref={first} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="e.g. Juan Dela Cruz" maxLength={120} />
              </label>

              <fieldset className="rm-field">
                <legend className="rm-label">Will you attend?</legend>
                <div className="rm-choices">
                  {([["yes", "Joyfully accept"], ["no", "Regretfully decline"]] as const).map(([v, t]) => (
                    <button key={v} type="button" className={`rm-choice ${attending === v ? "on" : ""}`} aria-pressed={attending === v} onClick={() => setAttending(v)}>
                      <span className="rm-radio" aria-hidden />
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {attending === "yes" && maxGuests > 1 && (
                <div className="rm-field rm-guests">
                  <span className="rm-label">Guests <em>(including you, up to {maxGuests})</em></span>
                  <div className="rm-stepper">
                    <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} aria-label="Fewer guests">−</button>
                    <output aria-live="polite">{guests}</output>
                    <button type="button" onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))} disabled={guests >= maxGuests} aria-label="More guests">+</button>
                  </div>
                </div>
              )}

              <label className="rm-field">
                <span className="rm-label">A message for the couple</span>
                <textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, MAX_MSG))} rows={3} required placeholder="Share a blessing, a memory or a few kind words…" />
                <small className="rm-hint rm-count"><span>Shared on our wishes wall</span><span>{msg.length}/{MAX_MSG}</span></small>
              </label>

              {err && <p className="rm-err" role="alert">{err}</p>}
              {status === "error" && <p className="rm-err" role="alert">Sorry, we couldn&apos;t send your RSVP. Please try again or message the couple directly.</p>}
            </div>

            <footer className="rm-foot">
              <button className="rm-submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send RSVP"}</button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
