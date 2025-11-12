'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type CalEvent = {
  id?: string;
  title: string;
  description?: string;
  date: string;        // YYYY-MM-DD
  start_time?: string; // HH:mm
  end_time?: string;   // HH:mm
  type?: string;       // ex: "Happy Hour", "Café com T", etc.
  location?: string;
  color?: string;      // hex opcional
  created_at?: string;
  updated_at?: string;
};

async function apiList() {
  const r = await fetch('/api/calendar', { cache: 'no-store' });
  return r.json();
}
async function apiPost(route: 'calendar_create'|'calendar_update'|'calendar_delete', body: any, id?: string) {
  const url = `/api/calendar?route=${route}${id ? `&id=${encodeURIComponent(id)}` : ''}`;
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

const TYPES = [
  { key: 'Café com T',          color: '#9b87f5' },
  { key: 'Aniversariantes',     color: '#22d3ee' },
  { key: 'Happy Hour',          color: '#34d399' },
  { key: 'Workshop/Capacitação',color: '#fbbf24' },
  { key: 'Ação Especial',       color: '#fb7185' },
];

function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function toYMD(d: Date)     { return d.toISOString().slice(0,10); }

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // admin aparece se a URL tiver ?admin=1
  const [isAdmin, setIsAdmin] = useState(false);

  // navegação de mês
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // modal
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CalEvent | null>(null);

  useEffect(() => {
    const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    setIsAdmin(sp?.get('admin') === '1');
  }, []);

  useEffect(() => { refresh(); }, []);
  async function refresh() {
    setLoading(true);
    try {
      const res = await apiList();
      if (res.ok) setEvents(res.data || []);
      else alert(`Erro ao listar: ${res.error || 'desconhecido'}`);
    } catch (e:any) {
      alert(`Falha ao listar: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  const month = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay()+6)%7)); // iniciar na segunda
    const days: Date[] = [];
    for (let i=0;i<42;i++) { const d = new Date(start); d.setDate(start.getDate()+i); days.push(d); }
    return days;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const ev of events) {
      const key = ev.date;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  function colorFor(type?: string, colorHex?: string) {
    if (colorHex) return colorHex;
    const m = TYPES.find(t => t.key === type);
    return m ? m.color : '#60a5fa';
  }

  function openCreate(dateStr?: string) {
    setEditing({
      title: '',
      description: '',
      date: dateStr || toYMD(new Date()),
      start_time: '',
      end_time: '',
      type: '',
      location: '',
      color: '',
    });
    setOpen(true);
  }
  function openEdit(ev: CalEvent) {
    setEditing({ ...ev });
    setOpen(true);
  }

  async function saveEvent() {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const { id, ...patch } = editing;
        const res = await apiPost('calendar_update', patch, id);
        if (!res.ok) return alert(`Falha ao atualizar: ${res.error || 'erro'}`);
      } else {
        const res = await apiPost('calendar_create', editing);
        if (!res.ok) return alert(`Falha ao criar: ${res.error || 'erro'}`);
      }
      setOpen(false);
      setEditing(null);
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent() {
    if (!editing?.id) return;
    if (!confirm('Excluir este evento?')) return;
    const res = await apiPost('calendar_delete', {}, editing.id);
    if (!res.ok) return alert(`Falha ao excluir: ${res.error || 'erro'}`);
    setOpen(false);
    setEditing(null);
    refresh();
  }

  const monthName = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen text-white liquid-bg">
      {/* Topbar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-xs tracking-wider text-white/80 uppercase">Gente e Cultura</div>
            <div className="text-lg font-semibold">Calendário</div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition">
              Voltar ao Kanban
            </Link>
            {isAdmin && (
              <button
                onClick={() => openCreate()}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition"
              >
                + Novo evento
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Navegação do mês */}
        <div className="flex items-center justify-between">
          <button
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth()-1, 1))}
          >
            ← Mês anterior
          </button>
          <div className="text-2xl font-semibold capitalize tracking-wide">{monthName}</div>
          <button
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth()+1, 1))}
          >
            Próximo mês →
          </button>
        </div>

        {/* Legenda */}
        <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-3">
          <div className="flex flex-wrap gap-3 text-sm">
            {TYPES.map(t => (
              <span key={t.key} className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                {t.key}
              </span>
            ))}
          </div>
        </div>

        {/* Grade do mês */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="grid grid-cols-7 gap-3 text-sm text-white/80 mb-2">
            {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {month.map((d, i) => {
              const key = toYMD(d);
              const otherMonth = d.getMonth() !== cursor.getMonth();
              const list = eventsByDay[key] || [];
              return (
                <div
                  key={i}
                  className={`rounded-xl border border-white/10 p-2 min-h-[120px] ${otherMonth ? 'opacity-50' : ''} bg-white/10`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs">{d.getDate()}</div>
                    {isAdmin && (
                      <button
                        onClick={() => openCreate(key)}
                        className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                      >
                        + add
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {list.map(ev => (
                      <button
                        key={ev.id + ev.title}
                        onClick={() => isAdmin && openEdit(ev)}
                        className="w-full text-left rounded-lg px-2 py-1"
                        style={{ background: colorFor(ev.type, ev.color) + '33', border: `1px solid ${colorFor(ev.type, ev.color)}55` }}
                        title={ev.description || ''}
                      >
                        <div className="text-[11px] leading-4 font-semibold">
                          {ev.start_time ? `${ev.start_time} — ` : ''}{ev.title}
                        </div>
                        {ev.type && <div className="text-[10px] opacity-80">{ev.type}</div>}
                      </button>
                    ))}

                    {list.length === 0 && (
                      <div className="text-xs text-white/50">—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="px-4 py-6 text-center text-white/70">
        Plataforma desenvolvida pela área de <b>Gente e Cultura</b> — <b>T.Group</b>. Todos os direitos reservados.
      </footer>

      {/* Modal criar/editar */}
      {open && editing && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/10 backdrop-blur-2xl p-5"
               onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-3">{editing.id ? 'Editar evento' : 'Novo evento'}</div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm text-white/80">Título</label>
                <input className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                       value={editing.title}
                       onChange={e => setEditing(s => ({...s!, title: e.target.value}))}/>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-white/80">Descrição</label>
                <textarea className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none min-h-[90px]"
                          value={editing.description || ''}
                          onChange={e => setEditing(s => ({...s!, description: e.target.value}))}/>
              </div>

              <div>
                <label className="text-sm text-white/80">Data</label>
                <input type="date" className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                       value={editing.date}
                       onChange={e => setEditing(s => ({...s!, date: e.target.value}))}/>
              </div>

              <div>
                <label className="text-sm text-white/80">Tipo</label>
                <select className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                        value={editing.type || ''}
                        onChange={e => setEditing(s => ({...s!, type: e.target.value}))}>
                  <option value=""></option>
                  {TYPES.map(t => <option key={t.key} value={t.key}>{t.key}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/80">Início</label>
                <input type="time" className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                       value={editing.start_time || ''}
                       onChange={e => setEditing(s => ({...s!, start_time: e.target.value}))}/>
              </div>

              <div>
                <label className="text-sm text-white/80">Fim</label>
                <input type="time" className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                       value={editing.end_time || ''}
                       onChange={e => setEditing(s => ({...s!, end_time: e.target.value}))}/>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-white/80">Local</label>
                <input className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                       value={editing.location || ''}
                       onChange={e => setEditing(s => ({...s!, location: e.target.value}))}/>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                {editing.id && (
                  <button onClick={deleteEvent} className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600" type="button">
                    Excluir
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20" type="button">
                  Cancelar
                </button>
                <button onClick={saveEvent} disabled={saving}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60" type="button">
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* “Liquid glass” mais intenso */}
      <style jsx global>{`
        .liquid-bg {
          background:
            radial-gradient(60% 60% at 10% 20%, rgba(99,102,241,0.25), transparent 60%),
            radial-gradient(60% 60% at 90% 10%, rgba(16,185,129,0.25), transparent 60%),
            radial-gradient(50% 60% at 50% 80%, rgba(56,189,248,0.2), transparent 60%),
            #0b1320;
          animation: blobMove 24s ease-in-out infinite alternate;
        }
        @keyframes blobMove {
          0% { background-position: 0% 0%, 100% 0%, 50% 100%; }
          100%{ background-position: 10% 10%, 90% 5%, 48% 90%; }
        }
      `}</style>
    </div>
  );
}
