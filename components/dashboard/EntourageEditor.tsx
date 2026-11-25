"use client";
import type { Invite, InviteStatus, Wedding } from "@/lib/wedding";
import { BEARER_TYPES, GROUPS, STATUS_LABEL, groupInvites, roleFor, statusOf, type Group, type Member } from "@/lib/entourage";
import { Card, Grid } from "./fields";
import { Icon } from "./icons";

const CARDS: { title: string; groups: Group[] }[] = [
  { title: "Principal sponsors", groups: ["ninongs", "ninangs"] },
  { title: "Best man & maid of honor", groups: ["bestMan", "maidOfHonor"] },
  { title: "Squads", groups: ["groomSquad", "brideSquad"] },
  { title: "Bearers & flower girls", groups: ["bearers", "flowerGirls"] },
];

export const autoNickname = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export function StatusPill({ status }: { status: InviteStatus }) {
  return <span className={`db-pill db-pill-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function StatusSelect({ value, onChange }: { value: InviteStatus; onChange: (s: InviteStatus) => void }) {
  return (
    <select className={`db-status-select db-pill-${value}`} value={value} aria-label="Status" onChange={(e) => onChange(e.target.value as InviteStatus)}>
      {(Object.keys(STATUS_LABEL) as InviteStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
    </select>
  );
}

/** The entourage, grouped by role. Every row is a personal invite: edits here change the invite. */
export default function EntourageEditor({ w, onChange }: { w: Wedding; onChange: (invites: Invite[]) => void }) {
  const groups = groupInvites(w.invites, w.customRoles);
  const patch = (i: number, p: Partial<Invite>) => onChange(w.invites.map((x, k) => (k === i ? { ...x, ...p } : x)));

  const rename = (i: number, name: string) => {
    const cur = w.invites[i];
    const nick = !cur.nickname.trim() || cur.nickname === autoNickname(cur.name) ? autoNickname(name) : cur.nickname;
    patch(i, { name, nickname: nick });
  };
  const swap = (a: number, b: number) => {
    const out = [...w.invites];
    [out[a], out[b]] = [out[b], out[a]];
    onChange(out);
  };
  const remove = (i: number) => {
    const n = w.invites[i].name.trim();
    if (n && !window.confirm(`Remove “${n}” from the entourage? Their personal invite is removed too.`)) return;
    onChange(w.invites.filter((_, k) => k !== i));
  };
  // a new, empty row placed right after the last person in the same list
  const add = (members: Member[], role: string) => {
    const at = members.length ? members[members.length - 1].index + 1 : w.invites.length;
    const out = [...w.invites];
    out.splice(at, 0, { name: "", nickname: "", role, status: "pending", respondedAt: "" });
    onChange(out);
  };

  type List = { key: string; label: string; addLabel: string; members: Member[]; role: string; bearers?: boolean };
  const builtIn = (g: Group): List => {
    const meta = GROUPS.find((x) => x.key === g)!;
    return { key: g, label: meta.label, addLabel: meta.add, members: groups[g], bearers: g === "bearers",
      role: roleFor({ group: g, sub: g === "bearers" ? "Ring Bearer" : undefined }, w) };
  };
  const custom = (w.customRoles ?? []).filter((c) => c.label.trim() || c.ask.trim());
  const cards: { title: string; lists: List[] }[] = [
    ...CARDS.map((c) => ({ title: c.title, lists: c.groups.map(builtIn) })),
    ...(custom.length ? [{ title: "Your own roles", lists: custom.map((c) => {
      const label = c.label.trim() || c.ask.trim();
      return { key: `custom:${label}`, label, addLabel: `Add to ${label.toLowerCase()}`, members: groups.custom.filter((m) => m.sub === label), role: c.ask.trim() || label };
    }) }] : []),
  ];

  const renderList = (l: List) => {
    const approved = l.members.filter((m) => statusOf(m.invite) === "approved").length;
    return (
      <div key={l.key} className="db-field">
        <span className="db-label">{l.label} <em>({approved}/{l.members.length} approved)</em></span>
        <div className="db-list">
          {l.members.map((m, j) => (
            <div key={m.index} className={`db-list-row db-ent-row ${l.bearers ? "has-sub" : ""}`}>
              <StatusSelect value={statusOf(m.invite)}
                onChange={(st) => patch(m.index, { status: st, respondedAt: new Date().toISOString() })} />
              {l.bearers && (
                <select className="db-ent-sub" value={m.sub ?? "Bearer"} aria-label="Bearer type"
                  onChange={(e) => patch(m.index, { role: roleFor({ group: "bearers", sub: e.target.value }, w) })}>
                  {[...new Set([...BEARER_TYPES, m.sub ?? "Bearer"])].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
              <input className="db-ent-name" value={m.invite.name} placeholder="Full name" aria-label={`${l.label} name`} onChange={(e) => rename(m.index, e.target.value)} />
              <span className="db-rowtools">
                <button type="button" onClick={() => swap(m.index, l.members[j - 1].index)} disabled={j === 0} aria-label="Move up" title="Move up"><Icon name="up" size={16} /></button>
                <button type="button" onClick={() => swap(m.index, l.members[j + 1].index)} disabled={j === l.members.length - 1} aria-label="Move down" title="Move down"><Icon name="down" size={16} /></button>
                <button type="button" className="db-danger" onClick={() => remove(m.index)} aria-label="Remove" title="Remove"><Icon name="trash" size={16} /></button>
              </span>
            </div>
          ))}
        </div>
        <button type="button" className="db-add" onClick={() => add(l.members, l.role)}>+ {l.addLabel}</button>
      </div>
    );
  };

  return (
    <>
      {cards.map((card) => (
        <Card key={card.title} title={card.title}>
          <Grid>{card.lists.map(renderList)}</Grid>
        </Card>
      ))}
      <p className="db-hint">Need another role, like Candle, Veil or Cord Sponsors? Add it under <b>Personal Invites → Roles</b>.</p>
    </>
  );
}
