'use client';

import React, { useEffect, useMemo, useState } from 'react';

/** =========================
 *  Config & utils
 *  ========================= */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/gs';

type Priority = 'P1' | 'P2' | 'P3';
type StatusGC = 'Backlog' | 'Em Progresso' | 'Aguardando' | 'UTI' | 'Concluído';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  owner?: string;
  requester?: string;
  area?: string;
  company?: string;
  priority?: Priority;              // P1/P2/P3
  impact?: 'Alta' | 'Média' | 'Baixa';
  status?: StatusGC;
  created_at?: string;
  due_date?: string;                // ISO
  updated_at?: string;
  labels?: string;
  sla_hours?: string;
  linked_docs?: string;
  recurrence?: string;
  last_comment?: string;
}

const PRIORITIES: Priority[] = ['P1', 'P2', 'P3'];
const STATUS_COLUMNS: StatusGC[] = ['Backlog', 'Em Progresso', 'Aguardando', 'UTI', 'Concluído'];

const priorityText = (p?: string) =>
  p === 'P1' ? 'Alta' : p === 'P2' ? 'Média' : 'Baixa';

const isoToInputDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  // yyyy-MM-dd
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const inputDateToISO = (d?: string) => (d ? new Date(d + 'T00:00:00').toISOString() : '');

/** =========================
 *  Glass helpers
 *  ========================= */
const glass = 'bg-white/10 border border-white/20 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,.35)]';
const glassSoft = 'bg-white/12 border border-white/15 backdrop-blur-xl';

/** =========================
 *  API
 *  ========================= */
async function apiList(): Promise<Task[]> {
  const r = await fetch(`${API_BASE}?route=list`, { cache: 'no-store' });
  const js = await r.json();
  if (!js.ok) throw new Error(js.error || 'Erro ao listar');
  return js.data as Task[];
}

async function apiCreate(t: Task): Promise<string> {
  const r = await fetch(`${API_BASE}?route=create`, {
    method: 'POST',
    body: JSON.stringify(t),
  });
  const js = await r.json();
  if (!js.ok) throw new Error(js.error || 'Erro ao criar');
  return js.id as string;
}

async function apiUpdate(id: string, patch: Partial<Task>): Promise<void> {
  const r = await fetch(`${API_BASE}?route=update&id=${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify(patch),
  });
  const js = await r.json();
  if (!js.ok) throw new Error(js.error || 'Erro ao atualizar');
}

async function apiDelete(id: string): Promise<void> {
  const r = await fetch(`${API_BASE}?route=delete&id=${encodeURIComponent(id)}`, {
    method: 'POST',
  });
  const js = await r.json();
  if (!js.ok) throw new Error(js.error || 'Erro ao excluir');
}

async function apiWipe(): Promise<void> {
  const r = await fetch(`${API_BASE}?route=wipe`, { method: 'POST' });
  const js = await r.json();
  if (!js.ok) throw new Error(js.error || 'Erro ao limpar');
}

/** =========================
 *  Main Page
 *  ========================= */
export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Task | null>(null);
  const isEditing = !!draft?.id;

  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiList();
      setTasks(data);
    } catch (e: any) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<StatusGC, Task[]> = {
      'Backlog': [],
      'Em Progresso': [],
      'Aguardando': [],
      'UTI': [],
      'Concluído': [],
    };
    tasks.forEach(t => {
      const col = (t.status as StatusGC) || 'Backlog';
      (map[col] ?? map['Backlog']).push(t);
    });
    return map;
  }, [tasks]);

  /** ---------- Handlers ---------- */
  const openCreate = () => {
    setDraft({
      title: '',
      description: '',
      owner: '',
      requester: 'Moreno',
      area: '',
      company: '',
      priority: 'P2',
      impact: 'Média',
      status: 'Backlog',
      due_date: '',
      labels: '',
    });
    setOpen(true);
  };

  const openEdit = (t: Task) => {
    setDraft({ ...t });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      setSaving(true);
      const payload: Task = {
        ...draft,
        // normaliza datas
        due_date: inputDateToISO(isoToInputDate(draft.due_date) || (draft as any)._due_input),
      };

      if (draft.id) {
        await apiUpdate(draft.id, payload);
      } else {
        const id = await apiCreate(payload);
        payload.id = id;
      }

      setOpen(false);
      setDraft(null);
      await refresh();
    } catch (e: any) {
      alert(`Falha ao salvar: ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!draft?.id) return;
    if (!confirm(`Excluir a tarefa ${draft.title}?`)) return;
    try {
      setSaving(true);
      await apiDelete(draft.id);
      setOpen(false);
      setDraft(null);
      await refresh();
    } catch (e: any) {
      alert(`Falha ao excluir: ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (t: Task, status: StatusGC) => {
    try {
      await apiUpdate(t.id!, { status });
      await refresh();
    } catch (e: any) {
      alert(`Falha ao mover: ${e.message || e}`);
    }
  };

  const wipeAll = async () => {
    if (!confirm('Apagar TODAS as tarefas? Esta ação não pode ser desfeita.')) return;
    try {
      await apiWipe();
      await refresh();
    } catch (e: any) {
      alert(`Falha ao limpar: ${e.message || e}`);
    }
  };

  /** ---------- UI ---------- */
  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden">
      {/* Liquid Glass background (intenso) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-90" id="lg-layer" />
      </div>

      {/* Header */}
      <header className="px-6 pt-6 pb-3">
        <div className={`mx-auto max-w-[1400px] ${glass} rounded-2xl px-5 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <div className="text-xs tracking-widest opacity-80">GENTE E CULTURA</div>
              <div className="text-2xl font-semibold">HR Ops</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => alert('Dashboard ainda não implementado — deixamos o gancho pronto.')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
                title="Dashboard"
              >
                Dashboard
              </button>
              <button
                onClick={openCreate}
                className="px-4 py-2 rounded-xl bg-indigo-500/80 hover:bg-indigo-600 transition"
              >
                + Criar tarefa
              </button>
              <button
                onClick={wipeAll}
                className="px-4 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 transition"
                title="Apagar todas as tarefas"
              >
                Limpar tudo
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {err && (
        <div className="px-6">
          <div className="mx-auto max-w-[1400px] mt-3 rounded-xl bg-rose-500/20 border border-rose-400/30 px-4 py-2 text-sm">
            Erro: {err}
          </div>
        </div>
      )}

      {/* Board */}
      <main className="px-6 pb-8">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {STATUS_COLUMNS.map((col) => (
            <section key={col} className={`${glassSoft} rounded-2xl p-3 flex flex-col min-h-[70vh]`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold tracking-wide opacity-90">{col}</h2>
                <span className="text-[11px] opacity-70">{grouped[col].length}</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {loading && grouped[col].length === 0 ? (
                  <div className="text-sm opacity-60">Carregando…</div>
                ) : grouped[col].length === 0 ? (
                  <div className="text-sm opacity-50">Sem itens.</div>
                ) : (
                  grouped[col].map((t) => (
                    <article
                      key={t.id}
                      className={`rounded-xl px-3 py-2 cursor-pointer ${glass} hover:bg-white/14 transition`}
                      onClick={() => openEdit(t)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[13px] font-semibold line-clamp-1">{t.title}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/15">
                          {priorityText(t.priority)}
                        </span>
                      </div>

                      <div className="text-[11px] opacity-80 mt-1">
                        {(t.company || '—')} • {(t.area || '—')}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="text-[11px] opacity-70">
                          Prazo:{' '}
                          {isoToInputDate(t.due_date) || '—'}
                        </div>

                        {col !== 'Concluído' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatus(t, 'Concluído');
                            }}
                            className="text-[11px] px-2 py-1 rounded bg-emerald-500/80 hover:bg-emerald-600"
                          >
                            Concluir
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Rodapé */}
        <div className="mx-auto max-w-[1400px] mt-6 text-[11px] opacity-70 px-2">
          Plataforma desenvolvida pela área de Gente e Cultura — T.Group — todos os direitos reservados.
        </div>
      </main>

      {/* Modal Criar/Editar */}
      {open && draft && (
        <div
          className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className={`w-full max-w-2xl ${glass} rounded-2xl p-5`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-3">
              {isEditing ? 'Editar tarefa' : 'Criar tarefa'}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs opacity-70">Título</label>
                <input
                  className="w-full mt-1 rounded-xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs opacity-70">Descrição</label>
                <textarea
                  rows={3}
                  className="w-full mt-1 rounded-xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                  value={draft.description || ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs opacity-70">Owner</label>
                <input
                  className="w-full mt-1 rounded-xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                  value={draft.owner || ''}
                  onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs opacity-70">Solicitante</label>
                <input
                  className="w-full mt-1 rounded-xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                  value={draft.requester || ''}
                  onChange={(e) => setDraft({ ...draft, requester: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs opacity-70">Área</label>
                <input
                  className="w-full mt-1 rounded-xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                  value={draft.area || ''}
                  onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs opacity-70">Empresa</label>
                <input
                  className="w-full mt-1 rounded-xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                  value={draft.company || ''}
                  onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs opacity-70">Urgência</label>
                <select
                  className="w-full mt-1 rounded-xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                  value={draft.priority || 'P2'}
                  onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {priorityText(p)} ({p})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs opacity-70">Status</label>
                <select
                  className="w-full mt-1 rounded-xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                  value={draft.status || 'Backlog'}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as StatusGC })}
                >
                  {STATUS_COLUMNS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs opacity-70">Prazo</label>
                <input
                  type="date"
                  className="w-full mt-1 rounded-xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                  value={isoToInputDate(draft.due_date)}
                  onChange={(e) =>
                    setDraft({ ...draft, due_date: inputDateToISO(e.target.value), ...(draft as any), _due_input: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs opacity-70">Labels (vírgula)</label>
                <input
                  className="w-full mt-1 rounded-xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                  value={draft.labels || ''}
                  onChange={(e) => setDraft({ ...draft, labels: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2">
                {isEditing && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-600"
                  >
                    Excluir
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15"
                >
                  Cancelar
                </button>
              </div>
              <button
                disabled={saving || !draft.title?.trim()}
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-emerald-500/80 hover:bg-emerald-600 disabled:opacity-60"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liquid Glass keyframes */}
      <style jsx global>{`
        /* base */
        html, body { height: 100%; background: #0b1320; }

        /* camada aurora intensa */
        #lg-layer {
          background:
            radial-gradient(60rem 30rem at 10% 20%, rgba(120, 70, 255, .55), transparent 60%),
            radial-gradient(50rem 32rem at 85% 15%, rgba(0, 180, 255, .55), transparent 60%),
            radial-gradient(55rem 30rem at 80% 90%, rgba(0, 180, 255, .35), transparent 60%),
            radial-gradient(50rem 25rem at 20% 85%, rgba(120, 70, 255, .35), transparent 60%),
            linear-gradient(180deg, #0b1320 0%, #06101e 100%);
          filter: saturate(120%) blur(0.5px);
          animation:
            lg-move 26s ease-in-out infinite alternate,
            lg-hue 32s ease-in-out infinite alternate;
        }

        @keyframes lg-move {
          0%   { background-position: 0% 0%; transform: translate3d(0,0,0); }
          50%  { background-position: 5% 2%; transform: translate3d(0,-0.4%,0) scale(1.01); }
          100% { background-position: 8% 6%; transform: translate3d(0,0,0); }
        }
        @keyframes lg-hue {
          0%   { filter: saturate(120%) blur(0.5px) hue-rotate(0deg); }
          100% { filter: saturate(125%) blur(0.5px) hue-rotate(18deg); }
        }
      `}</style>
    </div>
  );
}
