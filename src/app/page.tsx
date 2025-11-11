'use client';

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Glass from "@/components/ui/Glass";
import { CalendarDays, CheckCircle2, Clock, LayoutGrid, LayoutList, Plus, ShieldAlert, ArrowRightLeft } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, PieChart, Pie, Cell } from "recharts";

/** ===== API base ===== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

/** ===== Constantes ===== */
const STATUSES = ["Backlog","Em Progresso","Em Aprovação","Bloqueado","Concluído"] as const;
const PRIORITY = {
  P0: { label:"P0 • UTI", weight:6 },
  P1: { label:"P1 • Alta", weight:4 },
  P2: { label:"P2 • Média", weight:2 },
  P3: { label:"P3 • Baixa", weight:1 },
} as const;
const AREAS = [
  "Admissão & Demissão","Recrutamento","Facilities & Sede","Folha & DP","Benefícios","Prestação de Contas","Contratos Jurídicos",
  "Performance & Clima","Atendimento Colab","Atendimento Sócios","Conflitos Internos","Café com T / HH / Aniversariantes",
  "Confraternização Anual","Eventos & Palestras & Capacitações","Brindes & Datas Comemorativas","Locação / Imobiliária","Sistemas Internos (Apps)"
] as const;
const COMPANIES = ["T Group","T Youth","T Brands","T Dreams","T Venues","WAS","Mood"] as const;

/** ===== Utilidades ===== */
const fmtDate = (d?: string) => (d ? new Date(d + "T00:00:00") : undefined);
const daysBetween = (a?: Date, b?: Date) => (a && b ? Math.floor((a.getTime() - b.getTime()) / 86400000) : 0);
const computeDerived = (t:any) => {
  const now = new Date();
  const due = fmtDate(t.due_date);
  const overdueDays = due ? Math.max(0, daysBetween(now, due) * -1) : 0;
  const isOverdue = due ? now > due : false;
  const priorityWeight = (PRIORITY as any)[t.priority]?.weight ?? 2;
  const blockerWeight = t.status === "Bloqueado" ? 3 : 0;
  const riskIndex = overdueDays * 2 + priorityWeight + blockerWeight;
  const isUTI = t.priority === "P0" || (isOverdue && t.impact === "Alta");
  return { overdueDays, isOverdue, riskIndex, isUTI };
};

/** ===== Hook de dados ===== */
function useTasks(){
  const [tasks, setTasks]   = useState<any[]>([]);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const load = async () => {
    setLoad(true); setError(null);
    try{
      if (!API_BASE){
        setTasks([]); // DEMO vazio
      } else {
        const res = await fetch(`${API_BASE}?route=list`, { cache:"no-store" });
        const text = await res.text();
        let json:any; try{ json = JSON.parse(text); } catch { throw new Error(`API inválida: ${text.slice(0,120)}`); }
        if (!res.ok || json?.ok === false) throw new Error(json?.error || `HTTP ${res.status}`);
        setTasks(json.data ?? []);
      }
    }catch(e:any){ setError(e?.message || "Falha ao carregar"); }
    finally{ setLoad(false); }
  };

  const create = async (payload:any) => {
    try{
      if (!API_BASE){
        setTasks(prev => [{ ...payload, id:`T-${(prev.length+1).toString().padStart(3,"0")}`}, ...prev]);
        return;
      }
      const usingProxy = API_BASE.startsWith("/api/");
      const url  = usingProxy ? API_BASE : `${API_BASE}?route=create`;
      const init = usingProxy
        ? { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ route:"create", body: payload }) }
        : { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) };
      const res = await fetch(url, init);
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "Falha ao criar");
      await load();
    }catch(e:any){ setError(e?.message || "Erro ao criar"); }
  };

  const update = async (id:string, patch:any) => {
    try{
      if (!API_BASE){ setTasks(prev => prev.map(t => t.id===id ? { ...t, ...patch } : t)); return; }
      const usingProxy = API_BASE.startsWith("/api/");
      const url  = usingProxy ? API_BASE : `${API_BASE}?route=update&id=${encodeURIComponent(id)}`;
      const init = usingProxy
        ? { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ route:"update", id, body: patch }) }
        : { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(patch) };
      const res = await fetch(url, init);
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "Falha ao atualizar");
      await load();
    }catch(e:any){ setError(e?.message || "Erro ao atualizar"); }
  };

  useEffect(()=>{ load(); }, []);
  return { tasks, loading, error, reload: load, create, update };
}

/** ===== UI ===== */
function CreateTaskModal({ onCreate }:{ onCreate:(p:any)=>void }){
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    priority:"P2", status:"Backlog", impact:"Média", area:AREAS[0], company:COMPANIES[0]
  });
  const canSave = form?.title?.trim();

  const save = async () => {
    if (!canSave) return;
    const payload = {
      ...form,
      created_at: new Date().toISOString().slice(0,10),
      updated_at: new Date().toISOString().slice(0,10)
    };
    await onCreate(payload);
    setOpen(false);
    // limpa formulário
    setForm({ priority:"P2", status:"Backlog", impact:"Média", area:AREAS[0], company:COMPANIES[0] });
  };

  return (
    <>
      <button className="glass glass-pressable px-4 py-2 flex items-center gap-2" onClick={()=>setOpen(true)}>
        <Plus className="w-4 h-4"/> Nova tarefa
      </button>

      {open && (
        <div className="modal-backdrop grid place-items-center" role="dialog" aria-modal="true" onClick={()=>setOpen(false)}>
          <Glass as="div" className="modal-card p-4 text-slate-900" soft onClick={(e)=>e.stopPropagation()}>
            <div className="text-slate-800 text-lg font-semibold mb-3">Criar tarefa</div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <input className="input-ios" placeholder="Título" value={form.title||""}
                  onChange={(e)=>setForm({ ...form, title:e.target.value })}/>
              </div>
              <div className="md:col-span-2">
                <textarea className="textarea-ios" rows={4} placeholder="Descrição"
                  value={form.description||""}
                  onChange={(e)=>setForm({ ...form, description:e.target.value })}/>
              </div>

              <input className="input-ios" placeholder="Owner" value={form.owner||""}
                onChange={(e)=>setForm({ ...form, owner:e.target.value })}/>
              <input className="input-ios" placeholder="Solicitante" value={form.requester||""}
                onChange={(e)=>setForm({ ...form, requester:e.target.value })}/>

              <select className="select-ios" value={form.area} onChange={(e)=>setForm({ ...form, area:e.target.value })}>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select className="select-ios" value={form.company} onChange={(e)=>setForm({ ...form, company:e.target.value })}>
                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select className="select-ios" value={form.priority} onChange={(e)=>setForm({ ...form, priority:e.target.value })}>
                {Object.entries(PRIORITY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="select-ios" value={form.impact} onChange={(e)=>setForm({ ...form, impact:e.target.value })}>
                <option>Alta</option><option>Média</option><option>Baixa</option>
              </select>

              <input type="date" className="input-ios"
                value={form.due_date||""} onChange={(e)=>setForm({ ...form, due_date:e.target.value })}/>
              <input className="input-ios" placeholder="Labels (vírgula)" value={form.labels||""}
                onChange={(e)=>setForm({ ...form, labels:e.target.value })}/>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={()=>setOpen(false)}>Cancelar</button>
              <button type="button" className="btn" onClick={save} disabled={!canSave}>Salvar</button>
            </div>
          </Glass>
        </div>
      )}
    </>
  );
}

function StatusColumn({ status, items, onDrop } : any){
  return (
    <Glass className="p-3 min-h-[60vh] text-slate-900" soft
      onDragOver={(e:any)=>e.preventDefault()}
      onDrop={(e:any)=>{ const id = e.dataTransfer.getData("text/plain"); if (id) onDrop(id, status); }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white/90">{status}</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-white/15 border border-white/30 text-white/90">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map((t:any)=>(
          <div key={t.id} draggable onDragStart={(e)=>e.dataTransfer.setData("text/plain", t.id)}>
            <motion.div layout className={`rounded-xl border border-white/35 p-3 bg-white/85 ${t._derived.isUTI ? "ring-2 ring-red-500/50" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium text-slate-900 pr-2">{t.title}</div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  t.priority==="P0"?"bg-red-100 text-red-700":
                  t.priority==="P1"?"bg-orange-100 text-orange-700":
                  t.priority==="P2"?"bg-yellow-100 text-yellow-700":"bg-gray-100 text-gray-700"}`}>
                  {(PRIORITY as any)[t.priority]?.label || t.priority}
                </span>
              </div>
              <div className="text-xs text-slate-700 mt-1 line-clamp-2">{t.description}</div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded-full ${t._derived.isOverdue ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                  <CalendarDays className="w-3 h-3 inline mr-1"/>{t.due_date || "s/ prazo"}
                </span>
                {t._derived.isUTI && (
                  <span className="px-2 py-1 rounded-full bg-red-600 text-white text-xs">
                    <ShieldAlert className="w-3 h-3 inline mr-1"/>UTI
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-700">
                <span>Owner: <b>{t.owner||"-"}</b></span>
                <span>{t.area}</span>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </Glass>
  );
}

export default function App(){
  const { tasks, loading, error, create, update } = useTasks();
  const [query, setQuery] = useState("");
  const [view, setView]  = useState<"kanban"|"dashboard">("kanban");
  const [filters, setFilters] = useState<any>({ company:"", area:"", priority:"", status:"" });

  const computed = useMemo(()=>{
    const withD = tasks.map(t=>({ ...t, _derived: computeDerived(t) }));
    const byStatus: Record<string, any[]> = {}; STATUSES.forEach(s=>byStatus[s]=[]);
    const filtered = withD.filter(t => {
      const match =
        (!filters.company || t.company===filters.company) &&
        (!filters.area || t.area===filters.area) &&
        (!filters.priority || t.priority===filters.priority) &&
        (!filters.status || t.status===filters.status) &&
        (!query || `${t.title} ${t.description} ${t.labels}`.toLowerCase().includes(query.toLowerCase()));
      return match;
    });
    filtered.forEach(t=>byStatus[t.status]?.push(t));
    return { byStatus, filtered };
  }, [tasks, query, filters]);

  const moveTask = (id:string, newStatus:string) => {
    const t = tasks.find(x=>x.id===id); if (!t || t.status===newStatus) return;
    update(id, { status:newStatus, updated_at: new Date().toISOString().slice(0,10) });
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            T Group • HR Ops <span className="ml-3 text-sky-200/95 text-xl md:text-2xl font-normal">— Gente e Cultura</span>
          </h1>
          <p className="text-sm text-white/85">Painel unificado: demandas, riscos e prioridades (modo {API_BASE? "PROD":"DEMO"}).</p>
        </div>
        <div className="flex items-center gap-2">
          <CreateTaskModal onCreate={create}/>
          <button className="glass px-3 py-2 flex items-center gap-2" onClick={()=>setView(view==="dashboard"?"kanban":"dashboard")}>
            {view==="dashboard" ? (<><LayoutList className="w-4 h-4"/>Kanban</>) : (<><LayoutGrid className="w-4 h-4"/>Dashboard</>)}
          </button>
        </div>
      </div>

      <Glass className="mb-4 p-4">
        <div className="grid md:grid-cols-6 gap-2 text-slate-900">
          <input className="input-ios" placeholder="Buscar por título, descrição ou labels" value={query} onChange={(e)=>setQuery(e.target.value)}/>
          <select className="select-ios" onChange={(e)=>setFilters({ ...filters, company:e.target.value })} defaultValue="">
            <option value="">Empresa (todas)</option>{COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select-ios" onChange={(e)=>setFilters({ ...filters, area:e.target.value })} defaultValue="">
            <option value="">Área (todas)</option>{AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="select-ios" onChange={(e)=>setFilters({ ...filters, priority:e.target.value })} defaultValue="">
            <option value="">Prioridade (todas)</option>{Object.entries(PRIORITY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="select-ios" onChange={(e)=>setFilters({ ...filters, status:e.target.value })} defaultValue="">
            <option value="">Status (todos)</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-ghost" onClick={()=>{ setFilters({}); setQuery(""); }}>
            <span className="inline-flex items-center gap-2"><ArrowRightLeft className="w-4 h-4"/>Limpar</span>
          </button>
        </div>
      </Glass>

      {error && <div className="glass p-3 mb-3 text-red-200 border border-red-400/50 bg-red-900/20">Erro: {String(error)}</div>}

      {/* Kanban */}
      <div className="grid md:grid-cols-5 gap-3">
        {STATUSES.map(s => <StatusColumn key={s} status={s} items={computed.byStatus[s]||[]} onDrop={moveTask}/>)}
      </div>

      <div className="mt-6 text-xs text-white/85">Dica: Fixe este painel em tela cheia na TV da sala. Use filtros por Empresa e Área.</div>
    </div>
  );
}
