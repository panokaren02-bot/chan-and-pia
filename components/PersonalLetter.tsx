"use client";
import { useEffect, useState } from "react";
import { findInvite, slugify, type Invite, type Wedding } from "@/lib/wedding";
import { slotOf, statusOf, type Group } from "@/lib/entourage";
import { useWedding } from "./WeddingProvider";
import Monogram from "./Monogram";
import LetterMessage from "./LetterMessage";

type NoteKey = keyof Wedding["letter"]["notes"];
const NOTE_FOR: Record<Group, NoteKey> = {
  ninongs: "sponsors", ninangs: "sponsors", bestMan: "honor", maidOfHonor: "honor",
  groomSquad: "squad", brideSquad: "squad", bearers: "little", flowerGirls: "little", custom: "special",
};

// Shown only when the URL has ?to=<slug>, e.g. /?to=orlando-balbuena
export default function PersonalLetter() {
  const wedding = useWedding();
  const [invite, setInvite] = useState<Invite>();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<"approved" | "declined">();
  const [err, setErr] = useState("");
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  useEffect(() => {
    const found = findInvite(wedding, new URLSearchParams(window.location.search).get("to"));
    setInvite(found);
    if (!found) return;
    // a personal invite is answered right here, so the RSVP form (and links to it) are hidden
    document.documentElement.classList.add("is-invite");
    window.dispatchEvent(new CustomEvent("invite:guest", { detail: found }));
    return () => document.documentElement.classList.remove("is-invite");
  }, []);
  if (!invite) return null;

  const nick = invite.nickname.trim() || invite.name.trim().split(/\s+/)[0];
  const status = statusOf(invite);
  const slot = slotOf(invite.role, wedding.customRoles);
  const note = slot ? wedding.letter.notes?.[NOTE_FOR[slot.group]]?.replace(/\{nickname\}/g, nick) : "";
  const showDress = !(wedding.layout?.hidden ?? []).includes("dresscode");

  const answer = async (a: "approved" | "declined") => {
    setBusy(true); setSaving(a); setErr("");
    try {
      const res = await fetch("/api/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: slugify(invite.name), answer: a }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "We couldn’t save your answer. Please try again.");
      setInvite({ ...invite, status: a, respondedAt: data.respondedAt });
      // a yes: invite them to leave a few words for the couple (once the thank-you has settled in)
      if (a === "approved" && !msgSent) setTimeout(() => setMsgOpen(true), 1100);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "We couldn’t save your answer. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="letter" className="section sec-ivory grain">
      <article className="letter reveal in">
        <Monogram />
        <p className="letter-hello">Dear {nick},</p>
        {wedding.letter.lines.map((l, i) => <p key={i} className={i === 0 ? "letter-big" : ""}>{l}</p>)}
        {note && <p className="letter-note">{note}</p>}

        <div className={`letter-question is-${status}`}>
          {status === "pending" && (
            <p className="letter-ask">
              Will you be <em>{invite.role}</em>?
            </p>
          )}

          <div className="letter-reply" aria-live="polite">
            {status === "pending" && (
              <div className="letter-actions">
                <button className="btn btn-gold" disabled={busy} onClick={() => answer("approved")}>{busy && saving === "approved" ? "Saving…" : "Yes, I’d be honored"}</button>
                <button className="btn btn-outline" disabled={busy} onClick={() => answer("declined")}>{busy && saving === "declined" ? "Saving…" : "Sorry, I can’t"}</button>
              </div>
            )}

            {status === "approved" && (
              <div className="letter-thanks">
                <p className="letter-answer">Thank you, {nick}! You just made our day.</p>
                <p>{slot ? "Your name is now part of our entourage, and we’ve" : "We’ve"} added you to our guest list, so there’s no need to RSVP separately.</p>
                <p>We’ll see you on <b>{wedding.dateLabel}</b> at {wedding.ceremony.name}.</p>
                {msgSent
                  ? <p className="letter-sent">✓ Your message is on its way to {wedding.groom} &amp; {wedding.bride}.</p>
                  : <button className="btn btn-gold btn-sm" onClick={() => setMsgOpen(true)}>Leave a message for the couple</button>}
                {showDress && slot && <a className="btn btn-outline btn-sm" href="#dresscode">See what to wear</a>}
                <button className="letter-change" disabled={busy} onClick={() => answer("declined")}>Can’t make it after all?</button>
              </div>
            )}

            {status === "declined" && (
              <div className="letter-thanks">
                <p className="letter-answer">We understand, {nick}.</p>
                <p>Thank you for letting us know. You will always be part of our story.</p>
                <div className="letter-encourage">
                  {msgSent
                    ? <p className="letter-sent">✓ Your message is on its way to {wedding.groom} &amp; {wedding.bride}.</p>
                    : <>
                        <p>Even if you can’t be there, a few words from you would mean the world to us.</p>
                        <button className="btn btn-gold btn-sm" onClick={() => setMsgOpen(true)}>Send us your wishes</button>
                      </>}
                </div>
                <button className="letter-change" disabled={busy} onClick={() => answer("approved")}>Changed your mind? Say yes</button>
              </div>
            )}
            {err && <p className="letter-err" role="alert">{err}</p>}
          </div>
        </div>

        {msgOpen && <LetterMessage invite={invite} nick={nick} declined={status === "declined"} onClose={() => setMsgOpen(false)} onSent={() => setMsgSent(true)} />}

        <p className="letter-sign">{wedding.letter.signoff}<br /><span>{wedding.groom} &amp; {wedding.bride}</span></p>
      </article>
    </section>
  );
}
