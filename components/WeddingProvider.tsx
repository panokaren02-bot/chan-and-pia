"use client";
import { createContext, useContext } from "react";
import { defaultWedding, type PhotoSlot, type Wedding } from "@/lib/wedding";

const Ctx = createContext<Wedding>(defaultWedding);

export function WeddingProvider({ value, children }: { value: Wedding; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useWedding = () => useContext(Ctx);

export function usePhotoSlot(name: string): PhotoSlot {
  const w = useWedding();
  return (w.photos.slots as Record<string, PhotoSlot>)[name] ?? {};
}
