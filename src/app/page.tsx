import Link from 'next/link';

'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/gs';
const CAL_API = '/api/calendar';

/** ===== Tipos ===== */
type Task = {
  id?: string;
  title?: string;
  description?: string;
  owner?: string;
  requester?: string;
  company?: string;
  area?: string;
  priority?: 'P1' | 'P2' | 'P3' | string; // P1 Alta, P2 Média, P3 Baixa
  status?: 'Aguardando' | 'Em Progresso' | 'UTI' | 'Concluído' | string;
  due_date?: string; // yyyy-mm-dd
  labels?: string;
  created_at?: string;
  updated_at?: string;
};

/** Calendário */
export type CalEvent = {
  id?: string;
  title: string;
  description?: string;
  date: string;        // yyyy-mm-dd
  start_time?: string; // HH:mm
  end_time?: string;   // HH:mm
  type?: string;       // "Happy Hour", "Café com T", etc.
  location?: string;
  color?: string;      // opcional (#hex)
  created_at?: string;
  updated_at?: string;
};

/** ===== API helpers (Tasks) ===== */
async function asJsonSafe(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Resposta não JSON do proxy: ${text.slice(0, 120)}…`);
  }
  return res.json();
}

async function apiList() { const r = await fetch(`${API_BASE}?route=list`, { cache: 'no-store' }); return asJsonSafe(r); }
async function apiCreate(task: Task) {
  const r = await fetch(`${API_BASE}?route=create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task) });
  return asJsonSafe(r);
}
async function apiUpdate(id: string, patch: Partial<Task>) {
  const r = await fetch(`${API_BASE}?route=update&id=${encodeURIComponent(id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  return asJsonSafe(r);
}
async function apiDelete(id: string) {
  const r = await fetch(`${API_BASE}?route=delete&id=${encodeURIComponent(id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  return asJsonSafe(r);
}

/** ===== API helpers (Calendar) ===== */
async function calList() {
  const r = await fetch(`${CAL_API}?route=calendar_list`, { cache: 'no-store' });
  return asJsonSafe(r);
}
async function calCreate(ev: CalEvent, pin: string) {
  const r = await fetch(`${CAL_API}?route=calendar_create`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin }, body: JSON.stringify(ev) });
  return asJsonSafe(r);
}
async function calUpdate(id: string, patch: Partial<CalEvent>, pin: string) {
  const r = await fetch(`${CAL_API}?route=calendar_update&id=${encodeURIComponent(id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin }, body: JSON.stringify(patch) });
  return asJsonSafe(r);
}
async function calDelete(id: string, pin: string) {
  const r = await fetch(`${CAL_API}?route=calendar_delete&id=${encodeURIComponent(id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin }, body: JSON.stringify({}) });
  return asJsonSafe(r);
}

/** ===== Constantes de UI ===== */
const COMPANIES = [
  'T Group',
  'T Youth — Toy Formaturas',
  'T Youth — Neo Formaturas',
  'T Dreams',
  'T Brands',
  'T Venues',
  'Mood',
  'WAS',
];

const AREAS = [
  'Admissão & Demissão',
  'Recrutamento',
  'Folha',
  'Facilities',
  'Benefícios & Parcerias',
  'Onboarding',
  'Políticas & Compliance',
  'Cultura & Eventos',
  'Desenvolvimento & Treinamento',
  'Facilities — Limpeza',
  'Facilities — Cozinha',
  'Facilities — Estoque de Bebidas',
  'Jurídico (pessoal)',
  'Financeiro (pessoal)',
];

const PRIORITY_UI = [
  { label: 'Alta',  value: 'P1' },
  { label: 'Média', value: 'P2' },
  { label: 'Baixa', value: 'P3' },
] as const;

const COLUMNS = [
  { key: 'Aguardando',   title: 'Aguardando' },
  { key: 'Em Progresso', title: 'Em Progresso' },
  { key: 'UTI',          title: 'UTI' },
  { key: 'Concluído',    title: 'Concluído' },
] as const;

/** ===== Página ===== */
export default function Page() {
  const [view, setView] = useState<'kanban' | 'dashboard' | 'calendar'>('kanban');

  // ------- TASKS -------
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // criar
  const [openCreate, setOpenCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createTask, setCreateTask] = useState<Task>({
    title: '',
    description: '',
    owner: 'Moreno',
    requester: 'Moreno',
    company: COMPANIES[0],
    area: AREAS[0],
    priority: 'P2',
    status: 'Aguardando',
    due_date: '',
    labels: '',
  });

  // editar
  const [openEdit, setOpenEdit] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await apiList();
      if (res.ok) setTasks(res.data || []); else alert(`Erro ao listar: ${res.error || 'desconhecido'}`);
    } catch (e: any) { alert(`Falha ao listar: ${String(e)}`); }
    finally { setLoading(false); }
  }

  const byCol = useMemo(() => {
    const m: Record<string, Task[]> = {};
    (COLUMNS as readonly {key:string}[]).forEach(c => m[c.key] = []);
    for (const t of tasks) {
      const k = (t.status as any) || 'Aguardando';
      (m[k] ||= []).push(t);
    }
    return m;
  }, [tasks]);

  function onDragStart(e: React.DragEvent, taskId?: string) { if (!taskId) return; e.dataTransfer.setData('text/plain', taskId); e.dataTransfer.effectAllowed = 'move'; }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
  async function onDrop(e: React.DragEvent, dest: any) {
    e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (!id) return;
    const res = await apiUpdate(id, { status: dest }); if (!res.ok) return alert(`Falha ao mover: ${res.error || 'erro'}`);
    refresh();
  }

  async function handleCreate() {
    if (!createTask.title?.trim()) { alert('Preencha o título.'); return; }
    setSaving(true);
    try {
      const res = await apiCreate({ ...createTask, title: createTask.title!.trim() });
      if (!res.ok) { alert(`Falha ao salvar: ${res.error || 'erro'}`); return; }
      setOpenCreate(false);
      setCreateTask({ title:'', description:'', owner:'Moreno', requester:'Moreno', company:COMPANIES[0], area:AREAS[0], priority:'P2', status:'Aguardando', due_date:'', labels:'' });
      refresh();
    } catch (e: any) { alert(`Falha ao salvar: ${String(e)}`); } finally { setSaving(false); }
  }
  function openEditModal(t: Task) { setEditTask({ ...t }); setOpenEdit(true); }
  async function handleUpdate() {
    if (!editTask?.id) return; setUpdating(true);
    try { const { id, ...patch } = editTask; const res = await apiUpdate(id!, patch); if (!res.ok) return alert(`Falha ao atualizar: ${res.error || 'erro'}`); setOpenEdit(false); setEditTask(null); refresh(); }
    catch (e:any){ alert(`Falha ao atualizar: ${String(e)}`);} finally { setUpdating(false); }
  }
  async function quickDone(id?: string) { if (!id) return; const r = await apiUpdate(id, { status:'Concluído' }); if (!r.ok) return alert(`Falha ao concluir: ${r.error||'erro'}`); refresh(); }
  async function handleDelete() { if (!editTask?.id) return; if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return; const r = await apiDelete(editTask.id); if (!r.ok) return alert(`Falha ao excluir: ${r.error||'erro'}`); setOpenEdit(false); setEditTask(null); refresh(); }

  // ------- CALENDAR -------
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [adminPin, setAdminPin] = useState<string | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => { const d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [openEventModal, setOpenEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);

  useEffect(() => { if (view==='calendar') loadEvents(); }, [view]);

  async function loadEvents() {
    setCalLoading(true);
    try { const res = await calList(); if (res.ok) setEvents(res.data || []); else alert(`Cal err: ${res.error}`); }
    catch(e:any){ alert(`Falha ao carregar calendário: ${String(e)}`); }
    finally{ setCalLoading(false);} }

  function openAdmin() {
    const pin = prompt('PIN de edição (GC):');
    if (pin && pin.length>0) { sessionStorage.setItem('cal_admin_pin', pin); setAdminPin(pin); alert('Modo edição ativado.'); }
  }
  function leaveAdmin() { sessionStorage.removeItem('cal_admin_pin'); setAdminPin(null); }
  useEffect(()=>{ const p=sessionStorage.getItem('cal_admin_pin'); if(p) setAdminPin(p); },[]);

  function startNewEvent(dateISO: string) {
    if (!adminPin) return; // somente admin
    setEditingEvent({ title:'', date: dateISO, type:'Ação GC', start_time:'10:00', end_time:'11:00', location:'', description:'' });
    setOpenEventModal(true);
  }
  function openEditEvent(ev: CalEvent) { if (!adminPin) return; setEditingEvent({ ...ev }); setOpenEventModal(true); }

  async function saveEvent() {
    if (!adminPin || !editingEvent) return; setSavingEvent(true);
    try {
      if (editingEvent.id) {
        const { id, ...patch } = editingEvent; const r = await calUpdate(id, patch, adminPin); if (!r.ok) return alert(`Falha ao atualizar: ${r.error}`);
      } else {
        const r = await calCreate(editingEvent, adminPin); if (!r.ok) return alert(`Falha ao criar: ${r.error}`);
      }
      setOpenEventModal(false); setEditingEvent(null); loadEvents();
    } catch(e:any){ alert(String(e)); } finally { setSavingEvent(false); }
  }
  async function deleteEvent() {
    if (!adminPin || !editingEvent?.id) return; if(!confirm('Excluir este evento?')) return;
    const r = await calDelete(editingEvent.id, adminPin); if (!r.ok) return alert(`Falha ao excluir: ${r.error}`);
    setOpenEventModal(false); setEditingEvent(null); loadEvents();
  }

  // ===== Render =====
  return (
    <div className="min-h-screen text-white liquid-bg">
      {/* Topbar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-xs tracking-wider text-white/80 uppercase">Gente e Cultura</div>
            <div className="text-lg font-semibold">HR Ops</div>
          </div>

          <div className="flex items-center gap-3">
  <Link
    href="/calendar"
    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition"
  >
    Calendário
  </Link>

  <button
    onClick={() => setView(v => (v === 'kanban' ? 'dashboard' : 'kanban'))}
    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition"
  >
    {view === 'kanban' ? 'Dashboard' : 'Voltar ao Kanban'}
  </button>

  <button
    onClick={() => setOpenCreate(true)}
    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition"
  >
    + Criar tarefa
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'dashboard' && (
          <MegaDashboard tasks={tasks} loading={loading} />
        )}

        {view === 'kanban' && (
          loading ? <div className="text-white/80">Carregando…</div> : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {COLUMNS.map((col) => (
                <section key={col.key} className="flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl" onDragOver={onDragOver} onDrop={(e) => onDrop(e, col.key)}>
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="font-semibold">{col.title}</h2>
                    <span className="text-sm text-white/70">{byCol[col.key]?.length ?? 0}</span>
                  </div>
                  <div className="p-3 space-y-3 h-[calc(100vh-240px)] overflow-y-auto">
                    {(byCol[col.key] || []).map((t) => (
                      <article key={t.id} draggable onDragStart={(e) => onDragStart(e, t.id)} onClick={() => openEditModal(t)} className="rounded-xl border border-white/10 bg-white/10 p-3 cursor-pointer hover:bg-white/15 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="font-medium">{t.title}</div>
                            <div className="text-sm text-white/70">{t.company} • {t.area}</div>
                            {t.due_date && <div className="text-xs text-white/60">Prazo: {new Date(t.due_date).toLocaleDateString('pt-BR')}</div>}
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <span className="text-xs px-2 py-1 rounded bg-white/15">{PRIORITY_UI.find(p=>p.value===t.priority)?.label ?? t.priority}</span>
                            {t.id && t.status !== 'Concluído' && (
                              <button className="text-xs px-2 py-1 rounded bg-emerald-400/20 hover:bg-emerald-400/30" onClick={(e)=>{e.stopPropagation(); quickDone(t.id);}}>Concluir</button>
                            )}
                          </div>
                        </div>
                        {t.description && <p className="mt-2 text-sm text-white/80 line-clamp-3">{t.description}</p>}
                      </article>
                    ))}
                    {(!byCol[col.key] || byCol[col.key].length === 0) && (<div className="text-white/50 text-sm">Sem itens</div>)}
                  </div>
                </section>
              ))}
            </div>
          )
        )}

        {view === 'calendar' && (
          <CalendarBoard
            events={events}
            loading={calLoading}
            monthCursor={monthCursor}
            setMonthCursor={setMonthCursor}
            adminPin={adminPin}
            onEnterAdmin={openAdmin}
            onLeaveAdmin={leaveAdmin}
            onReload={loadEvents}
            onCreateAt={startNewEvent}
            onOpenEvent={openEditEvent}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-white/70">
        Plataforma desenvolvida pela área de <b>Gente e Cultura</b> — <b>T.Group</b>. Todos os direitos reservados.
      </footer>

      {/* Modais de Tarefas */}
      {openCreate && (
        <Modal onClose={() => setOpenCreate(false)}>
          <div className="text-lg font-semibold mb-3">Criar tarefa</div>
          <TaskForm task={createTask} onChange={setCreateTask} submitLabel={saving ? 'Salvando…' : 'Salvar'} onSubmit={handleCreate} onCancel={() => setOpenCreate(false)} disabled={saving} />
        </Modal>
      )}
      {openEdit && editTask && (
        <Modal onClose={() => setOpenEdit(false)}>
          <div className="text-lg font-semibold mb-3">Editar tarefa</div>
          <TaskForm task={editTask} onChange={setEditTask as any} submitLabel={updating ? 'Atualizando…' : 'Salvar alterações'} onSubmit={handleUpdate} onCancel={() => setOpenEdit(false)} extraRight={<button onClick={handleDelete} className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600" type="button">Excluir</button>} disabled={updating} allowStatus />
        </Modal>
      )}

      {/* Modal de Evento do Calendário */}
      {openEventModal && editingEvent && (
        <Modal onClose={() => setOpenEventModal(false)}>
          <div className="text-lg font-semibold mb-3">{editingEvent.id ? 'Editar' : 'Novo'} evento</div>
          <EventForm ev={editingEvent} onChange={setEditingEvent as any} onCancel={()=>setOpenEventModal(false)} onSubmit={saveEvent} onDelete={editingEvent.id ? deleteEvent : undefined} submitting={savingEvent} />
        </Modal>
      )}
    </div>
  );
}

/** ===== Dashboard avançado (sem libs) ===== */
function MegaDashboard({ tasks, loading }: { tasks: Task[]; loading: boolean }) {
  const kpis = useMemo(() => {
    const total = tasks.length;
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byArea: Record<string, number> = {};
    const byCompany: Record<string, number> = {};
    for (const t of tasks) {
      byStatus[t.status || 'Aguardando'] = (byStatus[t.status || 'Aguardando'] || 0) + 1;
      byPriority[t.priority || 'P2'] = (byPriority[t.priority || 'P2'] || 0) + 1;
      if (t.area) byArea[t.area] = (byArea[t.area] || 0) + 1;
      if (t.company) byCompany[t.company] = (byCompany[t.company] || 0) + 1;
    }
    return { total, byStatus, byPriority, byArea, byCompany };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Tarefas" value={loading ? '…' : String(kpis.total)} subtitle="Total cadastrado" />
        <KpiCard title="Em Progresso" value={loading ? '…' : String(kpis.byStatus['Em Progresso'] || 0)} subtitle="Fluxo ativo" />
        <KpiCard title="Aguardando" value={loading ? '…' : String(kpis.byStatus['Aguardando'] || 0)} subtitle="À espera de início" />
        <KpiCard title="UTI" value={loading ? '…' : String(kpis.byStatus['UTI'] || 0)} subtitle="Críticas/impeditivos" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard title="Prioridade (P1/P2/P3)">
          <Donut data={[
            { label: 'Alta',  value: (kpis.byPriority['P1'] || 0), color: '#ef4444' },
            { label: 'Média', value: (kpis.byPriority['P2'] || 0), color: '#f59e0b' },
            { label: 'Baixa', value: (kpis.byPriority['P3'] || 0), color: '#10b981' },
          ]} />
        </GlassCard>
        <GlassCard title="Por status">
          <Bars data={[
            { label: 'Aguardando',   value: kpis.byStatus['Aguardando']   || 0 },
            { label: 'Em Progresso', value: kpis.byStatus['Em Progresso'] || 0 },
            { label: 'UTI',          value: kpis.byStatus['UTI']          || 0 },
            { label: 'Concluído',    value: kpis.byStatus['Concluído']    || 0 },
          ]} />
        </GlassCard>
        <GlassCard title="Top áreas (Top 6)">
          <Bars data={Object.entries(kpis.byArea).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([label,value])=>({label, value}))} />
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Distribuição por empresa (Top 6)">
          <Bars data={Object.entries(kpis.byCompany).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([label,value])=>({label, value}))} />
        </GlassCard>
        <GlassCard title="Evolução (criados por dia)">
          <LineMini data={groupByDate(tasks)} />
        </GlassCard>
      </div>
    </div>
  );
}

function KpiCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-4">
      <div className="text-white/70 text-sm">{title}</div>
      <div className="text-4xl font-semibold mt-1">{value}</div>
      {subtitle && <div className="text-white/60 text-xs mt-1">{subtitle}</div>}
    </div>
  );
}

// Donut simples em SVG
function Donut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const R = 60, C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-6 p-2">
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={80} cy={80} r={R} fill="none" stroke="#ffffff22" strokeWidth={18} />
        {data.map((d, i) => {
          const len = (d.value / total) * C; const dash = `${len} ${C - len}`; const rot = (acc / total) * 360; acc += d.value;
          return <circle key={i} cx={80} cy={80} r={R} fill="none" stroke={d.color} strokeWidth={18} strokeDasharray={dash} transform={`rotate(-90 ${80} ${80}) rotate(${rot} ${80} ${80})`} strokeLinecap="butt" />
        })}
      </svg>
      <ul className="space-y-1 text-sm">
        {data.map((d,i)=> (
          <li key={i} className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded" style={{background:d.color}}/> {d.label} <span className="text-white/60">— {d.value}</span></li>
        ))}
      </ul>
    </div>
  );
}

function Bars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map(d=>d.value));
  return (
    <div className="space-y-2">
      {data.map((d,i)=> (
        <div key={i} className="grid grid-cols-6 items-center gap-2">
          <div className="col-span-2 truncate text-sm" title={d.label}>{d.label}</div>
          <div className="col-span-4">
            <div className="h-3 w-full bg-white/10 rounded">
              <div className="h-full rounded bg-white/40" style={{width: `${(d.value/max)*100}%`}} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function groupByDate(tasks: Task[]) {
  const map = new Map<string, number>();
  for (const t of tasks) {
    const iso = (t.created_at || '').slice(0,10);
    if (!iso) continue; map.set(iso, (map.get(iso)||0)+1);
  }
  return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([x,y])=>({x,y}));
}

function LineMini({ data }: { data: { x: string; y: number }[] }) {
  const W = 520, H = 160, P = 16;
  const maxY = Math.max(1, ...data.map(d=>d.y));
  const stepX = (W - 2*P) / Math.max(1, data.length - 1);
  const points = data.map((d,i)=>{
    const x = P + i*stepX;
    const y = H - P - (d.y/maxY)*(H-2*P);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H}>
      <polyline fill="none" stroke="#a5b4fc" strokeWidth={2} points={points}/>
      {data.map((d,i)=>{
        const x = P + i*stepX; const y = H - P - (d.y/maxY)*(H-2*P);
        return <circle key={i} cx={x} cy={y} r={3} fill="#a5b4fc" />
      })}
    </svg>
  );
}

/** ===== Calendário ===== */
function CalendarBoard({ events, loading, monthCursor, setMonthCursor, adminPin, onEnterAdmin, onLeaveAdmin, onReload, onCreateAt, onOpenEvent }:{
  events: CalEvent[]; loading: boolean; monthCursor: Date; setMonthCursor: (d: Date)=>void; adminPin: string|null; onEnterAdmin: ()=>void; onLeaveAdmin: ()=>void; onReload: ()=>void; onCreateAt:(iso:string)=>void; onOpenEvent:(ev:CalEvent)=>void;
}){
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const title = monthName(month) + ' ' + year;

  // dias do grid (começa no domingo)
  const first = new Date(year, month, 1);
  const startDay = new Date(first); startDay.setDate(first.getDate() - first.getDay());
  const cells = Array.from({length: 42}, (_,i)=>addDays(startDay, i));

  const byDay = useMemo(()=>{
    const map: Record<string, CalEvent[]> = {};
    for (const ev of events) {
      (map[ev.date] ||= []).push(ev);
    }
    return map;
  }, [events]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-3xl font-semibold tracking-tight animate-pulse-slow bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-emerald-200 to-rose-200">{title}</div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20" onClick={()=>setMonthCursor(new Date(year, month-1, 1))}>◀</button>
          <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20" onClick={()=>setMonthCursor(new Date())}>Hoje</button>
          <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20" onClick={()=>setMonthCursor(new Date(year, month+1, 1))}>▶</button>
          <span className="mx-2 opacity-60">|</span>
          {!adminPin ? (
            <button className="px-3 py-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-600" onClick={onEnterAdmin}>Modo edição</button>
          ) : (
            <>
              <button className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30" onClick={onReload}>Atualizar</button>
              <button className="px-3 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-600" onClick={onLeaveAdmin}>Sair do modo edição</button>
            </>
          )}
        </div>
      </div>

      <Legend />

      <div className="grid grid-cols-7 gap-2 select-none">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=> (
          <div key={d} className="text-center text-white/70 text-sm">{d}</div>
        ))}
        {cells.map((d, i)=> {
          const iso = toISO(d);
          const inMonth = d.getMonth() === month;
          const dayEvents = byDay[iso] || [];
          return (
            <div key={i} className={`rounded-2xl border ${inMonth?'border-white/10 bg-white/5':'border-white/5 bg-white/5 opacity-60'} backdrop-blur-xl p-2 min-h-[110px] flex flex-col`} onDoubleClick={()=> inMonth && adminPin && onCreateAt(iso)}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="opacity-80">{d.getDate()}</span>
                {adminPin && inMonth && <button className="text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20" onClick={()=>onCreateAt(iso)}>+ Novo</button>}
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[90px] pr-1">
                {dayEvents.map(ev => (
                  <button key={ev.id+ev.title} onClick={()=> adminPin && onOpenEvent(ev)} title={`${ev.title} — ${ev.type||''}`} className="w-full text-left text-xs px-2 py-1 rounded bg-white/15 hover:bg-white/25">
                    <span className="opacity-90 font-medium">{ev.title}</span>
                    {ev.start_time && <span className="opacity-60"> {' '}• {ev.start_time}{ev.end_time?`–${ev.end_time}`:''}</span>}
                    {ev.type && <span className="ml-2 text-[10px] px-1 rounded bg-white/10">{ev.type}</span>}
                  </button>
                ))}
                {dayEvents.length===0 && <div className="text-xs text-white/40">—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend(){
  const items = [
    { name:'Happy Hour', color:'#f43f5e' },
    { name:'Aniversariantes', color:'#22d3ee' },
    { name:'Café com T', color:'#a78bfa' },
    { name:'Workshops/Capacitações', color:'#10b981' },
    { name:'Esportes T.Group', color:'#f59e0b' },
  ];
  return (
    <div className="flex flex-wrap gap-3 text-sm mb-2">
      {items.map(i=> (
        <span key={i.name} className="inline-flex items-center gap-2 px-2 py-1 rounded-xl border border-white/10 bg-white/10">
          <span className="w-3 h-3 rounded" style={{background:i.color}}/>{i.name}
        </span>
      ))}
    </div>
  );
}

function monthName(m:number){
  return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m];
}
function addDays(d:Date, n:number){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function toISO(d:Date){ return d.toISOString().slice(0,10); }

/** ===== Formulários ===== */
function TaskForm({ task, onChange, submitLabel, onSubmit, onCancel, extraRight, disabled, allowStatus = false, }:{ task: Task; onChange: (updater: any) => void; submitLabel: string; onSubmit: () => void; onCancel: () => void; extraRight?: React.ReactNode; disabled?: boolean; allowStatus?: boolean; }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <label className="text-sm text-white/80">Título</label>
        <input className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none focus:bg-white/15" value={task.title || ''} onChange={(e) => onChange((s: Task) => ({ ...s, title: e.target.value }))} placeholder="Ex.: Convocar entrevistas finalistas" />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-white/80">Descrição</label>
        <textarea className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none focus:bg-white/15 min-h-[100px]" value={task.description || ''} onChange={(e) => onChange((s: Task) => ({ ...s, description: e.target.value }))} placeholder="Contexto, links e critérios de pronto." />
      </div>
      <div>
        <label className="text-sm text-white/80">Área</label>
        <select className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none" value={task.area} onChange={(e) => onChange((s: Task) => ({ ...s, area: e.target.value }))}>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm text-white/80">Empresa</label>
        <select className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none" value={task.company} onChange={(e) => onChange((s: Task) => ({ ...s, company: e.target.value }))}>
          {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm text-white/80">Prioridade</label>
        <select className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none" value={task.priority} onChange={(e) => onChange((s: Task) => ({ ...s, priority: e.target.value as any }))}>
          {PRIORITY_UI.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      {allowStatus ? (
        <div>
          <label className="text-sm text-white/80">Status</label>
          <select className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none" value={task.status} onChange={(e) => onChange((s: Task) => ({ ...s, status: e.target.value }))}>
            {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.title}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className="text-sm text-white/80">Prazo</label>
          <input type="date" className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none" value={task.due_date || ''} onChange={(e) => onChange((s: Task) => ({ ...s, due_date: e.target.value }))} />
        </div>
      )}
      <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
        {extraRight}
        <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20" type="button">Cancelar</button>
        <button onClick={onSubmit} disabled={disabled} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60" type="button">{submitLabel}</button>
      </div>
    </div>
  );
}

function EventForm({ ev, onChange, onCancel, onSubmit, onDelete, submitting }:{ ev: CalEvent; onChange:(updater:any)=>void; onCancel:()=>void; onSubmit:()=>void; onDelete?:()=>void; submitting:boolean; }){
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <label className="text-sm text-white/80">Título</label>
        <input className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none focus:bg-white/15" value={ev.title||''} onChange={(e)=>onChange((s:CalEvent)=>({...s, title:e.target.value}))} placeholder="Ex.: Happy Hour T.Group" />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-white/80">Descrição</label>
        <textarea className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none min-h-[90px]" value={ev.description||''} onChange={(e)=>onChange((s:CalEvent)=>({...s, description:e.target.value}))} />
      </div>
      <div>
        <label className="text-sm text-white/80">Data</label>
        <input type="date" className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none" value={ev.date||''} onChange={(e)=>onChange((s:CalEvent)=>({...s, date:e.target.value}))} />
      </div>
      <div>
        <label className="text-sm text-white/80">Local</label>
        <input className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none" value={ev.location||''} onChange={(e)=>onChange((s:CalEvent)=>({...s, location:e.target.value}))} placeholder="PUB, Backyard 209, etc." />
      </div>
      <div>
        <label className="text-sm text-white/80">Início</label>
        <input type="time" className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none" value={ev.start_time||''} onChange={(e)=>onChange((s:CalEvent)=>({...s, start_time:e.target.value}))} />
      </div>
      <div>
        <label className="text-sm text-white/80">Fim</label>
        <input type="time" className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none" value={ev.end_time||''} onChange={(e)=>onChange((s:CalEvent)=>({...s, end_time:e.target.value}))} />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-white/80">Tipo</label>
        <input className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none" value={ev.type||''} onChange={(e)=>onChange((s:CalEvent)=>({...s, type:e.target.value}))} placeholder="Happy Hour, Café com T, Workshop…" />
      </div>
      <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
        {onDelete && <button onClick={onDelete} className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600" type="button">Excluir</button>}
        <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20" type="button">Cancelar</button>
        <button onClick={onSubmit} disabled={submitting} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60" type="button">{submitting?'Salvando…':'Salvar'}</button>
      </div>
    </div>
  );
}

/** Molduras utilitárias */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-white/10 backdrop-blur-2xl p-5" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function GlassCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-4">
      <div className="text-white/80 text-sm mb-2">{title}</div>
      {children}
    </div>
  );
}
