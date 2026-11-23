"use client";
import { useState } from "react";
import { useWedding } from "./WeddingProvider";
import Monogram from "./Monogram";
import { IconCopy } from "./Icons";
import { useToast, copyText } from "./useToast";

export default function Gifts() {
  const wedding = useWedding();
  const { intro, accounts } = wedding.gifts;
  const [active, setActive] = useState(0);
  const toast = useToast();
  if (!accounts.length) return null;

  return (
    <section id="gifts" className="section sec-cream grain center gifts">
      <div className="container">
        <header className="reveal">
          <p className="gifts-script">With Gratitude</p>
          <h2 className="title">Gift Suggestion</h2>
          <div className="rule" />
        </header>
        <p className="gifts-intro reveal d1">{intro}</p>

        {accounts.length > 1 && (
          <div className="gift-tabs reveal d2" role="tablist" aria-label="Gift accounts">
            {accounts.map((acc, k) => (
              <button key={acc.bank + k} role="tab" aria-selected={k === active} className={k === active ? "on" : ""} onClick={() => setActive(k)}>{acc.bank}</button>
            ))}
          </div>
        )}

        <div className={`gift-cards gift-n${Math.min(accounts.length, 3)} reveal d2`}>
          {accounts.map((a, k) => {
            const hasNumber = /\d/.test(a.accountNumber);
            return (
              <article key={a.bank + k} className={`gift-card ${k === active ? "is-active" : ""}`} aria-label={`${a.bank} details`}>
                <span className="gift-frame" aria-hidden />
                <span className="gift-watermark" aria-hidden><Monogram /></span>
                <p className="gift-bank">{a.bank}</p>

                <div className="gift-qr">
                  <i aria-hidden /><i aria-hidden /><i aria-hidden /><i aria-hidden />
                  {a.qr ? <img src={a.qr} alt={`${a.bank} QR code`} loading="lazy" /> : (
                    <div className="gift-qr-empty"><Monogram /><span>QR code coming soon</span></div>
                  )}
                </div>

                <p className="gift-label">Account name</p>
                <p className="gift-name">{a.accountName}</p>
                <p className="gift-label">Account number</p>
                <p className={`gift-num ${hasNumber ? "" : "is-soon"}`}>{a.accountNumber}</p>

                {(hasNumber || a.qr) && (
                  <div className="gift-actions">
                    {hasNumber && (
                      <button className="gift-btn" onClick={async () => (await copyText(a.accountNumber.replace(/\s/g, ""))) && toast.show(`${a.bank} number copied`)}>
                        <IconCopy /> Copy number
                      </button>
                    )}
                    {a.qr && <a className="gift-btn gift-btn-ghost" href={a.qr} download={`${a.bank.replace(/\W+/g, "-")}-QR`}>Save QR</a>}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <p className="gifts-note reveal">Your presence is the greatest gift of all.</p>
      </div>
      {toast.node}
    </section>
  );
}
