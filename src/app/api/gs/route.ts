// src/app/api/gs/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GS_URL = process.env.GS_WEBAPP_URL!;
const GS_KEY = process.env.GS_WEBAPP_KEY!;

function jsonError(message: string, extra: any = {}, status = 200) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

async function fetchJson(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, init);
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const text = await res.text();
      return { ok: false, error: 'non_json_from_gs', status: res.status, body: text };
    }
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: String(err) };
  }
}

export async function GET(req: NextRequest) {
  try {
    const route = req.nextUrl.searchParams.get('route') || 'list';
    const url = `${GS_URL}?route=${encodeURIComponent(route)}&key=${encodeURIComponent(GS_KEY)}`;
    const data = await fetchJson(url, { cache: 'no-store' });
    return NextResponse.json(data);
  } catch (e: any) {
    return jsonError(String(e));
  }
}

export async function POST(req: NextRequest) {
  try {
    const route = req.nextUrl.searchParams.get('route') || '';
    const id = req.nextUrl.searchParams.get('id') || '';
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
  } catch (e: any) {
    return jsonError(String(e));
  }
}
