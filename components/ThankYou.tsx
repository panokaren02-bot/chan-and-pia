"use client";
import { useWedding } from "./WeddingProvider";
import Photo from "./Photo";
import Monogram from "./Monogram";

export default function ThankYou() {
  const wedding = useWedding();
  const [line1, line2] = wedding.thanks.title;
  return (
    <section className="thanks">
      <div className="bg-photo kenburns"><Photo name="thanks" alt="" /></div>
      <div className="shade" />
      <div className="thanks-inner">
        <p className="thanks-eyebrow reveal">A Note of Thanks</p>
        <h2 className="thanks-title reveal d1">
          <span className="thanks-script">{line1.replace(/,\s*$/, "")}</span>
          {line2 && <span className="thanks-sub">{line2}</span>}
        </h2>
        <p className="thanks-body reveal d2">{wedding.thanks.body}</p>
        <div className="thanks-sign reveal d3">
          <span className="thanks-with">With all our love,</span>
          <span className="thanks-names">{wedding.groom} &amp; {wedding.bride}</span>
          <span className="thanks-seal"><Monogram /></span>
        </div>
      </div>
    </section>
  );
}
