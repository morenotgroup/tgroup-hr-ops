'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/gs';

/** Tipos */
type Task = {
  id?: string;
  title?: string;
  description?: string;
  owner?: string;
  requester?: string;
  company?: string;
  area?: string;
  priority?: 'P1' | 'P2' | 'P3' | string;
  status?: 'Aguardando' | 'Em Progresso' | 'UTI' | 'Concluído' | string;
  due_date?: string;
  labels?: string;
  created_at?: string;
  updated_at?: string;
};

/** API helpers via proxy */
async function apiList() {
  const r = await fetch(`${API_BASE}?route=list`, { cache: 'no-store' });
  return r.json();
}
async function apiCreate(task: Task) {
  const r = await fetch(`${API_BASE}?route=create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return r.json();
}
async function apiUpdate(id: string, patch: Partial<Task>) {
  const r = await fetch(`${API_BASE}?route=update&id=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return r.json();
}
async function apiDelete(id: string) {
  const r = await fetch(`${API_BASE}?route=delete&id=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return r.json();
}

/** Constantes de UI */
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
const PRIORITIES: Array<'P1' | 'P2' | 'P3'> = ['P1', 'P2', 'P3'];

/** Colunas do fluxo */
const COLUMNS = [
  { key: 'Aguardando', title: 'Aguardando' },
  { key: 'Em Progresso', title: 'Em Progresso' },
  { key: 'UTI', title: 'UTI' },
  { key: 'Concluído', title: 'Concluído' },
] as const;
type ColumnKey = typeof COLUMNS[number]['key'];

/** Componente principal */
export default function Page() {
  const [view, setView] = useState<'kanban' | 'dashboard'>('kanban');

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

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
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
  }

  /** Agrupar por coluna */
  const byCol = useMemo(() => {
    const m: Record<string, Task[]> = {};
    COLUMNS.forEach(c => (m[c.key] = []));
    for (const t of tasks) {
      const key = (t.status as ColumnKey) || 'Aguardando';
      if (!m[key]) m[key] = [];
      m[key].push(t);
    }
    return m;
  }, [tasks]);

  /** Drag and drop */
  function onDragStart(e: React.DragEvent, taskId?: string) {
    if (!taskId) return;
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  async function onDrop(e: React.DragEvent, dest: ColumnKey) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const res = await apiUpdate(id, { status: dest });
    if (!res.ok) return alert(`Falha ao mover: ${res.error || 'erro'}`);
    refresh();
  }

  /** Criar */
  async function handleCreate() {
    if (!createTask.title?.trim()) {
      alert('Preencha o título.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiCreate({ ...createTask, title: createTask.title.trim() });
      if (!res.ok) {
        alert(`Falha ao salvar: ${res.error || 'erro'}`);
        return;
      }
      setOpenCreate(false);
      setCreateTask({
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
      refresh();
    } catch (e: any) {
      alert(`Falha ao salvar: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  /** Abrir edição */
  function openEditModal(t: Task) {
    setEditTask({ ...t });
    setOpenEdit(true);
  }

  /** Atualizar (salvar edição) */
  async function handleUpdate() {
    if (!editTask?.id) return;
    setUpdating(true);
    try {
      const { id, ...patch } = editTask;
      const res = await apiUpdate(id!, patch);
      if (!res.ok) return alert(`Falha ao atualizar: ${res.error || 'erro'}`);
      setOpenEdit(false);
      setEditTask(null);
      refresh();
    } catch (e: any) {
      alert(`Falha ao atualizar: ${String(e)}`);
    } finally {
      setUpdating(false);
    }
  }

  /** Concluir atalho */
  async function quickDone(id?: string) {
    if (!id) return;
    const res = await apiUpdate(id, { status: 'Concluído' });
    if (!res.ok) return alert(`Falha ao concluir: ${res.error || 'erro'}`);
    refresh();
  }

  /** Excluir */
  async function handleDelete() {
    if (!editTask?.id) return;
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    const res = await apiDelete(editTask.id);
    if (!res.ok) return alert(`Falha ao excluir: ${res.error || 'erro'}`);
    setOpenEdit(false);
    setEditTask(null);
    refresh();
  }

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
        {view === 'dashboard' ? (
          <Dashboard tasks={tasks} loading={loading} />
        ) : loading ? (
          <div className="text-white/80">Carregando…</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => (
              <section
                key={col.key}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, col.key)}
              >
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="font-semibold">{col.title}</h2>
                  <span className="text-sm text-white/70">{byCol[col.key]?.length ?? 0}</span>
                </div>
                <div className="p-3 space-y-3 h-[calc(100vh-240px)] overflow-y-auto">
                  {(byCol[col.key] || []).map((t) => (
                    <article
                      key={t.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, t.id)}
                      onClick={() => openEditModal(t)}
                      className="rounded-xl border border-white/10 bg-white/10 p-3 cursor-pointer hover:bg-white/15 transition"
                    >
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
                        <div className="flex flex-col gap-2 items-end">
                          <span className="text-xs px-2 py-1 rounded bg-white/15">{t.priority}</span>
                          {t.id && t.status !== 'Concluído' && (
                            <button
                              className="text-xs px-2 py-1 rounded bg-emerald-400/20 hover:bg-emerald-400/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                quickDone(t.id);
                              }}
                            >
                              Concluir
                            </button>
                          )}
                        </div>
                      </div>
                      {t.description && <p className="mt-2 text-sm text-white/80 line-clamp-3">{t.description}</p>}
                    </article>
                  ))}
                  {(!byCol[col.key] || byCol[col.key].length === 0) && (
                    <div className="text-white/50 text-sm">Sem itens</div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-white/70">
        Plataforma desenvolvida pela área de <b>Gente e Cultura</b> — <b>T.Group</b>. Todos os direitos reservados.
      </footer>

      {/* Modal Criar */}
      {openCreate && (
        <Modal onClose={() => setOpenCreate(false)}>
          <div className="text-lg font-semibold mb-3">Criar tarefa</div>
          <TaskForm
            task={createTask}
            onChange={setCreateTask}
            submitLabel={saving ? 'Salvando…' : 'Salvar'}
            onSubmit={handleCreate}
            onCancel={() => setOpenCreate(false)}
            disabled={saving}
          />
        </Modal>
      )}

      {/* Modal Editar */}
      {openEdit && editTask && (
        <Modal onClose={() => setOpenEdit(false)}>
          <div className="text-lg font-semibold mb-3">Editar tarefa</div>
          <TaskForm
            task={editTask}
            onChange={setEditTask as any}
            submitLabel={updating ? 'Atualizando…' : 'Salvar alterações'}
            onSubmit={handleUpdate}
            onCancel={() => setOpenEdit(false)}
            extraRight={
              <button
                onClick={handleDelete}
                className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600"
                type="button"
              >
                Excluir
              </button>
            }
            disabled={updating}
            allowStatus
          />
        </Modal>
      )}
    </div>
  );
}

/** Dashboard simples (contadores) */
function Dashboard({ tasks, loading }: { tasks: Task[]; loading: boolean }) {
  const totals = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const t of tasks) {
      byStatus[t.status || 'Aguardando'] = (byStatus[t.status || 'Aguardando'] || 0) + 1;
      byPriority[t.priority || 'P2'] = (byPriority[t.priority || 'P2'] || 0) + 1;
    }
    return { byStatus, byPriority, total: tasks.length };
  }, [tasks]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <GlassCard title="Total de tarefas">
        <div className="text-4xl font-semibold">{loading ? '…' : totals.total}</div>
      </GlassCard>
      <GlassCard title="Por status">
        <ul className="space-y-1">
          {Object.entries(totals.byStatus).map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <span>{k}</span><span className="font-semibold">{v}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
      <GlassCard title="Por prioridade">
        <ul className="space-y-1">
          {Object.entries(totals.byPriority).map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <span>{k}</span><span className="font-semibold">{v}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}

/** Formulário reutilizável (criar/editar) */
function TaskForm({
  task,
  onChange,
  submitLabel,
  onSubmit,
  onCancel,
  extraRight,
  disabled,
  allowStatus = false,
}: {
  task: Task;
  onChange: (updater: any) => void;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
  extraRight?: React.ReactNode;
  disabled?: boolean;
  allowStatus?: boolean;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <label className="text-sm text-white/80">Título</label>
        <input
          className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none focus:bg-white/15"
          value={task.title || ''}
          onChange={(e) => onChange((s: Task) => ({ ...s, title: e.target.value }))}
          placeholder="Ex.: Convocar entrevistas finalistas"
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm text-white/80">Descrição</label>
        <textarea
          className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none focus:bg-white/15 min-h-[100px]"
          value={task.description || ''}
          onChange={(e) => onChange((s: Task) => ({ ...s, description: e.target.value }))}
          placeholder="Contexto, links e critérios de pronto."
        />
      </div>

      <div>
        <label className="text-sm text-white/80">Área</label>
        <select
          className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
          value={task.area}
          onChange={(e) => onChange((s: Task) => ({ ...s, area: e.target.value }))}
        >
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-white/80">Empresa</label>
        <select
          className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
          value={task.company}
          onChange={(e) => onChange((s: Task) => ({ ...s, company: e.target.value }))}
        >
          {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-white/80">Prioridade</label>
        <select
          className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
          value={task.priority}
          onChange={(e) => onChange((s: Task) => ({ ...s, priority: e.target.value as any }))}
        >
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {allowStatus ? (
        <div>
          <label className="text-sm text-white/80">Status</label>
          <select
            className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
            value={task.status}
            onChange={(e) => onChange((s: Task) => ({ ...s, status: e.target.value }))}
          >
            {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.title}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className="text-sm text-white/80">Prazo</label>
          <input
            type="date"
            className="w-full mt-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
            value={task.due_date || ''}
            onChange={(e) => onChange((s: Task) => ({ ...s, due_date: e.target.value }))}
          />
        </div>
      )}

      <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
        {extraRight}
        <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20" type="button">
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60"
          type="button"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

/** Molduras */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/10 backdrop-blur-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
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
