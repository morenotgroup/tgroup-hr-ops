export const runtime = "edge";

const GS_URL = process.env.GS_WEBAPP_URL;  // sua URL /exec do Apps Script
const GS_KEY = process.env.GS_WEBAPP_KEY;  // mesma chave do API_KEY no Script

function j(data: any, status = 200) {
  return new Response(typeof data === "string" ? data : JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function withKey(url: string) {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key=${encodeURIComponent(GS_KEY || "")}`;
}

async function forward(url: string, init?: RequestInit) {
  if (!GS_URL) return j({ ok:false, error:"GS_WEBAPP_URL missing" }, 500);
  if (!GS_KEY) return j({ ok:false, error:"GS_WEBAPP_KEY missing" }, 500);

  try {
    const res = await fetch(withKey(url), init);
    const text = await res.text();
    try {
      const asJson = JSON.parse(text);
      return j(asJson, res.status);
    } catch {
      // se o Apps Script respondeu HTML (login, etc.), devolvemos algo legível
      return j({ ok:false, status: res.status, error:"non_json_from_gs", body: text.slice(0,180) }, 502);
    }
  } catch (e: any) {
    return j({ ok:false, error:"edge_fetch_failed", details:String(e?.message||e) }, 502);
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const route = u.searchParams.get("route") || "list";
  const id    = u.searchParams.get("id") || "";
  let url = `${GS_URL}?route=${encodeURIComponent(route)}`;
  if (id) url += `&id=${encodeURIComponent(id)}`;
  return forward(url);
}

export async function POST(req: Request) {
  const u = new URL(req.url);
  let body: any = {};
  try { body = await req.json(); } catch {}

  const route = body?.route || u.searchParams.get("route") || "";
  const id    = body?.id    || u.searchParams.get("id")    || "";

  const payload =
    body?.body !== undefined ? body.body :
    (body?.route || body?.id) === undefined ? body : {};

  if (!route) return j({ ok:false, error:"route missing" }, 400);

  let url = `${GS_URL}?route=${encodeURIComponent(route)}`;
  if (id) url += `&id=${encodeURIComponent(id)}`;

  return forward(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(payload ?? {}),
  });
}
