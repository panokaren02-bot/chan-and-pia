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
const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Bottom sheet on phones, dialog on computers: a ready-to-send personal message + one tap to each chat app. */
export default function ShareInvite({ w, invite, origin, unsaved, onClose }: {
  w: Wedding; invite: Invite; origin: string; unsaved: boolean; onClose: () => void;
}) {
  const url = inviteUrl(origin, invite.name);
  const [msg, setMsg] = useState(() => shareText(w, invite, url));
  const [done, setDone] = useState("");
  const [missing, setMissing] = useState<{ label: string; web?: string }>();
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const flash = (t: string) => { setDone(t); setTimeout(() => setDone(""), 1800); };
  const enc = encodeURIComponent;
  const text = msg.replace(url, "").trim(); // for apps that take the link separately
  const web = (href: string) => window.open(href, "_blank", "noopener");

  /**
   * Opens the chat app itself. On a phone: jump straight into the installed app (its own link scheme); if the
   * page is still showing ~1.6s later the app isn't installed, so offer its web version instead of failing silently.
   * On a computer: the app's web share page (which hands off to the desktop app when it's installed).
   */
  const launch = (label: string, app: string, webUrl?: string) => {
    setMissing(undefined);
    if (!isPhone() && webUrl) return void web(webUrl);
    let left = false;
    const away = () => { left = true; };
    const onVis = () => { if (document.hidden) away(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", away);
    window.addEventListener("blur", away);
    window.location.href = app;
    setTimeout(() => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", away);
      window.removeEventListener("blur", away);
      if (!left) setMissing({ label, web: webUrl });
    }, 1600);
  };
  const copyThen = async (id: string, go: () => void) => { await copy(msg); flash(id); go(); };
  const shareSheet = () => navigator.share({ text: msg }).catch(() => {});

  // one tap opens the app with the message ready; apps that can't take text get it copied first, to paste
  const actions: { id: string; label: string; icon: IconName; run: () => void; hide?: boolean }[] = [
    { id: "messenger", label: "Messenger", icon: "messenger", run: () => copyThen("messenger", () =>
      launch("Messenger", `fb-messenger://share/?link=${enc(url)}`, "https://www.messenger.com/")) },
    { id: "viber", label: "Viber", icon: "viber", run: () => launch("Viber", `viber://forward?text=${enc(msg)}`) },
    { id: "whatsapp", label: "WhatsApp", icon: "whatsapp", run: () =>
      launch("WhatsApp", `whatsapp://send?text=${enc(msg)}`, `https://wa.me/?text=${enc(msg)}`) },
    { id: "telegram", label: "Telegram", icon: "telegram", run: () =>
      launch("Telegram", `tg://msg_url?url=${enc(url)}&text=${enc(text)}`, `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`) },
    { id: "instagram", label: "Instagram", icon: "instagram", run: () => copyThen("instagram", () =>
      launch("Instagram", "instagram://direct-inbox", "https://www.instagram.com/direct/inbox/")) },
    { id: "email", label: "Email", icon: "mail", run: () =>
      void (window.location.href = `mailto:?subject=${enc(`A special question from ${w.groom} & ${w.bride}`)}&body=${enc(msg)}`) },
    { id: "sms", label: "Text message", icon: "phone", run: () => void (window.location.href = `sms:${isIOS() ? "&" : "?"}body=${enc(msg)}`) },
    { id: "share", label: "More apps", icon: "more", hide: !canShare, run: shareSheet },
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

        <div className="db-share-main">
          {canShare && isPhone() && (
            <button className="db-share-copy" onClick={shareSheet}><Icon name="share" size={18} />Share to an app</button>
          )}
          <button className={`db-share-copy ${canShare && isPhone() ? "is-alt" : ""}`} onClick={async () => { if (await copy(msg)) flash("copy"); }}>
            <Icon name={done === "copy" ? "check" : "copy"} size={18} />{done === "copy" ? "Message copied" : "Copy message"}
          </button>
        </div>

        <div className="db-share-apps">
          <span className="db-label">Send with</span>
          <div className="db-share-grid">
            {actions.filter((a) => !a.hide).map((a) => (
              <button key={a.id} className={`db-share-btn db-share-${a.id}`} onClick={a.run}>
                <i className="db-share-ic"><Icon name={done === a.id ? "check" : a.icon} size={22} /></i>
                <span>{done === a.id ? "Copied, paste it" : a.label}</span>
              </button>
            ))}
          </div>
          {missing && (
            <p className="db-share-miss" role="status">
              <Icon name="alert" size={16} />
              <span>{missing.label} didn’t open. Is it installed on this phone?</span>
              {missing.web && <button className="db-btn" onClick={() => { web(missing.web!); setMissing(undefined); }}>Use the web</button>}
            </p>
          )}
          <small className="db-hint">Tapping an app opens it with the message ready: just pick {invite.nickname || "them"} and send. Messenger and Instagram can’t receive text directly, so the message is copied first; paste it in the chat.</small>
        </div>

        <a className="db-btn db-btn-ghost db-share-preview" href={url} target="_blank" rel="noopener noreferrer"><Icon name="eye" size={16} />Preview what they’ll see</a>
      </div>
    </div>
  );
}
