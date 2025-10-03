'use client';

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CalendarDays, AlertTriangle, CheckCircle2, Clock, Plus, ArrowRightLeft, ShieldAlert, LayoutList, LayoutGrid } from "lucide-react";

/** ====== CONFIG ====== 
 * Para chamar o Apps Script DIRETO pela web:
 *  - Vá na Vercel > Settings > Environment Variables
 *  - Crie: NEXT_PUBLIC_API_BASE = https://script.google.com/macros/s/SEU_ID/exec
 *
 * Para usar PROXY (rota /api/gs) e evitar CORS:
 *  - Na Vercel, crie: GS_WEBAPP_URL = https://script.google.com/macros/s/SEU_ID/exec
 *  - E crie também: NEXT_PUBLIC_API_BASE = /api/gs
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

// Prioridades e Status
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

// DEMO seeds (quando API_BASE está vazio)
const demoTasks = [
  { id:"T-001", title:"Atualizar política de férias PJ", description:"Revisar documento e comunicar.", owner:"Moreno", area:"Folha & DP", company:"T Youth", priority:"P1", status:"Em Progresso", created_at:"2025-09-15", due_date:"2025-10-03", updated_at:"2025-10-01", labels:"política, férias", requester:"Financeiro", impact:"Alta", sla_hours:72, linked_docs:"", recurrence:"", last_comment:"Aguardando jurídico." },
  { id:"T-002", title:"Dashboard férias – Looker", description:"Conectar planilha e publicar.", owner:"Moreno", area:"Sistemas Internos (Apps)", company:"T Youth", priority:"P0", status:"Bloqueado", created_at:"2025-09-20", due_date:"2025-09-28", updated_at:"2025-09-29", labels:"dashboard, férias", requester:"Sócios T Youth", impact:"Alta", sla_hours:48, linked_docs:"", recurrence:"", last_comment:"Acesso GC pendente." },
  { id:"T-003", title:"Happy Hour + Parabéns Outubro", description:"Definir patrocinador, bolo, convites.", owner:"PEX", area:"Café com T / HH / Aniversariantes", company:"T Group", priority:"P2", status:"Backlog", created_at:"2025-09-27", due_date:"2025-10-08", updated_at:"2025-09-27", labels:"cultura, evento", requester:"Gente & Cultura", impact:"Média", sla_hours:120, linked_docs:"", recurrence:"Mensal", last_comment:"Aguardando confirmação." },
  { id:"T-004", title:"Mentoria Facilities: checklist diário", description:"Implantar check-in acrílico.", owner:"Gabriel Ventura", area:"Facilities & Sede", company:"T Venues", priority:"P1", status:"Em Aprovação", created_at:"2025-09-10", due_date:"2025-10-02", updated_at:"2025-10-02", labels:"limpeza, padrão", requester:"WAS/Facilities", impact:"Alta", sla_hours:96, linked_docs:"", recurrence:"", last_comment:"Piloto finalizado." },
  { id:"T-005", title:"Contrato Petin – renovação", description:"Revisar cláusulas e aditivo.", owner:"Moreno", area:"Benefícios", company:"T Group", priority:"P3", status:"Em Progresso", created_at:"2025-09-05", due_date:"2025-10-20", updated_at:"2025-09-30", labels:"benefício, parceria", requester:"GC", impact:"Baixa", sla_hours:168, linked_docs:"", recurrence:"Anual", last_comment:"Aguardando comercial." }
];

// Utils
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

function useTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      if (!API_BASE) {
        setTasks(demoTasks);
      } else {
        const res = await fetch(`${API_BASE}?route=list`, { cache: "no-store" });
        const json = await res.json();
        setTasks(json.data ?? []);
      }
    } catch (e: any) { setError(e?.message || "Falha ao carregar"); }
    finally { setLoading(false); }
  };

  const create = async (payload: any) => {
    if (!API_BASE) {
      setTasks(prev => [{ ...payload, id: `T-${(prev.length + 1).toString().padStart(3,"0")}` }, ...prev]);
      return;
    }
    const res = await fetch(`${API_BASE}?route=create`, { method:"POST", body: JSON.stringify(payload) });
    const json = await res.json(); if (json?.ok) load();
  };

  const update = async (id: string, patch: any) => {
    if (!API_BASE) { setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t)); return; }
    const res = await fetch(`${API_BASE}?route=update&id=${encodeURIComponent(id)}`, { method:"POST", body: JSON.stringify(patch) });
    const json = await res.json(); if (json?.ok) load();
  };

  useEffect(() => { load(); }, []);
  return { tasks, loading, error, reload: load, create, update };
}

function StatTile({ title, value, icon }: { title: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border shadow-sm p-4 flex items-center gap-3 bg-white">
      <div className="p-2 rounded-xl bg-gray-100">{icon}</div>
      <div>
        <div className="text-xs uppercase text-gray-500">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

function PriorityBadge({ p }: { p: keyof typeof PRIORITY | string }) {
  const label = (PRIORITY as any)[p]?.label || p;
  const map: Record<string, string> = {
    P0: "bg-red-100 text-red-700",
    P1: "bg-orange-100 text-orange-700",
    P2: "bg-yellow-100 text-yellow-700",
    P3: "bg-gray-100 text-gray-700"
  };
  return <span className={`text-xs px-2 py-1 rounded-full ${map[p] || "bg-gray-100 text-gray-700"}`}>{label}</span>;
}

function StatusColumn({ status, items, onDrop }: any) {
  return (
    <div
      className="bg-white rounded-2xl p-3 shadow-sm min-h-[60vh] border"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id, status);
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{status}</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{items.length}</span>
      </div>

      <div className="space-y-3">
        {items.map((t: any) => (
          // 👉 wrapper nativo para drag&drop HTML
          <div
            key={t.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
          >
            {/* 👉 motion.div apenas para animação (sem prop 'drag') */}
            <motion.div
              layout
              className={`rounded-xl border p-3 bg-white ${t._derived.isUTI ? "border-red-500" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium leading-tight pr-2">{t.title}</div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  t.priority === "P0" ? "bg-red-100 text-red-700" :
                  t.priority === "P1" ? "bg-orange-100 text-orange-700" :
                  t.priority === "P2" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {t.priority === "P0" ? "P0 • UTI" :
                   t.priority === "P1" ? "P1 • Alta" :
                   t.priority === "P2" ? "P2 • Média" : "P3 • Baixa"}
                </span>
              </div>

              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</div>

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
                <span className="text-gray-500">{t.area}</span>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}


function CreateTaskModal({ onCreate }: { onCreate: (p: any) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ priority:"P2", status:"Backlog", area:AREAS[0], company:COMPANIES[0], impact:"Média" });

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-2xl bg-black text-white px-4 py-2 flex items-center gap-2">
        <Plus className="w-4 h-4" /> Nova tarefa
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-4 w-full max-w-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">Criar tarefa</div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <input className="w-full border rounded-xl px-3 py-2" placeholder="Título" onChange={(e)=>setForm({ ...form, title: e.target.value })}/>
              </div>
              <div className="md:col-span-2">
                <textarea className="w-full border rounded-xl px-3 py-2" rows={3} placeholder="Descrição" onChange={(e)=>setForm({ ...form, description: e.target.value })}/>
              </div>
              <input className="border rounded-xl px-3 py-2" placeholder="Owner" onChange={(e)=>setForm({ ...form, owner: e.target.value })}/>
              <input className="border rounded-xl px-3 py-2" placeholder="Solicitante" onChange={(e)=>setForm({ ...form, requester: e.target.value })}/>

              <select className="border rounded-xl px-3 py-2" onChange={(e)=>setForm({ ...form, area: e.target.value })} defaultValue={form.area}>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <select className="border rounded-xl px-3 py-2" onChange={(e)=>setForm({ ...form, company: e.target.value })} defaultValue={form.company}>
                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select className="border rounded-xl px-3 py-2" onChange={(e)=>setForm({ ...form, priority: e.target.value })} defaultValue={form.priority}>
                {Object.entries(PRIORITY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>

              <select className="border rounded-xl px-3 py-2" onChange={(e)=>setForm({ ...form, impact: e.target.value })} defaultValue={form.impact}>
                <option>Alta</option><option>Média</option><option>Baixa</option>
              </select>

              <input type="date" className="border rounded-xl px-3 py-2" onChange={(e)=>setForm({ ...form, due_date: e.target.value })}/>
              <input className="border rounded-xl px-3 py-2" placeholder="Labels (vírgula)" onChange={(e)=>setForm({ ...form, labels: e.target.value })}/>

              <div className="md:col-span-2 flex gap-2 justify-end">
                <button className="px-4 py-2 rounded-xl border" onClick={()=>setOpen(false)}>Cancelar</button>
                <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={()=>{ onCreate(form); setOpen(false); }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const { tasks, loading, error, update, create } = useTasks();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"kanban" | "dashboard">("dashboard");
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

    return { byStatus, overdue, dueToday, uti, filtered, byAreaAgg, byPriorityAgg };
  }, [tasks, query, filters]);

  const moveTask = (id: string, newStatus: string) => {
    const t = tasks.find(x => x.id === id); if (!t || t.status === newStatus) return;
    update(id, { status: newStatus, updated_at: new Date().toISOString().slice(0,10) });
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">T Group • HR Ops</h1>
          <p className="text-sm text-gray-500">Painel unificado: demandas, riscos e prioridades (modo {API_BASE ? "PROD" : "DEMO"}).</p>
        </div>
        <div className="flex items-center gap-2">
          <CreateTaskModal onCreate={create} />
          <button className="rounded-2xl border px-3 py-2 flex items-center gap-2" onClick={() => setView(view === "dashboard" ? "kanban" : "dashboard")}>
            {view === "dashboard" ? (<><LayoutList className="w-4 h-4" />Kanban</>) : (<><LayoutGrid className="w-4 h-4" />Dashboard</>)}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border mb-4 bg-white">
        <div className="p-4 grid md:grid-cols-6 gap-2">
          <input className="border rounded-xl px-3 py-2" placeholder="Buscar por título, descrição ou labels" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <select className="border rounded-xl px-3 py-2" onChange={(e)=>setFilters({ ...filters, company:e.target.value })} defaultValue="">
            <option value="">Empresa (todas)</option>
            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2" onChange={(e)=>setFilters({ ...filters, area:e.target.value })} defaultValue="">
            <option value="">Área (todas)</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2" onChange={(e)=>setFilters({ ...filters, priority:e.target.value })} defaultValue="">
            <option value="">Prioridade (todas)</option>
            {Object.entries(PRIORITY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2" onChange={(e)=>setFilters({ ...filters, status:e.target.value })} defaultValue="">
            <option value="">Status (todos)</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="px-3 py-2 rounded-xl" onClick={()=>{ setFilters({}); setQuery(""); }}>
            <span className="inline-flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" />Limpar</span>
          </button>
        </div>
      </div>

      {error && <div className="text-red-600">{String(error)}</div>}

      {view === "dashboard" ? (
        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <StatTile title="Atrasadas" value={computed.overdue.length} icon={<AlertTriangle className="w-5 h-5" />} />
            <StatTile title="Vencem hoje" value={computed.dueToday.length} icon={<Clock className="w-5 h-5" />} />
            <StatTile title="Em UTI" value={computed.uti.length} icon={<ShieldAlert className="w-5 h-5" />} />
            <StatTile title="Concluídas (filtro)" value={computed.filtered.filter(t => t.status === "Concluído").length} icon={<CheckCircle2 className="w-5 h-5" />} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-white">
              <div className="p-4">
                <div className="font-medium mb-2">Abertas por Área</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={computed.byAreaAgg}>
                    <XAxis dataKey="area" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60}/>
                    <YAxis allowDecimals={false} />
                    <RTooltip />
                    <Bar dataKey="qtd" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border bg-white">
              <div className="p-4">
                <div className="font-medium mb-2">Abertas por Prioridade</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={computed.byPriorityAgg} dataKey="qtd" nameKey="priority" outerRadius={80} label>
                      {computed.byPriorityAgg.map((_, idx) => <Cell key={idx} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border bg-white">
              <div className="p-4">
                <div className="font-medium mb-2">SLA & Risco (lista rápida)</div>
                <div className="space-y-2 max-h-[220px] overflow-auto pr-1">
                  {computed.filtered
                    .filter(t => t.status !== "Concluído")
                    .sort((a,b) => b._derived.riskIndex - a._derived.riskIndex)
                    .slice(0,8)
                    .map(t => (
                      <div key={t.id} className="text-sm flex items-center justify-between border rounded-xl p-2">
                        <div className="truncate mr-2">
                          <div className="font-medium truncate">{t.title}</div>
                          <div className="text-xs text-gray-500">{t.area} • {t.owner}</div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${t._derived.isOverdue ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{t.due_date || "s/ prazo"}</span>
                          <div className="text-[10px] text-gray-500">Risco {t._derived.riskIndex}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-3">
          {STATUSES.map(s => (
            <StatusColumn key={s} status={s} items={computed.byStatus[s]} onDrop={moveTask} />
          ))}
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        Dica: Fixe este painel em tela cheia na TV da sala. Use filtros por Empresa e Área quando um sócio visitar.
      </div>
    </div>
  );
}

