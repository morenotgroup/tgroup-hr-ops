// src/app/api/calendar/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GS_URL = process.env.GS_WEBAPP_URL!;  // ex: https://script.google.com/.../exec
const GS_KEY = process.env.GS_WEBAPP_KEY!;  // ex: tgroup_hrops_...

async function fetchJson(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, cache: 'no-store' });
  const txt = await r.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { ok: false, error: 'non_json_from_gs', status: r.status, body: txt };
  }
}

// GET: lista eventos do calendário
export async function GET(req: NextRequest) {
  // Se não vier rota, padroniza para calendar_list.
  const route = 'calendar_list';
  const url = `${GS_URL}?route=${encodeURIComponent(route)}&key=${encodeURIComponent(GS_KEY)}`;
  const data = await fetchJson(url);
  return NextResponse.json(data);
}

// POST: create/update/delete de eventos do calendário (via ?route=calendar_create|calendar_update|calendar_delete)
export async function POST(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const route = (sp.get('route') || '').toLowerCase();         // calendar_create | calendar_update | calendar_delete
  const id = sp.get('id') || '';
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
