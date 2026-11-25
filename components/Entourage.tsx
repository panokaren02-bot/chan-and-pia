"use client";
import { Fragment } from "react";
import { approvedEntourage, customGroups, type Group as GroupKey } from "@/lib/entourage";
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
  // only people who said yes (Approved in the Invites sheet) are shown
  const g = approvedEntourage(wedding.invites, wedding.customRoles);
  // your own roles (Candle Sponsors, Veil Sponsors…), two to a block like the built-in pairs
  const extra = customGroups(g.custom, wedding.customRoles);
  const extraPairs = Array.from({ length: Math.ceil(extra.length / 2) }, (_, i) => extra.slice(i * 2, i * 2 + 2));
  const names = (k: GroupKey) => g[k].map((m) => m.invite.name);
  const has = (...ks: GroupKey[]) => ks.some((k) => g[k].length);
  if (!Object.values(g).some((l) => l.length)) return null;

  const blocks = [
    has("ninongs", "ninangs") && (
      <Group key="sponsors" title="Principal Sponsors">
        <div className="ent-cols">
          {has("ninongs") && <Names head="Ninong" names={names("ninongs")} />}
          {has("ninangs") && <Names head="Ninang" names={names("ninangs")} />}
        </div>
      </Group>
    ),
    ...extraPairs.map((pair) => (
      <Group key={pair.map((p) => p.label).join("|")} title={pair.map((p) => p.label).join(" & ")}>
        <div className="ent-cols">
          {/* a block with one role already carries its name as the title */}
          {pair.map((p) => <Names key={p.label} head={pair.length > 1 ? p.label : undefined} names={p.members.map((m) => m.invite.name)} />)}
        </div>
      </Group>
    )),
    has("bestMan", "maidOfHonor") && (
      <Group key="honor" title="Best Man & Maid of Honor" featured>
        <div className="ent-cols">
          {has("bestMan") && <Names head="Best Man" names={names("bestMan")} />}
          {has("maidOfHonor") && <Names head="Maid of Honor" names={names("maidOfHonor")} />}
        </div>
      </Group>
    ),
    has("groomSquad", "brideSquad") && (
      <Group key="squads" title="Groom's & Bride's Squad">
        <div className="ent-cols">
          {has("groomSquad") && <Names head="Groom's Squad" names={names("groomSquad")} />}
          {has("brideSquad") && <Names head="Bride's Squad" names={names("brideSquad")} />}
        </div>
      </Group>
    ),
    has("bearers", "flowerGirls") && (
      <Group key="bearers" title="Bearers & Flower Girls">
        <div className="ent-cols">
          {has("bearers") && (
            <div className="ent-col">
              {g.bearers.map((m) => (
                <div key={m.index} className="ent-pair">
                  <p className="ent-script">{m.sub}</p>
                  <ul className="ent-names"><li>{m.invite.name}</li></ul>
                </div>
              ))}
            </div>
          )}
          {has("flowerGirls") && <Names head="Flower Girls" names={names("flowerGirls")} />}
        </div>
      </Group>
    ),
  ].filter(Boolean);

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
          {blocks.map((b, i) => <Fragment key={i}>{i > 0 && <Ornament />}{b}</Fragment>)}
        </div>
      </div>
    </section>
  );
}
