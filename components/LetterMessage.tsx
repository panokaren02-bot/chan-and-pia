"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { slugify, type Invite } from "@/lib/wedding";
import { useHiddenSections, useWedding } from "./WeddingProvider";
import Monogram from "./Monogram";

const MAX_MSG = 500;

/** Opens after someone says yes on their personal letter: a nudge to leave a few words for the couple. */
export default function LetterMessage({ invite, nick, onClose, onSent }: {
  invite: Invite; nick: string; onClose: () => void; onSent: () => void;
}) {
  const wedding = useWedding();
  const wallOn = !useHiddenSections().includes("wishes") && wedding.rsvp.showWishes !== false;
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.body.classList.add("locked");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => box.current?.focus({ preventScroll: true }), 400);
    return () => { clearTimeout(t); document.body.classList.remove("locked"); window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (msg.trim().length < 3) return setErr("Please write a few words for the couple.");
    setErr(""); setState("sending");
    try {
      const res = await fetch("/api/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: slugify(invite.name), message: msg.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "We couldn’t send your message. Please try again.");
      setState("done");
      onSent();
      window.dispatchEvent(new Event("wishes-refresh"));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "We couldn’t send your message. Please try again.");
      setState("idle");
    }
  }

  const seeWall = () => { onClose(); setTimeout(() => document.getElementById("wishes")?.scrollIntoView({ behavior: "smooth" }), 50); };

  return createPortal(
    <div className="rm" role="dialog" aria-modal="true" aria-labelledby="lm-title" onClick={onClose}>
      <div className="rm-card" onClick={(e) => e.stopPropagation()}>
        <span className="rm-frame" aria-hidden />
        <button className="rm-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>

        {state === "done" ? (
          <div className="rm-done">
            <div className="rm-seal"><Monogram /></div>
            <h3 className="rm-title">Thank you, {nick}!</h3>
            <p className="rm-lead">{wedding.groom} &amp; {wedding.bride} will treasure your message.{wallOn ? " It’s now on our wishes wall." : ""}</p>
            {wallOn && <button className="rm-link" onClick={seeWall}>See it on the wishes wall →</button>}
            <button className="rm-submit" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={send} noValidate>
            <header className="rm-head">
              <Monogram />
              <h3 id="lm-title" className="rm-title">A note for {wedding.groom} &amp; {wedding.bride}?</h3>
              <p className="rm-eyebrow">You’re on our guest list</p>
            </header>
            <div className="rm-body">
              <p className="lm-lead">
                Thank you for saying yes, {nick}! While you’re here, would you leave a few words for the couple?
                A blessing, a favorite memory, or a bit of marriage advice will do.
              </p>
              <label className="rm-field">
                <span className="rm-label">Your message</span>
                <textarea ref={box} value={msg} onChange={(e) => setMsg(e.target.value.slice(0, MAX_MSG))} rows={4}
                  placeholder={`Congratulations, ${wedding.groom} & ${wedding.bride}! …`} />
                <small className="rm-hint rm-count"><span>{wallOn ? "Shared on our wishes wall" : "Sent to the couple"}</span><span>{msg.length}/{MAX_MSG}</span></small>
              </label>
              {err && <p className="rm-err" role="alert">{err}</p>}
            </div>
            <footer className="rm-foot lm-foot">
              <button className="rm-submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send my message"}</button>
              <button type="button" className="rm-link lm-later" onClick={onClose}>Maybe later</button>
            </footer>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
