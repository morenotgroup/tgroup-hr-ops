export const runtime = "edge";

const GS_URL = process.env.GS_WEBAPP_URL;
if (!GS_URL) {
  // Ajuda a diagnosticar env faltando
  console.warn("GS_WEBAPP_URL não definido. Configure nas Env Vars da Vercel.");
}

function jsonResponse(data: any, status = 200) {
  return new Response(typeof data === "string" ? data : JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const route = u.searchParams.get("route") || "list";
    const id = u.searchParams.get("id") || "";

    const url = id
      ? `${GS_URL}?route=${encodeURIComponent(route)}&id=${encodeURIComponent(id)}`
      : `${GS_URL}?route=${encodeURIComponent(route)}`;

    const gs = await fetch(url, { cache: "no-store" });
    const txt = await gs.text();

    // repassa status e corpo (JSON/Texto)
    return new Response(txt, {
      status: gs.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return jsonResponse({ ok: false, error: e?.message || "GET proxy error" }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const u = new URL(req.url);

    // Aceita tanto rota em query (?route=create) quanto no JSON ({route:'create'})
    let bodyJson: any = {};
    try { bodyJson = await req.json(); } catch { bodyJson = {}; }

    const route =
      bodyJson?.route ||
      u.searchParams.get("route") || // compatível com o front antigo
      "";

    const id =
      bodyJson?.id ||
      u.searchParams.get("id") ||
      "";

    // Descobre o payload real:
    // - se veio {route, body:{...}} -> usa body
    // - se veio payload puro (sem route), usa o próprio JSON
    const payload =
      bodyJson?.body !== undefined
        ? bodyJson.body
        : (bodyJson?.route || bodyJson?.id) === undefined
          ? bodyJson
          : {};

    if (!route) {
      return jsonResponse({ ok: false, error: "route ausente no POST" }, 400);
    }

    const url = id
      ? `${GS_URL}?route=${encodeURIComponent(route)}&id=${encodeURIComponent(id)}`
      : `${GS_URL}?route=${encodeURIComponent(route)}`;

    const gs = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });

    const txt = await gs.text();
    return new Response(txt, {
      status: gs.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return jsonResponse({ ok: false, error: e?.message || "POST proxy error" }, 500);
  }
}
