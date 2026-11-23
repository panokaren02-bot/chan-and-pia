"use client";
import { useState } from "react";
import { DEFAULT_ORDER, SECTIONS, normalizeOrder, type SectionKey } from "@/lib/sections";
import { Card, Section } from "./fields";
import { Icon } from "./icons";

type Props = { order: string[]; hidden: string[]; onChange: (order: SectionKey[], hidden: string[]) => void };

/** Reorder the page sections (drag on desktop, arrows everywhere) and switch each one on or off. */
export default function LayoutEditor({ order, hidden, onChange }: Props) {
  const list = normalizeOrder(order);
  const off = new Set(hidden);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length || from === to) return;
    const next = [...list];
    const [k] = next.splice(from, 1);
    next.splice(to, 0, k);
    onChange(next, hidden);
  };
  const toggle = (k: SectionKey) => onChange(list, off.has(k) ? hidden.filter((h) => h !== k) : [...hidden, k]);
  const isDefault = list.join() === DEFAULT_ORDER.join() && !hidden.length;
  const shown = list.filter((k) => !off.has(k)).length;

  return (
    <Section id="layout" title="Page Layout" desc="Choose the order of the sections on the website and which ones to show. Save to update the live site.">
      <Card title="Sections" aside={
        <button className="db-btn db-btn-ghost" disabled={isDefault} onClick={() => window.confirm("Reset to the original order and show every section?") && onChange([...DEFAULT_ORDER], [])}>
          Reset
        </button>
      }>
        <p className="db-hint db-layout-sum">{shown} of {list.length} sections shown · drag to reorder on a computer, or use the arrows.</p>

        <ol className="db-layout">
          <li className="db-layout-fixed"><span className="db-layout-pin">Top</span><div><strong>Opening envelope &amp; Hero</strong><small>Always first</small></div></li>

          {list.map((k, i) => {
            const s = SECTIONS.find((x) => x.key === k)!;
            const hiddenNow = off.has(k);
            return (
              <li key={k} draggable
                className={`db-layout-row ${hiddenNow ? "is-off" : ""} ${drag === i ? "is-drag" : ""} ${over === i && drag !== null && drag !== i ? (drag < i ? "is-over-after" : "is-over-before") : ""}`}
                onDragStart={(e) => { setDrag(i); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => { e.preventDefault(); setOver(i); }}
                onDragLeave={() => setOver((o) => (o === i ? null : o))}
                onDrop={(e) => { e.preventDefault(); if (drag !== null) move(drag, i); setDrag(null); setOver(null); }}
                onDragEnd={() => { setDrag(null); setOver(null); }}>
                <span className="db-layout-grip" aria-hidden>⋮⋮</span>
                <span className="db-layout-num">{i + 1}</span>
                <div className="db-layout-text">
                  <strong>{s.label}</strong>
                  {"note" in s && <small>{s.note}</small>}
                  {hiddenNow && <em>Hidden</em>}
                </div>
                <label className="db-switch" title={hiddenNow ? "Show this section" : "Hide this section"}>
                  <input type="checkbox" checked={!hiddenNow} onChange={() => toggle(k)} aria-label={`Show ${s.label}`} />
                  <span />
                </label>
                <span className="db-rowtools">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up" title="Move up"><Icon name="up" size={16} /></button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === list.length - 1} aria-label="Move down" title="Move down"><Icon name="down" size={16} /></button>
                </span>
              </li>
            );
          })}

          <li className="db-layout-fixed"><span className="db-layout-pin">End</span><div><strong>Footer</strong><small>Always last</small></div></li>
        </ol>
      </Card>
    </Section>
  );
}
