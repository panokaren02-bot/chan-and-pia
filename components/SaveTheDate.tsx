"use client";
import { weddingParts, googleCalendarUrl, downloadIcs, weekdayOf } from "@/lib/date";
import Photo from "./Photo";
import { useWedding } from "./WeddingProvider";
import { IconCalendar } from "./Icons";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export default function SaveTheDate() {
  const wedding = useWedding();
  const { year, month, day } = weddingParts(wedding);
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const weekCol = (first + day - 1) % 7;
  // full weeks: muted days from the neighbouring months fill the gaps
  const total = Math.ceil((first + days) / 7) * 7;
  const cells = Array.from({ length: total }, (_, i) => {
    const n = i - first + 1;
    if (n < 1) return { n: prevDays + n, muted: true };
    if (n > days) return { n: n - days, muted: true };
    return { n, muted: false };
  });

  return (
    <section id="save-the-date" className="savedate">
      <div className="sd-photo">
        <div className="bg-photo"><Photo name="savedate" alt={`${wedding.groom} and ${wedding.bride} on the beach`} /></div>
        <div className="shade" />
      </div>

      <div className="sd-card reveal">
        <div className="sd-paper">
          <p className="sd-title">Save the Date</p>
          <p className="sd-sub">for the wedding of {wedding.groom} &amp; {wedding.bride}</p>

          <div className="sd-date" aria-label={`${weekdayOf(wedding)}, ${MONTHS[month]} ${day}, ${year}`}>
            <span className="sd-month">{MONTHS[month]}</span>
            <div className="sd-row">
              <span className="sd-side">{weekdayOf(wedding)}</span>
              <span className="sd-day">{day}</span>
              <span className="sd-side">{year}</span>
            </div>
            <span className="sd-time">at {wedding.ceremony.time}</span>
          </div>

          <div className="sd-cal" role="grid" aria-label={`${MONTHS[month]} ${year}`}>
            {DOW.map((d, i) => <div key={i} className={`dow ${i === weekCol ? "on" : ""}`} aria-hidden>{d}</div>)}
            {cells.map((c, i) => {
              const target = !c.muted && c.n === day;
              return (
                <div key={i} className={`day ${c.muted ? "muted" : ""} ${target ? "target" : ""}`} aria-current={target ? "date" : undefined}>
                  {c.n}
                  {target && (
                    <svg className="sd-ink" viewBox="0 0 60 60" aria-hidden>
                      <path pathLength={1} d="M33 7C49 6 57 18 55 31c-2 15-17 24-31 21C10 49 3 36 7 23 11 12 22 5 38 8" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sd-actions">
            <a className="sd-btn" href={googleCalendarUrl(wedding)} target="_blank" rel="noopener noreferrer"><IconCalendar /> Google</a>
            <button className="sd-btn" onClick={() => downloadIcs(wedding)}><IconCalendar /> Apple / Outlook</button>
          </div>
        </div>
      </div>
    </section>
  );
}
