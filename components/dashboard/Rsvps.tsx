"use client";
import { useCallback, useEffect, useState } from "react";
import { Section } from "./fields";
import { slugify } from "@/lib/wedding";
import Seating from "./Seating";

type Row = { row?: number; submittedAt: string; name: string; attending: string; guests: number; message: string; guestLink: string };

const REFRESH_MS = 60_000;
const yesNo = (v: string) => { const t = String(v || "").trim().toLowerCase(); return /^(y|yes|attending|accept)/.test(t) ? "yes" : /^(n|no|not|decline)/.test(t) ? "no" : t; };
const time = (s: string) => { const t = Date.parse(s); return Number.isNaN(t) ? 0 : t; };

export default function Rsvps({ connected, hidden = [], onToggleHidden, tables = {}, onSetTable, couple = "" }: {
  connected: boolean; hidden?: string[]; onToggleHidden?: (id: string) => void;
  tables?: Record<string, string>; onSetTable?: (key: string, table: string) => void; couple?: string;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no" | "unseated">("all");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);

  // straight from the "RSVP" tab of the Google Sheet, newest first
  const load = useCallback(async () => {
    if (!connected) return;
    setErr(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/rsvps", { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not load RSVPs");
      const list = (data.rows as Row[]).map((x, i) => ({ ...x, attending: yesNo(x.attending), row: x.row ?? i + 2 }));
      setRows(list.sort((a, b) => time(b.submittedAt) - time(a.submittedAt) || (b.row ?? 0) - (a.row ?? 0)));
      setUpdated(new Date());
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not load RSVPs"); }
    finally { setLoading(false); }
  }, [connected]);

  // keep in step with the sheet: on open, every minute, and when you come back to this tab
  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, REFRESH_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [load]);

  const yes = rows?.filter((r) => r.attending === "yes") ?? [];
  const no = rows?.filter((r) => r.attending === "no") ?? [];
  const tableOf = (r: Row) => (tables[slugify(r.name)] ?? "").trim();
  const shown = (rows ?? []).filter((r) => filter === "all" || (filter === "unseated" ? r.attending === "yes" && !tableOf(r) : r.attending === filter));
  const tableNames = [...new Set(Object.values(tables).map((t) => t.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const csv = () => {
    const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["Submitted", "Name", "Attending", "Guests", "Table", "Message", "Personal link"].map(q).join(",")]
      .concat((rows ?? []).map((r) => [r.submittedAt, r.name, r.attending, r.guests, tableOf(r), r.message, r.guestLink].map(q).join(",")));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "rsvps.csv" }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Section id="responses" title="RSVP Responses" desc="Everything in the “RSVP” tab of your Google Sheet: replies from the RSVP form, people who said yes on their personal invite, and rows you add or edit in the sheet yourself. Messages appear on the site's wishes wall; hide any you don't want shown. Assign reception tables in the Table column, then Save. Guests find theirs at /table.">
      {!connected ? <p className="db-hint">Connect Google Apps Script to see responses.</p> : (
        <>
          <div className="db-stats">
            <div><b>{rows?.length ?? "–"}</b><span>Replies</span></div>
            <div><b>{rows ? yes.length : "–"}</b><span>Attending</span></div>
            <div><b>{rows ? yes.reduce((n, r) => n + (r.guests || 1), 0) : "–"}</b><span>Total guests</span></div>
            <div><b>{rows ? no.length : "–"}</b><span>Declined</span></div>
          </div>
          <div className="db-toolbar">
            <div className="db-seg">
              {(["all", "yes", "unseated", "no"] as const).map((f) => (
                <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "yes" ? "Attending" : f === "unseated" ? "No table" : "Declined"}</button>
              ))}
            </div>
            <span style={{ flex: 1 }} />
            {updated && <small className="db-hint db-updated">{loading ? "Updating…" : `Updated ${updated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}</small>}
            <button className="db-btn db-btn-ghost" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
            <button className="db-btn db-btn-ghost" onClick={csv} disabled={!rows?.length}>Download CSV</button>
          </div>
          {err && <p className="db-err">{err}</p>}
          {rows && !rows.length && <p className="db-hint">No replies yet.</p>}
          {!!shown.length && (
            <div className="db-table-wrap">
              <table className="db-table">
                <thead><tr><th>Name</th><th>Reply</th><th>Guests</th><th>Table</th><th>Message</th><th>Received</th><th>Wishes wall</th></tr></thead>
                <tbody>
                  {shown.map((r, i) => (
                    <tr key={`${r.row}-${i}`}>
                      <td className="db-td-name">{r.name || <em>(no name)</em>}<small>{[r.guestLink && `personal invite · ${r.guestLink}`, r.row && `sheet row ${r.row}`].filter(Boolean).join(" · ")}</small></td>
                      <td className="db-td-reply"><span className={`db-pill db-pill-${r.attending === "yes" || r.attending === "no" ? r.attending : "pending"}`}>{r.attending === "yes" ? "Attending" : r.attending === "no" ? "Declined" : r.attending || "No reply"}</span></td>
                      <td className="db-td-guests" data-label="Guests">{r.attending === "yes" ? r.guests : "–"}</td>
                      <td className="db-td-table" data-label="Table">
                        {r.attending === "yes" && r.name ? (
                          <input className="db-table-input" list="db-table-names" value={tables[slugify(r.name)] ?? ""} placeholder="Assign…"
                            aria-label={`Table for ${r.name}`} onChange={(e) => onSetTable?.(slugify(r.name), e.target.value)} />
                        ) : "–"}
                      </td>
                      <td className="db-msg" data-label="Message">{r.message || "—"}</td>
                      <td className="db-td-date">{time(r.submittedAt) ? new Date(r.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}</td>
                      <td className="db-td-wall">
                        {r.message?.trim() ? (
                          <button className={`db-btn ${hidden.includes(String(r.submittedAt)) ? "" : "db-btn-ghost"}`} onClick={() => onToggleHidden?.(String(r.submittedAt))}>
                            {hidden.includes(String(r.submittedAt)) ? "Hidden · Show" : "Shown · Hide"}
                          </button>
                        ) : <small>No message</small>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <datalist id="db-table-names">{tableNames.map((t) => <option key={t} value={t} />)}</datalist>
            </div>
          )}
          {rows && <Seating rows={rows} tables={tables} couple={couple} origin={typeof window !== "undefined" ? window.location.origin : ""} />}
        </>
      )}
    </Section>
  );
}
