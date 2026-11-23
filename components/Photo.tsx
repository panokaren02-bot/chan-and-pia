"use client";
// Art-directed photo: portrait crop on phones, landscape on desktop. Sources come from content.photos.slots.
import { usePhotoSlot } from "./WeddingProvider";

type Props = { name: string; alt: string; className?: string; priority?: boolean };

export default function Photo({ name, alt, className, priority }: Props) {
  const { m, d } = usePhotoSlot(name);
  const fallback = m ?? d;
  if (!fallback) return null;
  return (
    <picture className={className}>
      {m && d && <source media="(min-width: 760px)" srcSet={d} />}
      <img src={fallback} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : "auto"} />
    </picture>
  );
}
