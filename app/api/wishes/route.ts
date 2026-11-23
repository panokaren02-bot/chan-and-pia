import { NextResponse } from "next/server";
import { getWishes } from "@/lib/wishes";

export const dynamic = "force-dynamic";

export async function GET() {
  const wishes = await getWishes();
  return NextResponse.json({ ok: true, wishes }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}
