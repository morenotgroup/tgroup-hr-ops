/* Next.js App Router API Route – Proxy p/ Google Apps Script
   - Sempre anexa ?key=GS_WEBAPP_KEY nas chamadas
   - Repassa query params (route, id…) e body JSON (POST)
   - Converte qualquer resposta não-JSON em erro amigável
*/
import { NextResponse } from "next/server";

export const runtime = "nodejs";          // garante Node (não edge)
export const dynamic = "force-dynamic";   // sem cache do build

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
  return proxyToGS(req);
}

export async function POST(req: Request) {
  return proxyToGS(req);
}

async function proxyToGS(req: Request) {
  const gsUrl = process.env.GS_WEBAPP_URL;
  const gsKey = process.env.GS_WEBAPP_KEY;

  if (!gsUrl || !gsKey) {
    return NextResponse.json(
      { ok: false, error: "missing_env", detail: "GS_WEBAPP_URL/KEY ausentes" },
      { status: 500, headers: corsHeaders() }
    );
  }

  const incoming = new URL(req.url);
  const route = incoming.searchParams.get("route") ?? "list";
  const id = incoming.searchParams.get("id") ?? undefined;

  const target = new URL(gsUrl);
  target.searchParams.set("route", route);
  if (id) target.searchParams.set("id", id);
  target.searchParams.set("key", gsKey); // <-- chave sempre no servidor

  const isGet = req.method === "GET";
  const init: RequestInit = {
    method: isGet ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
  };

  if (!isGet) {
    const text = await req.text();
    init.body = text && text.trim() ? text : "{}";
  }

  let gsRes: Response;
  try {
    gsRes = await fetch(target.toString(), init);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "fetch_failed", detail: String(e) },
      { status: 502, headers: corsHeaders() }
    );
  }

  const raw = await gsRes.text();
  try {
    const json = JSON.parse(raw);
    // normaliza payload do GS
    return NextResponse.json(json, { status: 200, headers: corsHeaders() });
  } catch {
    // GS respondeu HTML/erro
    return NextResponse.json(
      { ok: false, error: "non_json_from_gs", body: raw.slice(0, 400) },
      { status: 200, headers: corsHeaders() }
    );
  }
}
