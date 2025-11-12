import { NextResponse } from 'next/server';

const GS_URL = process.env.GS_WEBAPP_URL!;
const GS_KEY = process.env.GS_WEBAPP_KEY!;

async function fetchJson(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { ok:false, error:text || 'invalid_json' }; }
}

export async function GET() {
  // Lista sempre via calendar_list e manda a key na query
  const url = `${GS_URL}?route=calendar_list&key=${encodeURIComponent(GS_KEY)}`;
  const data = await fetchJson(url, { cache: 'no-store' });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const route = (searchParams.get('route') || '').toLowerCase();
  const id = searchParams.get('id') || '';
  const body = await req.json().catch(() => ({}));
  const payload = JSON.stringify({ ...body, key: GS_KEY });

  const url = `${GS_URL}?route=${encodeURIComponent(route)}${id ? `&id=${encodeURIComponent(id)}` : ''}`;
  const data = await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    cache: 'no-store',
  });
  return NextResponse.json(data);
}
