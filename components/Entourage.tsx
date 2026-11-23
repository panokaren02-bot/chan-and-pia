"use client";
import { useWedding } from "./WeddingProvider";
import Photo from "./Photo";

/** A column of names under a script heading; names fade in one after another. */
function Names({ head, names }: { head?: string; names: string[] }) {
  return (
    <div className="ent-col">
      {head && <p className="ent-script">{head}</p>}
      <ul className="ent-names">
        {names.filter(Boolean).map((n, i) => <li key={n + i} style={{ ["--i" as string]: i }}>{n}</li>)}
      </ul>
    </div>
  );
}

function Group({ title, children, featured }: { title: string; children: React.ReactNode; featured?: boolean }) {
  return (
    <div className={`ent-group reveal ${featured ? "ent-featured" : ""}`}>
      <p className="ent-title"><span>{title}</span></p>
      {children}
    </div>
  );
}

const Ornament = () => (
  <svg className="ent-orn" viewBox="0 0 120 12" aria-hidden>
    <path d="M0 6h48M72 6h48" />
    <path d="M60 1l5 5-5 5-5-5z" />
    <circle cx="51" cy="6" r="1" /><circle cx="69" cy="6" r="1" />
  </svg>
);

export default function Entourage() {
  const wedding = useWedding();
  const e = wedding.entourage;
  return (
    <section id="entourage" className="sec-dark">
      <div className="ent-hero">
        <div className="bg-photo kenburns"><Photo name="entourage" alt="" /></div>
        <div className="shade" />
      </div>
      <div className="section entourage">
        <div className="container" style={{ maxWidth: 820 }}>
          <header className="sec-head reveal" style={{ marginBottom: 0 }}>
            <p className="eyebrow">The Wedding</p>
            <h2 className="title">Entourage</h2>
            <div className="rule" style={{ background: "var(--gold-soft)" }} />
          </header>

          <Group title="Principal Sponsors">
            <div className="ent-cols">
              <Names head="Ninong" names={e.ninongs} />
              <Names head="Ninang" names={e.ninangs} />
            </div>
          </Group>

          <Ornament />
          <Group title="Best Man & Maid of Honor" featured>
            <div className="ent-cols">
              <Names head="Best Man" names={[e.bestMan]} />
              <Names head="Maid of Honor" names={[e.maidOfHonor]} />
            </div>
          </Group>

          <Ornament />
          <Group title="Groom's & Bride's Squad">
            <div className="ent-cols">
              <Names head="Groom's Squad" names={e.groomSquad} />
              <Names head="Bride's Squad" names={e.brideSquad} />
            </div>
          </Group>

          <Ornament />
          <Group title="Bearers & Flower Girls">
            <div className="ent-cols">
              <div className="ent-col">
                {e.bearers.map((b) => (
                  <div key={b.role} className="ent-pair">
                    <p className="ent-script">{b.role}</p>
                    <ul className="ent-names"><li>{b.name}</li></ul>
                  </div>
                ))}
              </div>
              <Names head="Flower Girls" names={e.flowerGirls} />
            </div>
          </Group>
        </div>
      </div>
    </section>
  );
}
