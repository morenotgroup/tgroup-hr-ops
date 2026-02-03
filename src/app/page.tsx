"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  Search,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import GCShell from "@/components/gc-shell";

const cards = [
  {
    title: "DP",
    description: "Folha, benefícios, documentos e suporte ao time.",
    href: "/dp",
    icon: Users,
    tone: "from-sky-400/70 to-indigo-400/70",
  },
  {
    title: "NF",
    description: "Notas fiscais, lançamentos e controles fiscais.",
    href: "/nf",
    icon: FileText,
    tone: "from-emerald-400/70 to-cyan-400/70",
  },
  {
    title: "Facilities",
    description: "Infra, serviços, espaços e bem-estar do escritório.",
    href: "/facilities",
    icon: Building2,
    tone: "from-amber-400/70 to-rose-400/70",
  },
  {
    title: "Onboarding",
    description: "Rituais de chegada, acessos e documentação inicial.",
    href: "/onboarding",
    icon: UserPlus,
    tone: "from-violet-400/70 to-fuchsia-400/70",
  },
  {
    title: "Analytics",
    description: "Indicadores, insights e acompanhamento estratégico.",
    href: "/analytics",
    icon: BarChart3,
    tone: "from-teal-400/70 to-sky-400/70",
  },
  {
    title: "Calendário",
    description: "Agenda de eventos, rituais e ações de cultura.",
    href: "/calendar",
    icon: CalendarDays,
    tone: "from-rose-400/70 to-orange-400/70",
  },
];

const kpis = [
  {
    label: "Pendências NF",
    value: "12",
    helper: "Aguardando validação",
    icon: WalletCards,
  },
  {
    label: "Tarefas do mês",
    value: "38",
    helper: "72% concluído",
    icon: FileText,
  },
  {
    label: "Aniversariantes",
    value: "5",
    helper: "Próximos 7 dias",
    icon: Users,
  },
  {
    label: "Admissões",
    value: "3",
    helper: "Previstas para hoje",
    icon: UserPlus,
  },
];

export default function Home() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const dateLabel = useMemo(() => {
    return new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  }, []);

  return (
    <GCShell>
      <div className="relative z-10">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
          <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                GC OS Launcher
              </p>
              <h1 className="text-3xl font-semibold md:text-4xl">
                {greeting}, Time GC
              </h1>
              <p className="text-white/70 capitalize">{dateLabel}</p>
            </div>

            <button className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm text-white/80 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15 active:scale-[0.98] md:w-[360px]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <Search className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-medium text-white">
                  Buscar pessoas, docs ou processos
                </span>
                <span className="text-xs text-white/60">Atalho para o hub</span>
              </span>
              <span className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white/70">
                ⌘ K
              </span>
            </button>
          </header>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Acessos rápidos</h2>
              <span className="text-xs text-white/50">
                Navegue com fluidez
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 hover:shadow-2xl active:scale-[0.98]"
                  >
                    <div
                      className={`absolute right-6 top-6 h-16 w-16 rounded-2xl bg-gradient-to-br ${card.tone} opacity-70 blur-xl transition group-hover:opacity-100`}
                      aria-hidden
                    />
                    <div className="relative flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-xs uppercase tracking-[0.25em] text-white/50">
                          Abrir
                        </span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-semibold">{card.title}</h3>
                        <p className="text-sm text-white/70">
                          {card.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                        Pronto para iniciar
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="space-y-6 pb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Hoje</h2>
              <span className="text-xs text-white/50">Atualizado agora</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={kpi.label}
                    className="group rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                        {kpi.label}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                        <Icon className="h-4 w-4 text-white/80" />
                      </span>
                    </div>
                    <div className="mt-4 text-3xl font-semibold">
                      {kpi.value}
                    </div>
                    <p className="text-xs text-white/60">{kpi.helper}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </GCShell>
  );
}
