"use client";
import { useId, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";
import { uploadFile } from "./upload";

export function Section({ id, title, desc, children }: { id: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="db-section">
      <header className="db-section-head">
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </header>
      {children}
    </section>
  );
}

export function Card({ title, children, aside }: { title?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="db-card">
      {(title || aside) && <div className="db-card-head">{title && <h3>{title}</h3>}{aside}</div>}
      {children}
    </div>
  );
}

export const Grid = ({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) => (
  <div className={`db-grid db-grid-${cols}`}>{children}</div>
);

type TextProps = { label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string; type?: string; suggestions?: string[] };
export function Text({ label, value, onChange, hint, placeholder, type = "text", suggestions }: TextProps) {
  const listId = useId();
  return (
    <label className="db-field">
      <span className="db-label">{label}</span>
      <input type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} list={suggestions?.length ? listId : undefined} />
      {!!suggestions?.length && <datalist id={listId}>{suggestions.map((o) => <option key={o} value={o} />)}</datalist>}
      {hint && <small className="db-hint">{hint}</small>}
    </label>
  );
}

export function Area({ label, value, onChange, hint, rows = 3 }: TextProps & { rows?: number }) {
  return (
    <label className="db-field">
      <span className="db-label">{label}</span>
      <textarea rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      {hint && <small className="db-hint">{hint}</small>}
    </label>
  );
}

export function NumberField({ label, value, onChange, min = 1, max = 10 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <label className="db-field">
      <span className="db-label">{label}</span>
      <input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))} />
    </label>
  );
}

const move = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

function RowTools({ i, n, onMove, onRemove }: { i: number; n: number; onMove: (d: number) => void; onRemove: () => void }) {
  return (
    <span className="db-rowtools">
      <button type="button" onClick={() => onMove(-1)} disabled={i === 0} aria-label="Move up" title="Move up"><Icon name="up" size={16} /></button>
      <button type="button" onClick={() => onMove(1)} disabled={i === n - 1} aria-label="Move down" title="Move down"><Icon name="down" size={16} /></button>
      <button type="button" className="db-danger" onClick={onRemove} aria-label="Remove" title="Remove"><Icon name="trash" size={16} /></button>
    </span>
  );
}

export function StringList({ label, items, onChange, addLabel = "Add", placeholder, multiline }: {
  label: string; items: string[]; onChange: (v: string[]) => void; addLabel?: string; placeholder?: string; multiline?: boolean;
}) {
  return (
    <div className="db-field">
      <span className="db-label">{label} <em>({items.length})</em></span>
      <div className="db-list">
        {items.map((it, i) => (
          <div key={i} className="db-list-row">
            <span className="db-num">{i + 1}</span>
            {multiline
              ? <textarea rows={2} value={it} placeholder={placeholder} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} />
              : <input value={it} placeholder={placeholder} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} />}
            <RowTools i={i} n={items.length} onMove={(d) => onChange(move(items, i, d))} onRemove={() => onChange(items.filter((_, k) => k !== i))} />
          </div>
        ))}
      </div>
      <button type="button" className="db-add" onClick={() => onChange([...items, ""])}>+ {addLabel}</button>
    </div>
  );
}

export type FieldDef<T> = {
  key: keyof T & string;
  label: string;
  type?: "text" | "area" | "select" | "color" | "colors" | "photo";
  options?: { value: string; label: string }[];
  suggestions?: string[]; // text fields: dropdown of suggested values (free text still allowed)
  hint?: string;
  wide?: boolean;
};

export function ObjectList<T extends object>({ label, items, onChange, fields, make, addLabel = "Add", titleOf, subOf, badgeOf, extra, uploadsEnabled, searchable }: {
  label: string; items: T[]; onChange: (v: T[]) => void; fields: FieldDef<T>[]; make: () => T;
  addLabel?: string; titleOf?: (it: T, i: number) => string; subOf?: (it: T, i: number) => string; badgeOf?: (it: T, i: number) => React.ReactNode;
  extra?: (it: T, i: number) => React.ReactNode; uploadsEnabled?: boolean; searchable?: boolean;
}) {
  // long lists start collapsed so they're easy to scan on a phone
  const collapsible = items.length > 3;
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const [q, setQ] = useState("");
  const get = (it: T, k: string) => (it as Record<string, unknown>)[k];
  const set = (i: number, k: string, v: unknown) => onChange(items.map((x, j) => (j === i ? ({ ...x, [k]: v } as T) : x)));
  const toggle = (i: number) => setOpen((o) => { const n = new Set(o); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const remap = (fn: (i: number) => number | null) => setOpen((o) => new Set([...o].map(fn).filter((x): x is number => x !== null)));

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.map((it, i) => ({ it, i })).filter(({ it }) =>
      !needle || Object.values(it).some((v) => typeof v === "string" && v.toLowerCase().includes(needle)));
  }, [items, q]);

  const moveItem = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    onChange(move(items, i, d));
    remap((x) => (x === i ? j : x === j ? i : x));
  };
  const removeItem = (i: number) => {
    const name = titleOf?.(items[i], i);
    if (name && !window.confirm(`Remove “${name}”?`)) return;
    onChange(items.filter((_, k) => k !== i));
    remap((x) => (x === i ? null : x > i ? x - 1 : x));
  };
  const add = () => { onChange([...items, make()]); setQ(""); setOpen((o) => new Set(o).add(items.length)); };

  return (
    <div className="db-field">
      <div className="db-objs-head">
        <span className="db-label">{label} <em>({items.length})</em></span>
        {collapsible && (
          <button type="button" className="db-linkbtn" onClick={() => setOpen(open.size ? new Set() : new Set(items.map((_, i) => i)))}>
            {open.size ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>
      {searchable && items.length > 6 && (
        <label className="db-search">
          <Icon name="search" size={16} />
          <input type="search" placeholder={`Search ${label.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      )}
      <div className="db-objs">
        {shown.map(({ it, i }) => {
          const isOpen = !collapsible || open.has(i) || !!q;
          const sub = subOf?.(it, i);
          return (
            <div key={i} className={`db-obj ${isOpen ? "is-open" : ""}`}>
              <div className="db-obj-head">
                <button type="button" className="db-obj-title" onClick={() => collapsible && toggle(i)} aria-expanded={isOpen} disabled={!collapsible}>
                  {collapsible && <span className="db-obj-chev"><Icon name="chevron" size={16} /></span>}
                  <span className="db-obj-text">
                    <strong>{titleOf?.(it, i) || `#${i + 1}`}</strong>
                    {sub && <small>{sub}</small>}
                  </span>
                </button>
                {badgeOf?.(it, i)}
                <RowTools i={i} n={items.length} onMove={(d) => moveItem(i, d)} onRemove={() => removeItem(i)} />
              </div>
              {isOpen && (
                <div className="db-obj-body">
                  <div className="db-grid db-grid-2">
                    {fields.map((f) => {
                      const v = get(it, f.key);
                      const cls = f.wide || f.type === "area" || f.type === "colors" ? "db-wide" : "";
                      if (f.type === "area") return <div key={f.key} className={cls}><Area label={f.label} value={String(v ?? "")} onChange={(x) => set(i, f.key, x)} /></div>;
                      if (f.type === "select") return (
                        <label key={f.key} className="db-field">
                          <span className="db-label">{f.label}</span>
                          <select value={String(v ?? "")} onChange={(e) => set(i, f.key, e.target.value)}>
                            {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </label>
                      );
                      if (f.type === "color") return <ColorField key={f.key} label={f.label} value={String(v ?? "#000000")} onChange={(x) => set(i, f.key, x)} />;
                      if (f.type === "colors") return <div key={f.key} className={cls}><ColorList label={f.label} items={(v as string[]) ?? []} onChange={(x) => set(i, f.key, x)} /></div>;
                      if (f.type === "photo") return <div key={f.key} className={cls}><PhotoPicker label={f.label} value={String(v ?? "")} onChange={(x) => set(i, f.key, x)} enabled={uploadsEnabled} keepPng /></div>;
                      return <div key={f.key} className={cls}><Text label={f.label} value={String(v ?? "")} onChange={(x) => set(i, f.key, x)} suggestions={f.suggestions} hint={f.hint} /></div>;
                    })}
                  </div>
                  {extra?.(it, i)}
                </div>
              )}
            </div>
          );
        })}
        {q && !shown.length && <p className="db-hint">No match for “{q}”.</p>}
      </div>
      <button type="button" className="db-add" onClick={add}>+ {addLabel}</button>
    </div>
  );
}

/** Read-only link with a copy button. */
export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { window.prompt("Copy this link:", url); return; }
    setDone(true); setTimeout(() => setDone(false), 1600);
  };
  return (
    <div className="db-copy">
      <span className="db-label">Personal link</span>
      <div className="db-copy-row">
        <code>{url}</code>
        <button type="button" className="db-btn" onClick={copy}><Icon name={done ? "check" : "copy"} size={16} />{done ? "Copied" : "Copy"}</button>
      </div>
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="db-field">
      <span className="db-label">{label}</span>
      <span className="db-color">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} />
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      </span>
    </label>
  );
}

export function ColorList({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="db-field">
      <span className="db-label">{label}</span>
      <div className="db-swatches">
        {items.map((c, i) => (
          <span key={i} className="db-swatch">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(c) ? c : "#000000"} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} />
            <button type="button" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Remove color"><Icon name="close" size={11} /></button>
          </span>
        ))}
        <button type="button" className="db-add db-add-inline" onClick={() => onChange([...items, "#c5aa83"])}>+ Color</button>
      </div>
    </div>
  );
}

/* ───────── photos ───────── */

export function useUploader(enabled = true) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async <R,>(fn: () => Promise<R>) => {
    if (!enabled) { setErr("Connect Google Apps Script to upload."); return; }
    setBusy(true); setErr("");
    try { return await fn(); } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed"); } finally { setBusy(false); }
  };
  return { busy, err, run };
}

export function PhotoPicker({ label, value, onChange, enabled = true, keepPng, maxEdge, hint, accept = "image/*", audio }: {
  label: string; value: string; onChange: (v: string) => void; enabled?: boolean; keepPng?: boolean; maxEdge?: number; hint?: string; accept?: string; audio?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { busy, err, run } = useUploader(enabled);
  return (
    <div className="db-field">
      <span className="db-label">{label}</span>
      <div className={`db-photo ${audio ? "db-photo-audio" : ""}`}>
        <div className="db-photo-preview">
          {value ? (audio ? <audio controls src={value} /> : <img src={value} alt="" />) : <span>None</span>}
          {busy && <span className="db-photo-busy">Uploading…</span>}
        </div>
        <div className="db-photo-actions">
          <button type="button" className="db-btn" disabled={busy} onClick={() => input.current?.click()}>{value ? "Replace" : "Upload"}</button>
          {value && <button type="button" className="db-btn db-btn-ghost" onClick={() => onChange("")}>Remove</button>}
        </div>
        <input ref={input} type="file" accept={accept} hidden onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) run(async () => onChange(await uploadFile(f, { keepPng, maxEdge })));
        }} />
      </div>
      {hint && <small className="db-hint">{hint}</small>}
      {err && <small className="db-err">{err}</small>}
    </div>
  );
}

export function PhotoGrid({ label, items, onChange, enabled = true, fixed, hint }: {
  label: string; items: string[]; onChange: (v: string[]) => void; enabled?: boolean; fixed?: boolean; hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const replaceAt = useRef<number | null>(null);
  const { busy, err, run } = useUploader(enabled);
  const [progress, setProgress] = useState("");

  const onFiles = (files: File[]) => run(async () => {
    const at = replaceAt.current;
    if (at !== null) {
      const url = await uploadFile(files[0], { maxEdge: 1600 });
      onChange(items.map((x, i) => (i === at ? url : x)));
      return;
    }
    let next = [...items];
    for (const [k, f] of files.entries()) {
      setProgress(`${k + 1} / ${files.length}`);
      next = [...next, await uploadFile(f, { maxEdge: 2000 })];
      onChange(next);
    }
    setProgress("");
  });

  return (
    <div className="db-field">
      <span className="db-label">{label} <em>({items.length})</em></span>
      {hint && <small className="db-hint">{hint}</small>}
      <div className="db-pgrid">
        {items.map((src, i) => (
          <figure key={src + i} className="db-pitem">
            <img src={src} alt="" loading="lazy" />
            <figcaption>
              <span className="db-num">{i + 1}</span>
              <span className="db-rowtools">
                {!fixed && <button type="button" onClick={() => onChange(move(items, i, -1))} disabled={i === 0} aria-label="Move earlier" title="Move earlier"><Icon name="left" size={16} /></button>}
                {!fixed && <button type="button" onClick={() => onChange(move(items, i, 1))} disabled={i === items.length - 1} aria-label="Move later" title="Move later"><Icon name="right" size={16} /></button>}
                <button type="button" onClick={() => { replaceAt.current = i; input.current?.click(); }} aria-label="Replace" title="Replace"><Icon name="replace" size={16} /></button>
                {!fixed && <button type="button" className="db-danger" onClick={() => window.confirm("Remove this photo?") && onChange(items.filter((_, k) => k !== i))} aria-label="Remove" title="Remove"><Icon name="trash" size={16} /></button>}
              </span>
            </figcaption>
          </figure>
        ))}
        {!fixed && (
          <button type="button" className="db-pitem db-padd" disabled={busy} onClick={() => { replaceAt.current = null; input.current?.click(); }}>
            {busy ? `Uploading ${progress}` : "+ Add photos"}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple={!fixed} hidden onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (files.length) onFiles(replaceAt.current !== null ? files.slice(0, 1) : files);
      }} />
      {busy && replaceAt.current !== null && <small className="db-hint">Uploading…</small>}
      {err && <small className="db-err">{err}</small>}
    </div>
  );
}
