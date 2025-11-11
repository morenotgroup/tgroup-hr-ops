// src/app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Task = {
  id: string;
  title: string;
  description: string;
  owner: string;
  area: string;
  company: string;
  priority: 'P1'|'P2'|'P3'|'P4'|string;
  status: 'Backlog'|'Em Progresso'|'Em Aprovação'|'Bloqueado'|'Concluído'|string;
  created_at?: string;
  due_date?: string;
  updated_at?: string;
  labels?: string;
  requester?: string;
  impact?: string;
  sla_hours?: string;
  linked_docs?: string;
  recurrence?: string;
  last_comment?: string;
};

const STATUS_COLS = [
  { key: 'Backlog',       title: 'Backlog' },
  { key: 'Em Progresso',  title: 'Em Progresso' },
  { key: 'Em Aprovação',  title: 'Em Aprovação' },
  { key: 'Bloqueado',     title: 'Bloqueado' },
  { key: 'Concluído',     title: 'Concluído' },
] as const;

function fmtDate(d?: string) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch { return '—'; }
}

async function apiGetList(): Promise<{ ok: boolean; data: Task[]; error?: any }> {
  const res = await fetch('/api/gs?route=list', { cache: 'no-store' });
  const json = await res.json().catch(() => ({ ok: false, error: 'invalid_json' }));
  return json;
}

async function apiCreate(task: Partial<Task>) {
  const res = await fetch('/api/gs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ route: 'create', body: task }),
  });
  const json = await res.json().catch(() => ({ ok: false, error: 'invalid_json' }));
  return json;
}

export default function Page() {
  const [list, setList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // modal criar
  const [openNew, setOpenNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    owner: '',
    area: 'Admissão & Demissão',
    company: 'T Group',
    priority: 'P2',
    status: 'Backlog',
    due_date: '',
    requester: 'Moreno',
    impact: 'Média',
  });

  // modal detalhes
  const [openView, setOpenView] = useState<null | Task>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await apiGetList();
      if (r.ok) {
        setErr(null);
        setList(r.data || []);
      } else {
        // se veio upstream_non_json, mostra msg curta
        setErr(
          r?.error === 'upstream_non_json'
            ? 'Erro: backend retornou conteúdo não JSON.'
            : 'Erro ao carregar tarefas.'
        );
      }
      setLoading(false);
    })();
  }, []);

  const columns = useMemo(() => {
    const map: Record<string, Task[]> = {};
    STATUS_COLS.forEach(c => (map[c.key] = []));
    for (const t of list) {
      if (!map[t.status]) map[t.status] = [];
      map[t.status].push(t);
    }
    return map;
  }, [list]);

  async function handleSave() {
    if (saving) return;
    // validação simples
    if (!newTask.title?.trim()) { alert('Informe um título'); return; }
    setSaving(true);
    const payload: Partial<Task> = {
      ...newTask,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const r = await apiCreate(payload);
    setSaving(false);
    if (r?.ok) {
      // reload leve
      const again = await apiGetList();
      if (again.ok) setList(again.data || []);
      setOpenNew(false);
      // limpa form
      setNewTask({
        title: '',
        description: '',
        owner: '',
        area: 'Admissão & Demissão',
        company: 'T Group',
        priority: 'P2',
        status: 'Backlog',
        due_date: '',
        requester: 'Moreno',
        impact: 'Média',
      });
    } else {
      alert('Falha ao salvar: ' + (r?.error || 'erro desconhecido'));
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1320] text-slate-100 relative">
      {/* aurora animada */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(56,189,248,.25),transparent),radial-gradient(900px_500px_at_100%_0%,rgba(139,92,246,.25),transparent),radial-gradient(1000px_600px_at_50%_120%,rgba(59,130,246,.25),transparent)] animate-[pulse_10s_ease-in-out_infinite]" />
      </div>

      <header className="px-5 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">
          T Group • HR Ops <span className="text-sky-300">— Gente e Cultura</span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setOpenNew(true)}
            className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20"
          >
            + Nova tarefa
          </button>
          <a
            href="/"
            className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20"
          >
            Dashboard
          </a>
        </div>
      </header>

      {/* filtros (placeholder) */}
      <div className="px-5">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            className="rounded-xl bg-white/10 border border-white/20 px-3 py-2 outline-none placeholder:text-slate-300/60"
            placeholder="Buscar por título, descrição"
          />
          <select className="rounded-xl bg-white/10 border border-white/20 px-3 py-2">
            <option>Empresa (todas)</option>
          </select>
          <select className="rounded-xl bg-white/10 border border-white/20 px-3 py-2">
            <option>Área (todas)</option>
          </select>
          <select className="rounded-xl bg-white/10 border border-white/20 px-3 py-2">
            <option>Prioridade (todas)</option>
          </select>
          <select className="rounded-xl bg-white/10 border border-white/20 px-3 py-2">
            <option>Status (todos)</option>
          </select>
        </div>
      </div>

      {/* barra de erro */}
      {err && (
        <div className="px-5 mt-3">
          <div className="rounded-xl bg-red-400/15 border border-red-300/30 px-4 py-2 text-red-100">
            {err}
          </div>
        </div>
      )}

      {/* KANBAN */}
      <div className="px-5 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
          {STATUS_COLS.map(col => {
            const items = columns[col.key] || [];
            return (
              <div key={col.key} className="rounded-2xl bg-white/5 border border-white/10 p-2 flex flex-col">
                <div className="px-2 py-1 text-sm text-slate-200/90 flex items-center justify-between">
                  <span>{col.title}</span>
                  <span className="text-xs rounded-full bg-white/10 px-2 py-0.5">{items.length}</span>
                </div>

                <div className="mt-2 grow rounded-xl bg-gradient-to-b from-white/5 to-white/0 p-2
                                overflow-y-auto"
                     style={{ maxHeight: 'calc(100vh - 260px)' }}>
                  {loading && <div className="text-slate-300/70 px-2 py-4 text-sm">Carregando…</div>}

                  {items.map((t) => (
                    <div
                      key={t.id + Math.random()} // evita conflito por IDs duplicados vindos da planilha
                      onClick={() => setOpenView(t)}
                      className="cursor-pointer select-none rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 p-3 mb-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{t.title || '(sem título)'}</div>
                        <span className="text-[11px] rounded-md bg-yellow-300/20 border border-yellow-300/30 text-yellow-200 px-2 py-0.5">
                          {t.priority || '—'} • {t.impact || '—'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300/80 mt-1">
                        <div className="flex items-center gap-2">
                          <span>📅 {fmtDate(t.due_date)}</span>
                        </div>
                        <div className="mt-1">Owner: <b>{t.owner || '—'}</b></div>
                        <div className="text-[11px] opacity-70">{t.area}</div>
                      </div>
                    </div>
                  ))}

                  {!loading && items.length === 0 && (
                    <div className="text-slate-300/60 text-sm px-2 py-6">Sem tarefas.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-300/60 mt-3">Plataforma desenvolvida pela área de Gente e Cultura - T.Group - Todos os direitos reservados.</p>
      </div>

      {/* MODAL NOVA TAREFA */}
      {openNew && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={() => !saving && setOpenNew(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white text-slate-900 p-4" onClick={(e)=>e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">Criar tarefa</div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Título"
                  value={newTask.title || ''} onChange={e=>setNewTask(s=>({...s,title:e.target.value}))}/>
              </div>
              <div className="md:col-span-2">
                <textarea className="w-full border rounded-lg px-3 py-2 min-h-[100px]" placeholder="Descrição"
                  value={newTask.description || ''} onChange={e=>setNewTask(s=>({...s,description:e.target.value}))}/>
              </div>
              <input className="border rounded-lg px-3 py-2" placeholder="Owner"
                value={newTask.owner || ''} onChange={e=>setNewTask(s=>({...s,owner:e.target.value}))}/>
              <input className="border rounded-lg px-3 py-2" placeholder="Solicitante"
                value={newTask.requester || ''} onChange={e=>setNewTask(s=>({...s,requester:e.target.value}))}/>

              <select className="border rounded-lg px-3 py-2" value={newTask.area}
                onChange={e=>setNewTask(s=>({...s,area:e.target.value}))}>
                <option>Admissão & Demissão</option>
                <option>Recrutamento</option>
                <option>Facilities & Sede</option>
                <option>Folha & DP</option>
                <option>Benefícios</option>
                <option>Prestação de Contas</option>
                <option>Contratos Jurídicos</option>
                <option>Performance & Clima</option>
                <option>Atendimento Colab</option>
                <option>Atendimento Sócios</option>
                <option>Conflitos Internos</option>
                <option>Café com T / HH / Aniversariantes</option>
                <option>Confraternização Anual</option>
                <option>Eventos & Palestras & Capacitações</option>
                <option>Brindes & Datas Comemorativas</option>
                <option>Locação / Imobiliária</option>
                <option>Sistemas Internos (Apps)</option>
              </select>

              <select className="border rounded-lg px-3 py-2" value={newTask.company}
                onChange={e=>setNewTask(s=>({...s,company:e.target.value}))}>
                <option>T Group</option>
                <option>T Youth — Toy Formaturas</option>
                <option>T Youth — Neo Formaturas</option>
                <option>Toy Interior</option>
                <option>T Dreams</option>
                <option>T Brands</option>
                <option>T Venues</option>
                <option>Mood</option>
                <option>WAS</option>
              </select>

              <select className="border rounded-lg px-3 py-2" value={newTask.priority}
                onChange={e=>setNewTask(s=>({...s,priority:e.target.value as any}))}>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
                <option value="P4">P4</option>
              </select>

              <select className="border rounded-lg px-3 py-2" value={newTask.impact}
                onChange={e=>setNewTask(s=>({...s,impact:e.target.value}))}>
                <option>Média</option>
                <option>Alta</option>
                <option>Baixa</option>
              </select>

              <input type="date" className="border rounded-lg px-3 py-2"
                value={(newTask.due_date || '').slice(0,10)}
                onChange={e=>setNewTask(s=>({...s,due_date:new Date(e.target.value).toISOString()}))}/>
              <input className="border rounded-lg px-3 py-2" placeholder="Labels (vírgula)"
                value={newTask.labels || ''} onChange={e=>setNewTask(s=>({...s,labels:e.target.value}))}/>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button disabled={saving} onClick={()=>!saving && setOpenNew(false)}
                className="px-4 py-2 rounded-lg border">{saving ? '...' : 'Cancelar'}</button>
              <button disabled={saving} onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-sky-600 text-white disabled:opacity-60">
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHES */}
      {openView && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={()=>setOpenView(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white text-slate-900 p-4" onClick={(e)=>e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">{openView.title}</div>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <div><b>Status:</b> {openView.status}</div>
              <div><b>Prioridade:</b> {openView.priority}</div>
              <div><b>Owner:</b> {openView.owner || '—'}</div>
              <div><b>Área:</b> {openView.area}</div>
              <div><b>Empresa:</b> {openView.company}</div>
              <div><b>Impacto:</b> {openView.impact || '—'}</div>
              <div><b>Vence em:</b> {fmtDate(openView.due_date)}</div>
              <div><b>Solicitante:</b> {openView.requester || '—'}</div>
              <div className="md:col-span-2 mt-2 whitespace-pre-wrap"><b>Descrição:</b><br/>{openView.description || '—'}</div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={()=>setOpenView(null)} className="px-4 py-2 rounded-lg border">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
