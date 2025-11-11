// src/app/api/gs/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // mais rápido na Vercel

const WEBAPP = process.env.GS_WEBAPP_URL!; // ex.: https://script.google.com/macros/s/AKfy.../exec
const KEY    = process.env.GS_WEBAPP_KEY!; // ex.: tgroup_hrops_9eC3ZqFvK7

function bad(msg: string, status = 200, body = "") {
  return NextResponse.json({ ok: false, status, error: msg, body: body.slice(0, 200) });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    url.searchParams.set("key", KEY); // injeta a key no GET
    const target = `${WEBAPP}?${url.searchParams.toString()}`;

    const res  = await fetch(target, { method: "GET", headers: { "cache-control": "no-cache" }});
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text)); }
    catch { return bad("non_json_from_gs", res.status, text); }
  } catch (e: any) {
    return bad(String(e));
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const route = url.searchParams.get("route") ?? "create";

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    const payload = JSON.stringify({ ...body, key: KEY }); // injeta a key no POST
    const target  = `${WEBAPP}?route=${encodeURIComponent(route)}`;

    const res  = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text)); }
    catch { return bad("non_json_from_gs", res.status, text); }
  } catch (e: any) {
    return bad(String(e));
  }
}
