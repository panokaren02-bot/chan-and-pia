"use client";
import { useEffect, useState } from "react";
import { slugify, type Invite, type Wedding } from "@/lib/wedding";
import { Icon, type IconName } from "./icons";

export const inviteUrl = (origin: string, name: string) => `${origin}/?to=${slugify(name)}`;

export function shareText(w: Wedding, i: Invite, url: string) {
  const tpl = w.letter.shareMessage || "Hi {nickname}! {couple} have a special question for you:\n{link}";
  const vars: Record<string, string> = {
    nickname: i.nickname.trim() || i.name.trim().split(/\s+/)[0] || "",
    name: i.name.trim(), role: i.role, couple: `${w.groom} & ${w.bride}`, link: url,
  };
  const out = tpl.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
  return out.includes(url) ? out : `${out}\n${url}`;
}

export async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { window.prompt("Copy this:", text); return false; }
}

const isPhone = () => typeof navigator !== "undefined" && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

/** Bottom sheet on phones, dialog on computers: a ready-to-send personal message + one tap to each chat app. */
export default function ShareInvite({ w, invite, origin, unsaved, onClose }: {
  w: Wedding; invite: Invite; origin: string; unsaved: boolean; onClose: () => void;
}) {
  const url = inviteUrl(origin, invite.name);
  const [msg, setMsg] = useState(() => shareText(w, invite, url));
  const [done, setDone] = useState("");
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const flash = (t: string) => { setDone(t); setTimeout(() => setDone(""), 1800); };
  const enc = encodeURIComponent;
  const open = (href: string) => { window.location.href = href; };

  const actions: { id: string; label: string; icon: IconName; run: () => void; primary?: boolean; hide?: boolean }[] = [
    { id: "share", label: "Share…", icon: "share", primary: true, hide: !canShare,
      run: () => navigator.share({ text: msg }).catch(() => {}) },
    { id: "copy", label: "Copy message", icon: "copy", primary: !canShare, run: async () => { if (await copy(msg)) flash("copy"); } },
    { id: "messenger", label: "Messenger", icon: "chat", run: async () => {
      // Messenger only accepts a link, so the message is copied first to paste in the chat
      await copy(msg); flash("messenger");
      if (isPhone()) open(`fb-messenger://share/?link=${enc(url)}`);
      else window.open("https://www.messenger.com/", "_blank", "noopener");
    } },
    { id: "viber", label: "Viber", icon: "chat", run: () => open(`viber://forward?text=${enc(msg)}`) },
    { id: "whatsapp", label: "WhatsApp", icon: "chat", run: () => window.open(`https://wa.me/?text=${enc(msg)}`, "_blank", "noopener") },
    { id: "sms", label: "Text message", icon: "phone", run: () => open(`sms:?&body=${enc(msg)}`) },
  ];

  return (
    <div className="db-sheet-wrap db-share-wrap" onClick={onClose}>
      <div className="db-sheet db-share" role="dialog" aria-modal="true" aria-label={`Share invite with ${invite.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="db-sheet-head">
          <div className="db-share-who">
            <strong>Share with {invite.nickname || invite.name}</strong>
            <small>{invite.name}{invite.role ? ` · ${invite.role}` : ""}</small>
          </div>
          <button className="db-btn db-btn-ghost db-icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>

        {unsaved && (
          <p className="db-share-warn"><Icon name="alert" size={16} />Save your changes first. This link only works once the name is saved.</p>
        )}

        <label className="db-field">
          <span className="db-label">Message</span>
          <textarea rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} />
          <small className="db-hint">Edit it here for this person, or change the default in <b>Letter → Share message</b>.</small>
        </label>

        <div className="db-share-link">
          <Icon name="link" size={16} />
          <code>{url.replace(/^https?:\/\//, "")}</code>
          <button className="db-btn" onClick={async () => { if (await copy(url)) flash("link"); }}>
            <Icon name={done === "link" ? "check" : "copy"} size={16} />{done === "link" ? "Copied" : "Copy link"}
          </button>
        </div>

        <div className="db-share-grid">
          {actions.filter((a) => !a.hide).map((a) => (
            <button key={a.id} className={`db-share-btn db-share-${a.id} ${a.primary ? "is-primary" : ""}`} onClick={a.run}>
              <Icon name={done === a.id ? "check" : a.icon} size={20} />
              <span>{done === a.id ? (a.id === "messenger" ? "Copied — paste it" : "Copied") : a.label}</span>
            </button>
          ))}
        </div>

        <a className="db-btn db-btn-ghost db-share-preview" href={url} target="_blank" rel="noopener noreferrer"><Icon name="eye" size={16} />Preview what they’ll see</a>
      </div>
    </div>
  );
}
