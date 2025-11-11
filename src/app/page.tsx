'use client';

import { useEffect, useMemo, useState } from 'react';

/** ========= Config ========= **/
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/gs';

// Colunas do Kanban (o que aparece no board)
const KANBAN_COLUMNS = [
  { key: 'Backlog',      title: 'Backlog' },
  { key: 'Em Progresso', title: 'Em Progresso' },
  { key: 'Aguardando',   title: 'Aguardando' },
  { key: 'UTI',          title: 'UTI' },
  { key: 'Concluído',    title: 'Concluído' },
];

// Opções
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

const PRIORITIES = ['P1', 'P2', 'P3'];
const IMPACTS    = ['Alta', 'Média', 'Baixa'];

/** ========= Tipos ========= **/
type Task = {
  id?: string;
  title?: string;
  description?: string;
  owner?: string;
  requester?: string;
  company?: string;
  area?: string;
  priority?: string;
  impact?: string;
  status?: string;
  due_date?: string;
  labels?: string;
  sla_hours?: string;
  linked_docs?: string;
  recurrence?: string;
  last_comment?: string;
  created_at?: string;
  updated_at?: string;
};

/** ========= Helpers de API (SEM arquivos extras) ========= **/
async function apiList(): Promise<{ ok: boolean; data?: Task[]; error?: string }> {
  const r = await fetch(`${API_BASE}?route=list`, { cache: 'no-store' });
  return r.json();
}

async function apiCreate(task: Task): Promise<{ ok: boolean; id?: string; error?: string }> {
  const r = await fetch(`${API_BASE}?route=create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return r.json();
}

async function apiUpdate(id: string, patch: Partial<Task>): Promise<{ ok: boolean; id?: string; error?: string }> {
  const r = await fetch(`${API_BASE}?route=update&id=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return r.json();
}

/** ========= UI ========= **/
export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // form de nova tarefa
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    description: '',
    owner: 'Moreno',
    requester: 'Moreno',
    company: COMPANIES[0],
    area: AREAS[1], // Recrutamento
    priority: 'P2',
    impact: 'Média',
    status: 'Backlog',
    due_date: '',
    labels: '',
    sla_hours: '',
    linked_docs: '',
    recurrence: '',
    last_comment: '',
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiList();
        if (res.ok) setTasks(res.data || []);
        else alert(`Erro ao listar: ${res.error || 'desconhecido'}`);
      } catch (e: any) {
        alert(`Falha ao listar: ${String(e)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns = useMemo(() => {
    const m: Record<string, Task[]> = {};
    KANBAN_COLUMNS.forEach(col => (m[col.key] = []));
    for (const t of tasks) {
      const key = t.status && m[t.status] ? t.status : 'Backlog';
      m[key].push(t);
    }
    return m;
  }, [tasks]);

  /** Salvar (create) */
  async function handleSave() {
    setSaving(true);
    try {
      if (!newTask.title?.trim()) {
        alert('Preencha o título da tarefa.');
        return;
      }
      const payload: Task = {
        title: newTask.title?.trim(),
        description: newTask.description || '',
        owner: newTask.owner || 'Moreno',
        requester: newTask.requester || 'Moreno',
        company: newTask.company,
        area: newTask.area,
        priority: newTask.priority || 'P2',
        impact: newTask.impact || 'Média',
        status: newTask.status || 'Backlog',
        due_date: newTask.due_date || '',
        labels: newTask.labels || '',
        sla_hours: newTask.sla_hours || '',
        linked_docs: newTask.linked_docs || '',
        recurrence: newTask.recurrence || '',
        last_comment: newTask.last_comment || '',
      };

      const res = await apiCreate(payload);
      if (!res.ok) {
        alert(`Falha ao salvar: ${res.error || 'erro_desconhecido'}`);
        return;
      }

      // reload list
      const list = await apiList();
      if (list.ok) setTasks(list.data || []);

      setOpen(false);
      setNewTask({
        title: '',
        description: '',
        owner: 'Moreno',
        requester: 'Moreno',
        company: COMPANIES[0],
        area: AREAS[1],
        priority: 'P2',
        impact: 'Média',
        status: 'Backlog',
        due_date: '',
        labels: '',
        sla_hours: '',
        linked_docs: '',
        recurrence: '',
        last_comment: '',
      });
    } catch (e: any) {
      alert(`Falha ao salvar: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  /** Atualizar status rapidamente (ex.: mover de coluna via botão) */
  async function quickMove(id?: string, next?: string) {
    if (!id || !next) return;
    const res = await apiUpdate(id, { status: next });
    if (!res.ok) {
      alert(`Falha ao mover: ${res.error || 'erro'}`);
      return;
    }
    const list = await apiList();
    if (list.ok) setTasks(list.data || []);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a1b5f] via-[#1f2a6b] to-[#0c1027] text-white">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/5 bg-white/0 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xs uppercase tracking-wider text-white/70">Gente e Cultura</div>
            <div className="text-lg font-semibold">HR Ops</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition"
            >
              + Criar tarefa
            </button>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-white/80">Carregando…</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {KANBAN_COLUMNS.map((col) => (
              <section key={col.key} className="flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="font-semibold">{col.title}</h2>
                  <span className="text-sm text-white/70">{columns[col.key]?.length ?? 0}</span>
                </div>
                <div className="p-3 space-y-3 h-[calc(100vh-240px)] overflow-y-auto">
                  {(columns[col.key] || []).map((t) => (
                    <article key={t.id} className="rounded-xl border border-white/10 bg-white/10 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-medium">{t.title}</div>
                          <div className="text-sm text-white/70">
                            {t.company} • {t.area}
                          </div>
                          {t.due_date && (
                            <div className="text-xs text-white/60">
                              Prazo: {new Date(t.due_date).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-xs px-2 py-1 rounded bg-white/15">{t.priority}</span>
                          {t.id && col.key !== 'Concluído' && (
                            <button
                              className="text-xs px-2 py-1 rounded bg-emerald-400/20 hover:bg-emerald-400/30"
                              onClick={() => quickMove(t.id, 'Concluído')}
                            >
                              Concluir
                            </button>
                          )}
                        </div>
                      </div>
                      {t.description && <p className="mt-2 text-sm text-white/80 line-clamp-3">{t.description}</p>}
                    </article>
                  ))}
                  {(!columns[col.key] || columns[col.key].length === 0) && (
                    <div className="text-white/50 text-sm">Sem itens</div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Modal Criar */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-3">Criar tarefa</div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm text-white/80">Título</label>
                <input
                  className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none focus:bg-white/15"
                  value={newTask.title || ''}
                  onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Ex.: Convocar entrevistas finalistas"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-white/80">Descrição</label>
                <textarea
                  className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none focus:bg-white/15 min-h-[100px]"
                  value={newTask.description || ''}
                  onChange={(e) => setNewTask((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Contexto, links e critérios de pronto."
                />
              </div>

              <div>
                <label className="text-sm text-white/80">Área</label>
                <select
                  className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                  value={newTask.area}
                  onChange={(e) => setNewTask((s) => ({ ...s, area: e.target.value }))}
                >
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/80">Empresa</label>
                <select
                  className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                  value={newTask.company}
                  onChange={(e) => setNewTask((s) => ({ ...s, company: e.target.value }))}
                >
                  {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/80">Prioridade</label>
                <select
                  className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                  value={newTask.priority}
                  onChange={(e) => setNewTask((s) => ({ ...s, priority: e.target.value }))}
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/80">Impacto</label>
                <select
                  className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                  value={newTask.impact}
                  onChange={(e) => setNewTask((s) => ({ ...s, impact: e.target.value }))}
                >
                  {IMPACTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/80">Status</label>
                <select
                  className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                  value={newTask.status}
                  onChange={(e) => setNewTask((s) => ({ ...s, status: e.target.value }))}
                >
                  {KANBAN_COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.title}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/80">Prazo</label>
                <input
                  type="date"
                  className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
                  value={newTask.due_date || ''}
                  onChange={(e) => setNewTask((s) => ({ ...s, due_date: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60"
                  type="button"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
