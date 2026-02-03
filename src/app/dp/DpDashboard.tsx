"use client";

import { useMemo, useState } from "react";
import type { DpSnapshot, PjClosingItem } from "@/lib/dp-service";
import {
  GlassButton,
  GlassCard,
  GlassPanel,
  GlowDivider,
  KpiPill,
} from "@/components/ui/liquid-system";

type Feedback = { tone: "success" | "error"; message: string } | null;

const toneClasses: Record<NonNullable<Feedback>["tone"], string> = {
  success:
    "border-emerald-300/40 bg-emerald-400/10 text-emerald-50 shadow-[0_0_30px_-20px_rgba(16,185,129,0.6)]",
  error:
    "border-rose-300/40 bg-rose-400/10 text-rose-50 shadow-[0_0_30px_-20px_rgba(244,63,94,0.6)]",
};

const pjStatusTones: Record<PjClosingItem["status"], string> = {
  Pendente: "from-amber-300/40 to-amber-500/20 text-amber-100",
  "Em análise": "from-sky-300/40 to-sky-500/20 text-sky-100",
  Aprovado: "from-emerald-300/40 to-emerald-500/20 text-emerald-100",
  Pago: "from-fuchsia-300/40 to-fuchsia-500/20 text-fuchsia-100",
};

const riskTones: Record<PjClosingItem["risco"], string> = {
  Baixo: "text-emerald-100",
  Médio: "text-amber-100",
  Alto: "text-rose-100",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DpDashboard({ data }: { data: DpSnapshot }) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [competencia, setCompetencia] = useState("Todas");
  const [area, setArea] = useState("Todas");
  const [status, setStatus] = useState("Todas");
  const [step, setStep] = useState(0);

  const pjItems = useMemo(() => {
    return data.pj.itens.filter((item) => {
      const competenciaOk = competencia === "Todas" || item.competencia === competencia;
      const areaOk = area === "Todas" || item.area === area;
      const statusOk = status === "Todas" || item.status === status;
      return competenciaOk && areaOk && statusOk;
    });
  }, [data.pj.itens, competencia, area, status]);

  const pjTotal = pjItems.reduce((acc, item) => acc + item.valor, 0);

  const rescisao = data.rescisao.casoAtual;
  const totalRescisao =
    rescisao.salarioBase +
    rescisao.avisoPrevio +
    rescisao.feriasProporcionais +
    rescisao.decimoTerceiro +
    rescisao.saldoFgts -
    rescisao.descontos;

  function handleExport() {
    try {
      const headers = ["ID", "Parceiro", "Área", "Competência", "Valor", "Status", "Risco"];
      const rows = pjItems.map((item) => [
        item.id,
        item.parceiro,
        item.area,
        item.competencia,
        item.valor.toFixed(2).replace(".", ","),
        item.status,
        item.risco,
      ]);
      const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "fechamento-pj.csv";
      link.click();
      URL.revokeObjectURL(url);
      setFeedback({ tone: "success", message: "Exportação gerada com sucesso." });
    } catch (error) {
      setFeedback({ tone: "error", message: "Falha ao gerar exportação." });
    }
  }

  function handleReport() {
    try {
      const content = [
        "Extrato de Rescisão",
        `Colaborador: ${rescisao.colaborador}`,
        `Cargo: ${rescisao.cargo}`,
        `Admissão: ${rescisao.admissao}`,
        `Desligamento: ${rescisao.desligamento}`,
        `Motivo: ${rescisao.motivo}`,
        "",
        `Total: ${formatCurrency(totalRescisao)}`,
      ].join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "extrato-rescisao.txt";
      link.click();
      URL.revokeObjectURL(url);
      setFeedback({ tone: "success", message: "Extrato gerado para download." });
    } catch (error) {
      setFeedback({ tone: "error", message: "Erro ao gerar extrato." });
    }
  }

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-14 md:px-10">
      <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <KpiPill tone="violet">DP • Controle Inteligente</KpiPill>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Cockpit de Departamento Pessoal com foco em decisão rápida.
          </h1>
          <p className="text-base text-white/70 md:text-lg">
            Fechamentos, rescisões e férias com visão consolidada e rotas claras para ação.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <GlassButton size="lg">Iniciar fechamento</GlassButton>
            <GlassButton size="lg" variant="outline">
              Atualizar planilha mãe
            </GlassButton>
          </div>
        </div>
        <GlassPanel className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">Status geral</p>
            <h2 className="mt-3 text-2xl font-semibold">Radar de risco e produtividade.</h2>
          </div>
          <GlowDivider />
          <div className="grid gap-4 md:grid-cols-2">
            <GlassCard className="space-y-2 bg-white/8">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Fechamento PJ</p>
              <p className="text-2xl font-semibold">{formatCurrency(pjTotal)}</p>
              <p className="text-sm text-white/60">{pjItems.length} parceiros no ciclo atual</p>
            </GlassCard>
            <GlassCard className="space-y-2 bg-white/8">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Rescisões</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalRescisao)}</p>
              <p className="text-sm text-white/60">Extrato pronto para aprovação</p>
            </GlassCard>
          </div>
        </GlassPanel>
      </section>

      {feedback ? (
        <div className={`rounded-3xl border px-5 py-4 text-sm ${toneClasses[feedback.tone]}`}>
          {feedback.message}
        </div>
      ) : null}

      <section className="grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Fechamento PJ</h2>
            <p className="text-sm text-white/60">Tabela viva com filtros e alertas de status.</p>
          </div>
          <GlassButton size="sm" onClick={handleExport}>
            Exportar CSV
          </GlassButton>
        </div>

        <GlassCard className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
              Competência
              <select
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/80"
                value={competencia}
                onChange={(event) => setCompetencia(event.target.value)}
              >
                <option className="text-slate-900">Todas</option>
                {data.pj.filtros.competencias.map((item) => (
                  <option className="text-slate-900" key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
              Área
              <select
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/80"
                value={area}
                onChange={(event) => setArea(event.target.value)}
              >
                <option className="text-slate-900">Todas</option>
                {data.pj.filtros.areas.map((item) => (
                  <option className="text-slate-900" key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
              Status
              <select
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/80"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option className="text-slate-900">Todas</option>
                {data.pj.filtros.status.map((item) => (
                  <option className="text-slate-900" key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-white/50">
                <tr>
                  <th className="px-4 py-3">Parceiro</th>
                  <th className="px-4 py-3">Competência</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risco</th>
                </tr>
              </thead>
              <tbody>
                {pjItems.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="px-4 py-4">
                      <div className="font-medium">{item.parceiro}</div>
                      <div className="text-xs text-white/50">{item.area}</div>
                    </td>
                    <td className="px-4 py-4 text-white/70">{item.competencia}</td>
                    <td className="px-4 py-4 font-semibold">{formatCurrency(item.valor)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border border-white/20 bg-gradient-to-r px-3 py-1 text-xs font-medium ${pjStatusTones[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className={`px-4 py-4 text-sm ${riskTones[item.risco]}`}>
                      {item.risco}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Rescisão</h2>
              <p className="text-sm text-white/60">Wizard em 4 passos com cálculo e extrato.</p>
            </div>
            <KpiPill tone="emerald">Step {step + 1}/4</KpiPill>
          </div>

          <div className="flex gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full ${
                  index <= step ? "bg-white/60" : "bg-white/10"
                }`}
              />
            ))}
          </div>

          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard className="space-y-2 bg-white/8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Colaborador</p>
                <p className="text-lg font-semibold">{rescisao.colaborador}</p>
                <p className="text-sm text-white/60">{rescisao.cargo}</p>
              </GlassCard>
              <GlassCard className="space-y-2 bg-white/8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Datas-chave</p>
                <p className="text-sm text-white/70">Admissão: {rescisao.admissao}</p>
                <p className="text-sm text-white/70">Desligamento: {rescisao.desligamento}</p>
                <p className="text-sm text-white/50">Motivo: {rescisao.motivo}</p>
              </GlassCard>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard className="space-y-2 bg-white/8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Base salarial</p>
                <p className="text-2xl font-semibold">{formatCurrency(rescisao.salarioBase)}</p>
                <p className="text-sm text-white/60">Salário base mensal</p>
              </GlassCard>
              <GlassCard className="space-y-2 bg-white/8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Total previsto</p>
                <p className="text-2xl font-semibold">{formatCurrency(totalRescisao)}</p>
                <p className="text-sm text-white/60">Com descontos aplicados</p>
              </GlassCard>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              {[
                { label: "Aviso prévio", value: rescisao.avisoPrevio },
                { label: "Férias proporcionais", value: rescisao.feriasProporcionais },
                { label: "13º proporcional", value: rescisao.decimoTerceiro },
                { label: "Saldo FGTS", value: rescisao.saldoFgts },
                { label: "Descontos", value: -rescisao.descontos },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-white/70">{item.label}</span>
                  <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <GlassCard className="space-y-2 bg-white/8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Extrato final</p>
                <p className="text-lg font-semibold">{rescisao.colaborador}</p>
                <p className="text-sm text-white/60">
                  Total líquido: {formatCurrency(totalRescisao)}
                </p>
                <p className="text-xs text-white/50">
                  Arquivo gerado com layout pronto para assinatura.
                </p>
              </GlassCard>
              <GlassButton onClick={handleReport}>Gerar extrato</GlassButton>
            </div>
          ) : null}

          <div className="flex justify-between">
            <GlassButton variant="ghost" size="sm" onClick={() => setStep(Math.max(0, step - 1))}>
              Voltar
            </GlassButton>
            <GlassButton size="sm" onClick={() => setStep(Math.min(3, step + 1))}>
              Avançar
            </GlassButton>
          </div>
        </GlassPanel>

        <GlassCard className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold">Férias</h2>
            <p className="text-sm text-white/60">Saldo e vencidas com visão rápida.</p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <GlassCard className="space-y-2 bg-white/8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Saldo</p>
                <p className="text-2xl font-semibold">{data.ferias.saldoDias} dias</p>
                <p className="text-xs text-white/50">Disponíveis para agendar</p>
              </GlassCard>
              <GlassCard className="space-y-2 bg-white/8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Vencidas</p>
                <p className="text-2xl font-semibold">{data.ferias.vencidasDias} dias</p>
                <p className="text-xs text-white/50">Precisa de ajuste</p>
              </GlassCard>
              <GlassCard className="space-y-2 bg-white/8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Próxima competência
                </p>
                <p className="text-2xl font-semibold">{data.ferias.proximaCompetencia}</p>
                <p className="text-xs text-white/50">Renovação automática</p>
              </GlassCard>
            </div>
            <div className="space-y-3">
              {data.ferias.demonstrativos.map((item) => (
                <div
                  key={`${item.colaborador}-${item.periodo}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{item.colaborador}</p>
                    <p className="text-xs text-white/50">{item.periodo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{item.dias} dias</p>
                    <p className="text-xs text-white/50">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
