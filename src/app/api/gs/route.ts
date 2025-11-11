import { NextResponse } from 'next/server';

const BASE = process.env.GS_WEBAPP_URL!;
const KEY  = process.env.GS_WEBAPP_KEY!;

function url(route: string, id?: string) {
  const u = new URL(BASE);
  u.searchParams.set('route', route);
  u.searchParams.set('key', KEY);
  if (id) u.searchParams.set('id', id);
  return u.toString();
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const route = u.searchParams.get('route') || 'list';
    const target = url(route);
    const r = await fetch(target, { cache: 'no-store' });
    const data = await r.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const u = new URL(req.url);
    const route = u.searchParams.get('route') || '';
    const id = u.searchParams.get('id') || undefined;
    const body = await req.json().catch(() => ({}));
    const target = url(route, id);
    const r = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, key: KEY }),
    });
    const data = await r.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
