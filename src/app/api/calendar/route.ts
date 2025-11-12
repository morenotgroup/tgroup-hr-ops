// src/app/api/calendar/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GS_URL = process.env.GS_WEBAPP_URL!;      // https://script.google.com/.../exec
const GS_KEY = process.env.GS_WEBAPP_KEY!;      // tgroup_hrops_...

async function fetchJson(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, cache: 'no-store' });
  const txt = await r.text();
  try { return JSON.parse(txt); } catch {
    return { ok: false, status: r.status, error: 'non_json_from_gs', body: txt };
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  // se vier `list`, trocamos para `calendar_list`
  const route = (sp.get('route') || 'calendar_list')
    .replace(/^list$/, 'calendar_list');

  const url = `${GS_URL}?route=${encodeURIComponent(route)}&key=${encodeURIComponent(GS_KEY)}`;
  const data = await fetchJson(url);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get('id') || '';
  // aceitamos: calendar_create | calendar_update | calendar_delete
  const route = (sp.get('route') || '').toLowerCase();
  const body = await req.json().catch(() => ({}));

  const payload = JSON.stringify({ ...body, key: GS_KEY });
  const url = `${GS_URL}?route=${encodeURIComponent(route)}${id ? `&id=${encodeURIComponent(id)}` : ''}`;
  const data = await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
  return NextResponse.json(data);
}
