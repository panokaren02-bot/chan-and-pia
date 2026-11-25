"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { defaultWedding, findInvite, type PhotoSlot, type Wedding } from "@/lib/wedding";

const Ctx = createContext<Wedding>(defaultWedding);

export function WeddingProvider({ value, children }: { value: Wedding; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useWedding = () => useContext(Ctx);

/** Sections switched off in the dashboard, plus the RSVP form on a personal invite link (their Yes/No is their RSVP). */
export function useHiddenSections(): string[] {
  const w = useWedding();
  const [invite, setInvite] = useState(false);
  useEffect(() => { setInvite(!!findInvite(w, new URLSearchParams(window.location.search).get("to"))); }, [w]);
  const hidden = w.layout?.hidden ?? [];
  return invite ? [...hidden, "rsvp"] : hidden;
}

export function usePhotoSlot(name: string): PhotoSlot {
  const w = useWedding();
  return (w.photos.slots as Record<string, PhotoSlot>)[name] ?? {};
}
