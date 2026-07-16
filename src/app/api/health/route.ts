import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Container healthcheck target — no DB touch, just "is the server up".
export async function GET() {
  return NextResponse.json({ ok: true, service: "torpasgas" });
}
