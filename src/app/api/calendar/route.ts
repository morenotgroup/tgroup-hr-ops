import { NextRequest, NextResponse } from 'next/server';

const GS_URL = process.env.GS_WEBAPP_URL!;
const GS_KEY = process.env.GS_WEBAPP_KEY!;

async function fetchJson(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, status: r.status, error: 'non_json_from_gs', body: text.slice(0, 200) };
  }
}

/** GET -> lista todos os eventos do Calendar */
export async function GET(req: NextRequest) {
  const url = `${GS_URL}?route=calendar_list&key=${encodeURIComponent(GS_KEY)}`;
  const data = await fetchJson(url, { cache: 'no-store' });
  return NextResponse.json(data);
}

/** POST -> create/update/delete do Calendar */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const route = (searchParams.get('route') || '').toLowerCase();
  const id    = searchParams.get('id') || '';

  const allowed = new Set(['calendar_create','calendar_update','calendar_delete']);
  if (!allowed.has(route)) {
    return NextResponse.json({ ok:false, error:'invalid_route' }, { status: 400 });
  }

  const body    = await req.json().catch(() => ({}));
  const payload = JSON.stringify({ ...body, key: GS_KEY });
  const url = `${GS_URL}?route=${encodeURIComponent(route)}${id ? `&id=${encodeURIComponent(id)}` : ''}`;

  const data = await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: payload,
    cache: 'no-store',
  });

  return NextResponse.json(data);
}
