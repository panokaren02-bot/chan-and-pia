"use client";
import { useEffect, useState } from "react";
import { findInvite, type Wedding } from "@/lib/wedding";
import { useWedding } from "./WeddingProvider";
import Monogram from "./Monogram";

type Invite = Wedding["invites"][number];

// Shown only when the URL has ?to=<slug>, e.g. /?to=orlando-balbuena
export default function PersonalLetter() {
  const wedding = useWedding();
  const [invite, setInvite] = useState<Invite>();
  useEffect(() => {
    const found = findInvite(wedding, new URLSearchParams(window.location.search).get("to"));
    setInvite(found);
    if (found) window.dispatchEvent(new CustomEvent("invite:guest", { detail: found }));
  }, []);
  if (!invite) return null;

  return (
    <section id="letter" className="section sec-ivory grain">
      <div className="letter reveal in">
        <Monogram />
        <p className="letter-hello">Hello, {invite.nickname}.</p>
        {wedding.letter.lines.map((l, i) => <p key={i} className={i === 0 ? "letter-big" : ""}>{l}</p>)}
        <p className="letter-ask">Will you be <em>{invite.role}</em>?</p>
        <p className="letter-sign">{wedding.letter.signoff}<br /><span>{wedding.groom} &amp; {wedding.bride}</span></p>
      </div>
    </section>
  );
}
