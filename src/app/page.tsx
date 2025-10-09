'use client';

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CalendarDays, AlertTriangle, CheckCircle2, Clock, Plus, ArrowRightLeft, ShieldAlert, LayoutList, LayoutGrid } from "lucide-react";
import Glass from "@/components/ui/Glass";
import Gauge from "@/components/ui/Gauge";

/** ====== CONFIG API ====== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

/** ====== DADOS BASE ====== */
const PRIORITY = {
  P0: { label: "P0 • UTI", weight: 6 },
  P1: { label: "P1 • Alta", weight: 4 },
  P2: { label: "P2 • Média", weight: 2 },
  P3: { label: "P3 • Baixa", weight: 1 }
} as const;

const STATUSES = ["Backlog", "Em Progresso", "Em Aprovação", "Bloqueado", "Concluído"] as const;

const AREAS = [
  "Admissão & Demissão","Recrutamento","Facilities & Sede","Folha & DP","Benefícios","Prestação de Contas","Contratos Jurídicos",
  "Performance & Clima","Atendimento Colab","Atendimento Sócios","Conflitos Internos","Café com T / HH / Aniversariantes",
  "Confraternização Anual","Eventos & Palestras & Capacitações","Brindes & Datas Comemorativas","Locação / Imobiliária","Sistemas Internos (Apps)"
] as const;

const COMPANIES = ["T Group","T Youth","T Brands","T Dreams","T Venues","WAS","Mood"] as const;

/** ====== DEMO fallback quando não há API ====== */
const demoTasks = [
  { id:"T-001", title:"Atualizar política de férias PJ", description:"Revisar documento e comunicar.", owner:"Moreno", area:"Folha & DP", company:"T Youth", priority:"P1", status:"Em Progresso", created_at:"2025-09-15", due_date:"2025-10-03", updated_at:"2025-10-01", labels:"política, férias", requester:"Financeiro", impact:"Alta", sla_hours:72, linked_docs:"", recurrence:"", last_comment:"Aguardando jurídico." }
];

/** ====== utils ====== */
const fmtDate = (d?: string) => (d ? new Date(d + "T00:00:00") : undefined);
const daysBetween = (a?: Date, b?: Date) => (a && b ? Math.floor((a.getTime() - b.getTime()) / 86400000) : 0);

function computeDerived(task: any) {
  const now = new Date();
  const due = fmtDate(task.due_date);
  const overdueDays = due ? Math.max(0, daysBetween(now, due) * -1) : 0;
  const isOverdue = due ? now > due : false;
  const priorityWeight = (PRIORITY as any)[task.priority]?.weight ?? 2;
  const blockerWeight = task.status === "Bloqueado" ? 3 : 0;
  const riskIndex = overdueDays * 2 + priorityWeight + blockerWeight;
  const isUTI = task.priority === "P0" || (isOverdue && task.impact === "Alta");
  return { overdueDays, isOverdue, riskIndex, isUTI };
}

/** ====== Data Hook ====== */
function useTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      if (!API_BASE) { setTasks(demoTasks); }
      else {
        const res = await fetch(`${API_BASE}?route=list`, { cache: "no-store" });
        const text = await res.text();
        let json: any; try { json = JSON.parse(text); } catch { throw new Error(`Resposta inválida da API: ${text.slice(0,120)}`); }
        if (!res.ok || json?.ok === false) throw new Error(json?.error || `HTTP ${res.status}`);
        setTasks(json.data ?? []);
      }
    } catch (e: any) { setError(e?.message || "Falha ao carregar"); }
    finally { setLoading(false); }
  };

  const create = async (payload: any) => {
    try {
      if (!API_BASE) { setTasks(prev => [{ ...payload, id: `T-${(prev.length + 1).toString().padStart(3,"0")}` }, ...prev]); return; }
      const usingProxy = API_BASE.startsWith("/api/");
      const url = usingProxy ? API_BASE : `${API_BASE}?route=create`;
      const init: RequestInit = usingProxy
        ? { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ route:"create", body: payload }) }
        : { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) };
      const res = await fetch(url, init);
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "Falha ao criar");
      await load();
    } catch (e:any) { setError(e?.message || "Erro ao criar tarefa"); }
  };

  const update = async (id: string, patch: any) => {
    try {
      if (!API_BASE) { setTasks(prev => prev.map(t => t.id===id ? { ...t, ...patch } : t)); return; }
      const usingProxy = API_BASE.startsWith("/api/");
      const url = usingProxy ? API_BASE : `${API_BASE}?route=update&id=${encodeURIComponent(id)}`;
      const init: RequestInit = usingProxy
        ? { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ route:"update", id, body: patch }) }
        : { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(patch) };
      const res = await fetch(url, init);
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "Falha ao atualizar");
      await load();
    } catch (e:any) { setError(e?.message || "Erro ao atualizar"); }
  };

  useEffect(() => { load(); }, []);
  return { tasks, loading, error, reload: load, create, update };
}

/** ====== UI ====== */
function CreateTaskModal({ onCreate }: { onCreate: (p: any) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ priority:"P2", status:"Backlog", area:AREAS[0], company:COMPANIES[0], impact:"Média" });

  return (
    <>
      <button onClick={() => setOpen(true)} className="glass glass-pressable px-4 py-2 flex items-center gap-2">
        <Plus className="w-4 h-4" /> Nova tarefa
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={() => setOpen(false)}>
          <Glass className="w-full max-w-2xl p-4 text-slate-900 bg-white/90" as="div" soft onClick={(e:any)=>e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">Criar tarefa</div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <input className="w-full border rounded-xl px-3 py-2 bg-white/90 text-slate-800 placeholder-slate-500"
                  placeholder="Título" onChange={(e)=>setForm({ ...form, title: e.target.value })}/>
              </div>
              <div className="md:col-span-2">
                <textarea className="w-full border rounded-xl px-3 py-2 bg-white/90 text-slate-800 placeholder-slate-500"
                  rows={3} placeholder="Descrição" onChange={(e)=>setForm({ ...form, description: e.target.value })}/>
              </div>
              <input className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800 placeholder-slate-500"
                placeholder="Owner" onChange={(e)=>setForm({ ...form, owner: e.target.value })}/>
              <input className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800 placeholder-slate-500"
                placeholder="Solicitante" onChange={(e)=>setForm({ ...form, requester: e.target.value })}/>

              <select className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800"
                onChange={(e)=>setForm({ ...form, area: e.target.value })} defaultValue={form.area}>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800"
                onChange={(e)=>setForm({ ...form, company: e.target.value })} defaultValue={form.company}>
                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800"
                onChange={(e)=>setForm({ ...form, priority: e.target.value })} defaultValue={form.priority}>
                {Object.entries(PRIORITY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800"
                onChange={(e)=>setForm({ ...form, impact: e.target.value })} defaultValue={form.impact}>
                <option>Alta</option><option>Média</option><option>Baixa</option>
              </select>
              <input type="date" className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800"
                onChange={(e)=>setForm({ ...form, due_date: e.target.value })}/>
              <input className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800 placeholder-slate-500"
                placeholder="Labels (vírgula)" onChange={(e)=>setForm({ ...form, labels: e.target.value })}/>

              <div className="md:col-span-2 flex gap-2 justify-end">
                <button className="px-4 py-2 rounded-xl border">Cancelar</button>
                <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={()=>{ onCreate(form); setOpen(false); }}>Salvar</button>
              </div>
            </div>
          </Glass>
        </div>
      )}
    </>
  );
}

function StatusColumn({ status, items, onDrop }: any) {
  return (
    <Glass
      className="p-3 min-h-[60vh] text-slate-900 bg-white/75"
      onDragOver={(e:any) => e.preventDefault()}
      onDrop={(e:any) => {
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id, status);
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{status}</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-slate-100">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map((t: any) => (
          <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}>
            <motion.div
              layout
              className={`rounded-xl border border-white/40 p-3 bg-white/90 ${t._derived.isUTI ? "ring-2 ring-red-500/50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium leading-tight pr-2">{t.title}</div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  t.priority === "P0" ? "bg-red-100 text-red-700" :
                  t.priority === "P1" ? "bg-orange-100 text-orange-700" :
                  t.priority === "P2" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {(PRIORITY as any)[t.priority]?.label || t.priority}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1 line-clamp-2">{t.description}</div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded-full ${t._derived.isOverdue ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                  <CalendarDays className="w-3 h-3 inline mr-1" />
                  {t.due_date || "s/ prazo"}
                </span>
                {t._derived.isUTI && (
                  <span className="px-2 py-1 rounded-full bg-red-600 text-white text-xs">
                    <ShieldAlert className="w-3 h-3 inline mr-1" /> UTI
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span>Owner: <b>{t.owner}</b></span>
                <span className="text-slate-600">{t.area}</span>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </Glass>
  );
}

function StatTile({ title, value, icon }: { title: string; value: number; icon?: React.ReactNode }) {
  return (
    <Glass className="p-4">
      <div className="flex items-center gap-3">
        <div className="icon-btn">{icon}</div>
        <div>
          <div className="text-xs uppercase text-white/70">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </Glass>
  );
}

/** ====== APP ====== */
export default function App() {
  const { tasks, loading, error, update, create } = useTasks();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"kanban" | "dashboard">("kanban");
  const [filters, setFilters] = useState<any>({ company:"", area:"", priority:"", status:"" });

  const computed = useMemo(() => {
    const withDerived = tasks.map(t => ({ ...t, _derived: computeDerived(t) }));
    const byStatus: Record<string, any[]> = {}; STATUSES.forEach(s => byStatus[s] = []);
    const filtered = withDerived.filter(t => {
      const match =
        (!filters.company || t.company === filters.company) &&
        (!filters.area || t.area === filters.area) &&
        (!filters.priority || t.priority === filters.priority) &&
        (!filters.status || t.status === filters.status) &&
        (!query || `${t.title} ${t.description} ${t.labels}`.toLowerCase().includes(query.toLowerCase()));
      return match;
    });
    filtered.forEach(t => byStatus[t.status]?.push(t));

    const overdue = filtered.filter(t => t._derived.isOverdue && t.status !== "Concluído");
    const dueToday = filtered.filter(t => {
      if (!t.due_date) return false;
      const d = fmtDate(t.due_date)!; const now = new Date();
      return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
    });
    const uti = filtered.filter(t => t._derived.isUTI && t.status !== "Concluído");

    const byAreaAgg = AREAS.map(a => ({ area:a, qtd: filtered.filter(t => t.area===a && t.status!=="Concluído").length }));
    const byPriorityAgg = Object.keys(PRIORITY).map(k => ({ priority: (PRIORITY as any)[k].label, qtd: filtered.filter(t => t.priority===k && t.status!=="Concluído").length }));

    const totals = {
      totalOpen: filtered.filter(t => t.status !== "Concluído").length,
      total: filtered.length
    };

    return { byStatus, overdue, dueToday, uti, filtered, byAreaAgg, byPriorityAgg, totals };
  }, [tasks, query, filters]);

  const moveTask = (id: string, newStatus: string) => {
    const t = tasks.find(x => x.id === id); if (!t || t.status === newStatus) return;
    update(id, { status: newStatus, updated_at: new Date().toISOString().slice(0,10) });
  };

  // métricas para gauges
  const pctOverdue = computed.totals.totalOpen ? (computed.overdue.length / computed.totals.totalOpen) * 100 : 0;
  const pctUTI     = computed.totals.totalOpen ? (computed.uti.length / computed.totals.totalOpen) * 100 : 0;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            T Group • HR Ops
            <span className="ml-3 text-sky-200/95 text-xl md:text-2xl font-normal align-middle">
              — Gente e Cultura
            </span>
          </h1>
          <p className="text-sm text-white/80">Painel unificado: demandas, riscos e prioridades (modo {API_BASE ? "PROD" : "DEMO"}).</p>
        </div>
        <div className="flex items-center gap-2">
          <CreateTaskModal onCreate={create} />
          <button className="glass px-3 py-2 flex items-center gap-2"
            onClick={() => setView(view === "dashboard" ? "kanban" : "dashboard")}>
            {view === "dashboard" ? (<><LayoutList className="w-4 h-4" />Kanban</>) : (<><LayoutGrid className="w-4 h-4" />Dashboard</>)}
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <Glass className="mb-4 p-4">
        <div className="grid md:grid-cols-6 gap-2 text-slate-900">
          <input className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800 placeholder-slate-500"
            placeholder="Buscar por título, descrição ou labels" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <select className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800" onChange={(e)=>setFilters({ ...filters, company:e.target.value })} defaultValue="">
            <option value="">Empresa (todas)</option>
            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800" onChange={(e)=>setFilters({ ...filters, area:e.target.value })} defaultValue="">
            <option value="">Área (todas)</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800" onChange={(e)=>setFilters({ ...filters, priority:e.target.value })} defaultValue="">
            <option value="">Prioridade (todas)</option>
            {Object.entries(PRIORITY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2 bg-white/90 text-slate-800" onChange={(e)=>setFilters({ ...filters, status:e.target.value })} defaultValue="">
            <option value="">Status (todos)</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="px-3 py-2 rounded-xl border bg-white/70 text-slate-800" onClick={()=>{ setFilters({}); setQuery(""); }}>
            <span className="inline-flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" />Limpar</span>
          </button>
        </div>
      </Glass>

      {error && <div className="glass p-3 mb-3 text-red-200 border-red-400/40">{String(error)}</div>}

      {/* DASHBOARD / KANBAN */}
      {view === "dashboard" ? (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-4 gap-4">
            <Gauge value={pctOverdue} label="Atrasadas" subtitle={`${computed.overdue.length} / ${computed.totals.totalOpen}`} from="#f43f5e" to="#fb923c" />
            <Gauge value={pctUTI} label="Em UTI" subtitle={`${computed.uti.length} / ${computed.totals.totalOpen}`} from="#ef4444" to="#f59e0b" />
            <StatTile title="Vencem hoje" value={computed.dueToday.length} icon={<Clock className="w-5 h-5" />} />
            <StatTile title="Concluídas (filtro)" value={computed.filtered.filter(t => t.status === "Concluído").length} icon={<CheckCircle2 className="w-5 h-5" />} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Glass className="p-4">
              <div className="font-medium mb-2">Abertas por Área</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={computed.byAreaAgg}>
                  <XAxis dataKey="area" tick={{ fontSize: 10, fill:"#e5e7eb" }} interval={0} angle={-25} textAnchor="end" height={60}/>
                  <YAxis allowDecimals={false} tick={{ fill:"#e5e7eb" }}/>
                  <RTooltip />
                  <Bar dataKey="qtd" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Glass>
            <Glass className="p-4">
              <div className="font-medium mb-2">Abertas por Prioridade</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={computed.byPriorityAgg} dataKey="qtd" nameKey="priority" outerRadius={80} label>
                    {computed.byPriorityAgg.map((_, idx) => <Cell key={idx} />)}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Glass>
            <Glass className="p-4">
              <div className="font-medium mb-2">SLA & Risco (lista rápida)</div>
              <div className="space-y-2 max-h-[220px] overflow-auto pr-1">
                {computed.filtered
                  .filter(t => t.status !== "Concluído")
                  .sort((a,b) => b._derived.riskIndex - a._derived.riskIndex)
                  .slice(0,8)
                  .map(t => (
                    <div key={t.id} className="text-sm flex items-center justify-between border rounded-xl p-2 bg-white/15 backdrop-blur">
                      <div className="truncate mr-2">
                        <div className="font-medium truncate">{t.title}</div>
                        <div className="text-xs text-white/70">{t.area} • {t.owner}</div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${t._derived.isOverdue ? "bg-red-500/20" : "bg-white/20"}`}>{t.due_date || "s/ prazo"}</span>
                        <div className="text-[10px] text-white/60">Risco {t._derived.riskIndex}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </Glass>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-3">
          {STATUSES.map(s => (
            <StatusColumn key={s} status={s} items={computed.byStatus[s]} onDrop={moveTask} />
          ))}
        </div>
      )}

      <div className="mt-6 text-xs text-white/80">
        Dica: Fixe este painel em tela cheia na TV da sala. Use filtros por Empresa e Área quando um sócio visitar.
      </div>
    </div>
  );
}
