"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { slugify, type Invite, type InviteStatus, type Wedding } from "@/lib/wedding";
import { GROUPS, STATUS_LABEL, customRoleFrom, slotOf, statusOf } from "@/lib/entourage";
import { Icon } from "./icons";
import { StatusSelect, autoNickname } from "./EntourageEditor";
import ShareInvite, { copy, inviteUrl } from "./ShareInvite";

type Filter = "all" | InviteStatus;

/** Personal invites as an editable table (cards on phones), with status and one-tap sharing. */
export default function InvitesTable({ w, savedNames, origin, roles, onChange, onAddRole }: {
  w: Wedding; savedNames: Set<string>; origin: string; roles: string[]; onChange: (v: Invite[]) => void;
  onAddRole: (role: { label: string; ask: string }) => void;
}) {
  const slot = (role: string) => slotOf(role, w.customRoles);
  const listId = useId();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sharing, setSharing] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | "all" | null>(null);
  const focusRow = useRef<number | null>(null);
  const tbody = useRef<HTMLTableSectionElement>(null);

  const counts = useMemo(() => {
    const n: Record<Filter, number> = { all: w.invites.length, pending: 0, approved: 0, declined: 0 };
    w.invites.forEach((i) => { n[statusOf(i)]++; });
    return n;
  }, [w.invites]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return w.invites.map((it, i) => ({ it, i })).filter(({ it }) =>
      (filter === "all" || statusOf(it) === filter) &&
      (!needle || [it.name, it.nickname, it.role].some((v) => v.toLowerCase().includes(needle))));
  }, [w.invites, q, filter]);
  const filtered = !!q.trim() || filter !== "all";

  // put the cursor in the name cell of a newly added row
  useEffect(() => {
    if (focusRow.current === null) return;
    tbody.current?.querySelector<HTMLInputElement>(`[data-row="${focusRow.current}"] input`)?.focus();
    focusRow.current = null;
  }, [w.invites.length]);

  const patch = (i: number, p: Partial<Invite>) => onChange(w.invites.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const rename = (i: number, name: string) => {
    const cur = w.invites[i];
    patch(i, { name, nickname: !cur.nickname.trim() || cur.nickname === autoNickname(cur.name) ? autoNickname(name) : cur.nickname });
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= w.invites.length) return;
    const out = [...w.invites];
    [out[i], out[j]] = [out[j], out[i]];
    onChange(out);
  };
  const remove = (i: number) => {
    const n = w.invites[i].name.trim();
    if (n && !window.confirm(`Remove “${n}”?${slot(w.invites[i].role) ? " They’ll also be removed from the entourage." : ""}`)) return;
    onChange(w.invites.filter((_, k) => k !== i));
  };
  const add = () => {
    setQ(""); setFilter("all");
    focusRow.current = w.invites.length;
    onChange([...w.invites, { name: "", nickname: "", role: "", status: "pending", respondedAt: "" }]);
  };
  const flash = (k: number | "all") => { setCopied(k); setTimeout(() => setCopied(null), 1600); };
  const copyAll = async () => {
    const list = rows.filter(({ it }) => it.name.trim()).map(({ it }) => `${it.nickname || it.name} — ${inviteUrl(origin, it.name)}`).join("\n");
    if (list && (await copy(list))) flash("all");
  };

  // CSV in the same columns as the sheet's "Invites" tab (opens in Excel; File → Import in Google Sheets)
  const download = () => {
    const q = (v: unknown) => { const t = String(v ?? ""); return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
    const lines = [["Name", "Nickname", "Role", "Status", "Responded At", "Personal link"]]
      .concat(w.invites.filter((i) => i.name.trim()).map((i) => [i.name, i.nickname, i.role, STATUS_LABEL[statusOf(i)], i.respondedAt ?? "", inviteUrl(origin, i.name)]));
    const blob = new Blob(["\uFEFF" + lines.map((r) => r.map(q).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "invites.csv" }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const groupLabel = (role: string) => {
    const s = slot(role);
    return s ? (s.sub ?? GROUPS.find((g) => g.key === s.group)!.label) : "Guest only";
  };

  return (
    <div className="db-inv">
      <datalist id={listId}>{roles.map((r) => <option key={r} value={r} />)}</datalist>

      <div className="db-inv-bar">
        <div className="db-inv-filter" role="tablist" aria-label="Filter by status">
          {(["all", "pending", "approved", "declined"] as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={`${filter === f ? "on" : ""} db-f-${f}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : STATUS_LABEL[f]}<b>{counts[f]}</b>
            </button>
          ))}
        </div>
        <label className="db-search db-inv-search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Search name, nickname or role…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="db-inv-actions">
          <button className="db-btn db-btn-ghost" onClick={download} disabled={!w.invites.length} title="Download a CSV for Excel or Google Sheets">
            <Icon name="down" size={16} />Download
          </button>
          <button className="db-btn db-btn-ghost" onClick={copyAll} disabled={!rows.length}>
            <Icon name={copied === "all" ? "check" : "copy"} size={16} />{copied === "all" ? "Copied" : filtered ? `Copy ${rows.length} links` : "Copy all links"}
          </button>
          <button className="db-btn db-btn-primary" onClick={add}><Icon name="plus" size={16} />Add person</button>
        </div>
      </div>

      <div className="db-inv-wrap">
        <table className="db-inv-table">
          <thead>
            <tr><th className="db-c-num">#</th><th>Full name</th><th>Nickname</th><th>Role · “Will you be …?”</th><th>Status</th><th className="db-c-share">Link</th><th className="db-c-tools"><span className="db-sr">Actions</span></th></tr>
          </thead>
          <tbody ref={tbody}>
            {rows.map(({ it, i }) => {
              const st = statusOf(it);
              const unsaved = !!it.name.trim() && !savedNames.has(slugify(it.name));
              return (
                <tr key={i} data-row={i} className={`db-st-${st}`}>
                  <td className="db-c-num">{i + 1}</td>
                  <td className="db-c-name">
                    <input value={it.name} placeholder="Full name" aria-label="Full name" onChange={(e) => rename(i, e.target.value)} />
                  </td>
                  <td className="db-c-nick" data-label="Hello,">
                    <input value={it.nickname} placeholder={autoNickname(it.name) || "Nickname"} aria-label="Nickname" onChange={(e) => patch(i, { nickname: e.target.value })} />
                  </td>
                  <td className="db-c-role" data-label="Will you be">
                    <input value={it.role} list={listId} placeholder="our Ninong" aria-label="Role" onChange={(e) => patch(i, { role: e.target.value })} />
                    {slot(it.role) || !it.role.trim() ? <small>{it.role.trim() ? groupLabel(it.role) : "Pick or type a role"}</small> : (
                      <small className="is-guest">
                        Guest only ·{" "}
                        <button type="button" className="db-inv-newrole" onClick={() => onAddRole(customRoleFrom(it.role))}
                          title={`Add “${customRoleFrom(it.role).label}” as a role with its own heading in the Entourage`}>
                          + Make it a new role
                        </button>
                      </small>
                    )}
                  </td>
                  <td className="db-c-status">
                    <StatusSelect value={st} onChange={(s) => patch(i, { status: s, respondedAt: new Date().toISOString() })} />
                    {it.respondedAt && st !== "pending" && (
                      <small>{new Date(it.respondedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small>
                    )}
                  </td>
                  <td className="db-c-share">
                    <div className="db-inv-share">
                      <button className="db-btn db-btn-primary" disabled={!it.name.trim()} onClick={() => setSharing(i)} title={unsaved ? "Save first so this link works" : "Share invite"}>
                        <Icon name="share" size={16} /><span>Share</span>
                      </button>
                      <button className="db-btn db-icon-btn" disabled={!it.name.trim()} aria-label="Copy link" title="Copy link"
                        onClick={async () => { if (await copy(inviteUrl(origin, it.name))) flash(i); }}>
                        <Icon name={copied === i ? "check" : "link"} size={16} />
                      </button>
                    </div>
                    {unsaved && <small className="db-inv-unsaved">Save to activate link</small>}
                  </td>
                  <td className="db-c-tools">
                    <span className="db-rowtools">
                      <button type="button" onClick={() => move(i, -1)} disabled={filtered || i === 0} aria-label="Move up" title="Move up"><Icon name="up" size={16} /></button>
                      <button type="button" onClick={() => move(i, 1)} disabled={filtered || i === w.invites.length - 1} aria-label="Move down" title="Move down"><Icon name="down" size={16} /></button>
                      <button type="button" className="db-danger" onClick={() => remove(i)} aria-label="Remove" title="Remove"><Icon name="trash" size={16} /></button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (w.invites.length ? <p className="db-inv-empty">Nobody matches this filter.</p> : (
          <div className="db-inv-empty">
            <strong>No names yet.</strong>
            <p>Names come from the <b>Invites</b> tab of your Google Sheet (Name, Nickname, Role, Status). Add rows there and reload,
              or add people here and Save.</p>
          </div>
        ))}
      </div>

      {sharing !== null && w.invites[sharing] && (
        <ShareInvite w={w} invite={w.invites[sharing]} origin={origin} onClose={() => setSharing(null)}
          unsaved={!savedNames.has(slugify(w.invites[sharing].name))} />
      )}
    </div>
  );
}
