export const runtime = "edge";

const GS_URL = process.env.GS_WEBAPP_URL;   // ex.: https://script.google.com/.../exec
const GS_KEY = process.env.GS_WEBAPP_KEY;   // sua chave, nunca exposta ao cliente

function json(data: any, status = 200) {
  return new Response(typeof data === "string" ? data : JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function withKey(url: string) {
  const hasQuery = url.includes("?");
  const sep = hasQuery ? "&" : "?";
  return `${url}${sep}key=${encodeURIComponent(GS_KEY || "")}`;
}

export async function GET(req: Request) {
  try {
    if (!GS_URL) return json({ ok:false, error:"GS_WEBAPP_URL não configurado" }, 500);
    const u = new URL(req.url);
    const route = u.searchParams.get("route") || "list";
    const id = u.searchParams.get("id") || "";

    let url = `${GS_URL}?route=${encodeURIComponent(route)}`;
    if (id) url += `&id=${encodeURIComponent(id)}`;
    url = withKey(url);

    const gs = await fetch(url, { cache: "no-store" });
    const txt = await gs.text();

    return new Response(txt, { status: gs.status, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return json({ ok:false, error: e?.message || "GET proxy error" }, 500);
  }
}

export async function POST(req: Request) {
  try {
    if (!GS_URL) return json({ ok:false, error:"GS_WEBAPP_URL não configurado" }, 500);

    const u = new URL(req.url);
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    const route = body?.route || u.searchParams.get("route") || "";
    const id    = body?.id    || u.searchParams.get("id")    || "";

    // payload:
    const payload =
      body?.body !== undefined
        ? body.body
        : (body?.route || body?.id) === undefined
          ? body
          : {};

    if (!route) return json({ ok:false, error:"route ausente no POST" }, 400);

    let url = `${GS_URL}?route=${encodeURIComponent(route)}`;
    if (id) url += `&id=${encodeURIComponent(id)}`;
    url = withKey(url);

    const gs = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });

    const txt = await gs.text();
    return new Response(txt, { status: gs.status, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return json({ ok:false, error: e?.message || "POST proxy error" }, 500);
  }
}
