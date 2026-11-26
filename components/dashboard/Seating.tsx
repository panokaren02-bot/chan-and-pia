"use client";
import { useMemo, useRef } from "react";
import qrcode from "qrcode-generator";
import { slugify } from "@/lib/wedding";
import { Icon } from "./icons";

export type SeatRow = { name: string; attending: string; guests: number };

/** Who sits where (from the table column above), and the QR code for the venue door that opens /table. */
export default function Seating({ rows, tables, origin, couple }: { rows: SeatRow[]; tables: Record<string, string>; origin: string; couple: string }) {
  const url = `${origin}/table`;
  const svg = useRef<SVGSVGElement>(null);

  // one entry per attending guest (newest reply wins), grouped by table
  const { groups, unseated, seated } = useMemo(() => {
    const seen = new Set<string>();
    const by = new Map<string, { names: string[]; guests: number }>();
    const un: string[] = [];
    let n = 0;
    for (const r of rows) {
      const key = slugify(r.name);
      if (!key || seen.has(key) || r.attending !== "yes") continue;
      seen.add(key);
      const t = (tables[key] ?? "").trim();
      if (!t) { un.push(r.name); continue; }
      const g = by.get(t) ?? { names: [], guests: 0 };
      g.names.push(r.guests > 1 ? `${r.name} (+${r.guests - 1})` : r.name);
      g.guests += r.guests || 1;
      by.set(t, g);
      n++;
    }
    const sorted = [...by.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
    return { groups: sorted, unseated: un, seated: n };
  }, [rows, tables]);

  const { d, size } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    const n = qr.getModuleCount();
    let path = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
    return { d: path, size: n };
  }, [url]);

  // a print-ready sign (1200×1600 PNG): title, QR code, couple's names
  const download = async () => {
    const font = (v: string) => getComputedStyle(document.body).getPropertyValue(v).trim() || "serif";
    const display = font("--font-display"), body = font("--font-body");
    await document.fonts.ready;
    const W = 1200, H = 1600, cv = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const g = cv.getContext("2d")!;
    g.fillStyle = "#fbf8f2"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "#b39670"; g.lineWidth = 3; g.strokeRect(40, 40, W - 80, H - 80); g.lineWidth = 1.5; g.strokeRect(58, 58, W - 116, H - 116);
    g.textAlign = "center"; g.fillStyle = "#b39670"; g.font = `500 30px ${body}`;
    g.fillText("W E L C O M E", W / 2, 210);
    g.fillStyle = "#511d29"; g.font = `italic 400 110px ${display}`; g.fillText("Find your table", W / 2, 350);
    g.fillStyle = "#4a4242"; g.font = `400 40px ${body}`; g.fillText("Scan with your phone camera and type your name", W / 2, 440);
    const m = Math.floor(720 / (size + 4)), q = m * (size + 4), x = Math.round((W - q) / 2), y = 520; // whole-pixel modules: no seams
    g.fillStyle = "#fff"; g.fillRect(x, y, q, q);
    g.fillStyle = "#511d29";
    const qr = qrcode(0, "M"); qr.addData(url); qr.make();
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (qr.isDark(r, c)) g.fillRect(x + (c + 2) * m, y + (r + 2) * m, m, m);
    g.fillStyle = "#8a7a6c"; g.font = `400 34px ${body}`; g.fillText(url.replace(/^https?:\/\//, ""), W / 2, y + q + 80);
    g.fillStyle = "#511d29"; g.font = `italic 400 70px ${display}`; g.fillText(couple, W / 2, H - 170);
    const a = Object.assign(document.createElement("a"), { href: cv.toDataURL("image/png"), download: "find-your-table-qr.png" });
    a.click();
  };

  return (
    <div className="db-seating">
      <div className="db-card db-seat-qr">
        <svg ref={svg} viewBox={`-2 -2 ${size + 4} ${size + 4}`} role="img" aria-label="QR code for the Find your table page" shapeRendering="crispEdges">
          <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#fff" /><path d={d} fill="#511d29" />
        </svg>
        <div>
          <h3>Door QR code</h3>
          <p className="db-hint">Print it for the reception entrance. Guests scan it, type their name and see their table.</p>
          <code>{url.replace(/^https?:\/\//, "")}</code>
          <div className="db-seat-actions">
            <button className="db-btn db-btn-primary" onClick={download}><Icon name="download" />Download sign (PNG)</button>
            <a className="db-btn" href="/table" target="_blank" rel="noopener noreferrer"><Icon name="external" />Open page</a>
          </div>
        </div>
      </div>

      <div className="db-card">
        <h3 className="db-seat-head">Tables <small>{seated} seated · {unseated.length} not yet</small></h3>
        {!groups.length && <p className="db-hint">Type a table in the “Table” column above (e.g. “Table 5” or “Family”). Guests with the same table are grouped here.</p>}
        <div className="db-seat-grid">
          {groups.map(([t, g]) => (
            <div key={t} className="db-seat-table">
              <b>{t}</b><small>{g.guests} {g.guests === 1 ? "guest" : "guests"}</small>
              <ul>{g.names.map((n) => <li key={n}>{n}</li>)}</ul>
            </div>
          ))}
        </div>
        {!!unseated.length && <p className="db-hint db-seat-un"><b>No table yet:</b> {unseated.join(", ")}</p>}
      </div>
    </div>
  );
}
