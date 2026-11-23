"use client";
import { useEffect, useState } from "react";
import { slugify } from "@/lib/wedding";
import { useWedding } from "./WeddingProvider";
import { useToast, copyText } from "./useToast";
import { IconCopy } from "./Icons";

// Private helper page: one personal link per entourage member, ready to send.
export default function InviteLinks() {
  const wedding = useWedding();
  const [origin, setOrigin] = useState("");
  const toast = useToast();
  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <main className="section sec-ivory" style={{ minHeight: "100vh" }}>
      <div className="narrow">
        <header className="sec-head">
          <p className="eyebrow">For the Couple</p>
          <h1 className="title">Personal Invite Links</h1>
          <div className="rule" />
        </header>
        <ul className="invite-list">
          {wedding.invites.map((i) => {
            const url = `${origin}/?to=${slugify(i.name)}`;
            return (
              <li key={i.name}>
                <div>
                  <div className="il-name">{i.nickname} <span>· {i.name}</span></div>
                  <div className="il-role">{i.role}</div>
                </div>
                <div className="il-actions">
                  <a className="btn btn-outline btn-sm" href={url} target="_blank" rel="noopener noreferrer">View</a>
                  <button className="btn btn-outline btn-sm" onClick={async () => (await copyText(url)) && toast.show(`Link for ${i.nickname} copied`)}><IconCopy /> Copy</button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {toast.node}
    </main>
  );
}
