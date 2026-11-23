"use client";
import { useWedding } from "./WeddingProvider";

// Renders /public/monogram/monogram-web.png as a CSS mask so it takes the surrounding text color.
export default function Monogram({ className = "" }: { className?: string }) {
  const wedding = useWedding();
  const [a, b] = wedding.monogram;
  const mask = `url("${wedding.monogramImage}")`;
  return <span className={`monogram ${className}`} role="img" aria-label={`${a}${b} monogram`} style={{ WebkitMaskImage: mask, maskImage: mask }} />;
}
