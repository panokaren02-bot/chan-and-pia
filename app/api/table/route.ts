import { NextResponse } from "next/server";
import { findTables } from "@/lib/seating";

// Public: GET /api/table?q=<name>  →  { ok, matches: [{ name, table, guests }] }
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    return NextResponse.json({ ok: true, matches: await findTables(q) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("Table lookup failed", e);
    return NextResponse.json({ ok: false, error: "We couldn’t look that up. Please ask an usher." }, { status: 502 });
  }
}
