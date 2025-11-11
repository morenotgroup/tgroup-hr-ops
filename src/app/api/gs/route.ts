// src/app/api/gs/route.ts
import type { NextRequest } from 'next/server';

const GS_URL = process.env.GS_WEBAPP_URL!;
const GS_KEY = process.env.GS_WEBAPP_KEY!;

/** Faz fetch e respeita quando o upstream não retorna JSON */
async function fetchFromGS(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(url, {
    // garante que Vercel não cacheie a lista por engano
    cache: 'no-store',
    ...init,
    // 15s costuma ser suficiente para Apps Script
    next: { revalidate: 0 },
  });

  const ctype = res.headers.get('content-type') || '';
  if (ctype.includes('application/json')) {
    const json = await res.json();
    return Response.json(json, { status: res.status });
  } else {
    const text = await res.text();
    // normaliza para JSON para o front nunca quebrar em .json()
    return Response.json(
      { ok: false, status: res.status, error: 'upstream_non_json', body: text },
      { status: 200 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const route = searchParams.get('route') || 'list';
  // adiciona key pela query (o backend também aceita pelo body)
  const to = `${GS_URL}?route=${encodeURIComponent(route)}&key=${encodeURIComponent(GS_KEY)}`;
  return fetchFromGS(to);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const route = (body?.route || '').toLowerCase();
  const payload = {
    ...(body?.body || {}),
    key: GS_KEY,
  };

  const to = `${GS_URL}?route=${encodeURIComponent(route)}`;
  return fetchFromGS(to, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
