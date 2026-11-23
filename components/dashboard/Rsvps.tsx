"use client";
import { useCallback, useEffect, useState } from "react";
import { Section } from "./fields";

type Row = { submittedAt: string; name: string; attending: string; guests: number; message: string; guestLink: string };

export default function Rsvps({ connected, hidden = [], onToggleHidden }: { connected: boolean; hidden?: string[]; onToggleHidden?: (id: string) => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");

  const load = useCallback(async () => {
    if (!connected) return;
    setErr("");
    try {
      const res = await fetch("/api/admin/rsvps", { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not load RSVPs");
      setRows((data.rows as Row[]).reverse());
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not load RSVPs"); }
  }, [connected]);

  useEffect(() => { load(); }, [load]);

  const yes = rows?.filter((r) => r.attending === "yes") ?? [];
  const no = rows?.filter((r) => r.attending === "no") ?? [];
  const shown = (rows ?? []).filter((r) => filter === "all" || r.attending === filter);

  const csv = () => {
    const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["Submitted", "Name", "Attending", "Guests", "Message", "Personal link"].map(q).join(",")]
      .concat((rows ?? []).map((r) => [r.submittedAt, r.name, r.attending, r.guests, r.message, r.guestLink].map(q).join(",")));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "rsvps.csv" }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Section id="responses" title="RSVP Responses" desc="Replies from the RSVP form. They're also in the “RSVP” tab of your Google Sheet. Messages appear on the site's wishes wall; hide any you don't want shown, then Save.">
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
              {(["all", "yes", "no"] as const).map((f) => (
                <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "yes" ? "Attending" : "Declined"}</button>
              ))}
            </div>
            <span style={{ flex: 1 }} />
            <button className="db-btn db-btn-ghost" onClick={load}>Refresh</button>
            <button className="db-btn db-btn-ghost" onClick={csv} disabled={!rows?.length}>Download CSV</button>
          </div>
          {err && <p className="db-err">{err}</p>}
          {rows && !rows.length && <p className="db-hint">No replies yet.</p>}
          {!!shown.length && (
            <div className="db-table-wrap">
              <table className="db-table">
                <thead><tr><th>Name</th><th>Reply</th><th>Guests</th><th>Message</th><th>Received</th><th>Wishes wall</th></tr></thead>
                <tbody>
                  {shown.map((r, i) => (
                    <tr key={i}>
                      <td className="db-td-name">{r.name}{r.guestLink && <small>{r.guestLink}</small>}</td>
                      <td className="db-td-reply"><span className={`db-pill db-pill-${r.attending}`}>{r.attending === "yes" ? "Attending" : "Declined"}</span></td>
                      <td className="db-td-guests" data-label="Guests">{r.attending === "yes" ? r.guests : "–"}</td>
                      <td className="db-msg" data-label="Message">{r.message || "—"}</td>
                      <td className="db-td-date">{new Date(r.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
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
            </div>
          )}
        </>
      )}
    </Section>
  );
}
