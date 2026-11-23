"use client";
import { useWedding } from "./WeddingProvider";
import { IconCheck, IconX } from "./Icons";

export default function Reminders() {
  const wedding = useWedding();
  const { dos, donts } = wedding.reminders;
  return (
    <section id="reminders" className="section sec-ivory reminders grain">
      <div className="container">
        <header className="sec-head reveal">
          <p className="eyebrow caps">Little Reminder</p>
          <div className="rule" />
          <h2 className="title" style={{ marginTop: 22 }}>Ceremony Do&apos;s &amp; Don&apos;ts</h2>
        </header>
        <div className="rem-cards">
          <div className="rem-card reveal">
            <div className="rem-head"><IconCheck /> DO</div>
            <ul>{dos.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          <div className="rem-card dont reveal d1">
            <div className="rem-head"><IconX /> DON&apos;T</div>
            <ul>{donts.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}
