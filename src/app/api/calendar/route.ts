import { NextRequest, NextResponse } from 'next/server';

const GS_URL = process.env.GS_WEBAPP_URL!;    // mesmo Apps Script
const GS_KEY = process.env.GS_WEBAPP_KEY!;    // mesma chave
const CAL_PIN = process.env.CAL_ADMIN_PIN!;   // PIN secreto no servidor

function jerr(msg:string, status=200){ return NextResponse.json({ok:false, error:msg},{status}); }

async function fetchJson(url:string, init?:RequestInit){
  try{
    const res = await fetch(url, init);
    const ct = res.headers.get('content-type')||'';
    if(!ct.includes('application/json')){ const t = await res.text(); return { ok:false, error:'non_json_from_gs', status:res.status, body:t }; }
    return await res.json();
  }catch(e:any){ return { ok:false, error:String(e) }; }
}

export async function GET(req: NextRequest){
  const route = req.nextUrl.searchParams.get('route') || 'calendar_list';
  const url = `${GS_URL}?route=${encodeURIComponent(route)}&key=${encodeURIComponent(GS_KEY)}`;
  const data = await fetchJson(url, { cache: 'no-store' });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest){
  const route = req.nextUrl.searchParams.get('route') || '';
  const id    = req.nextUrl.searchParams.get('id') || '';
  const pin   = req.headers.get('x-admin-pin') || '';
  if(!pin || pin !== CAL_PIN) return jerr('forbidden');

  const body = await req.json().catch(()=>({}));
  const payload = JSON.stringify({ ...body, key: GS_KEY });
  const url = `${GS_URL}?route=${encodeURIComponent(route)}${id?`&id=${encodeURIComponent(id)}`:''}`;
  const data = await fetchJson(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: payload, cache:'no-store' });
  return NextResponse.json(data);
