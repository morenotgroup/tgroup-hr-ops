"use client";

import {
  CommandBar,
  GlassButton,
  GlassCard,
  GlassPanel,
  GlowDivider,
  KpiPill,
} from "@/components/ui/liquid-system";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";

const graffitiCorner = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f472b6" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.2"/>
      </linearGradient>
    </defs>
    <path d="M50 130c60-40 160-50 220 10 40 40 60 70 100 90-40 20-90 30-150 10-50-15-90-30-150-10-30 10-70 10-90-20 20-40 40-60 70-80z" fill="url(#g)"/>
    <path d="M140 60c40-20 100-20 140 10" stroke="#fff" stroke-opacity="0.5" stroke-width="4" fill="none"/>
  </svg>`
);

const graffitiEdge = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="160" viewBox="0 0 520 160">
    <path d="M10 120c80-60 180-80 320-60 80 10 140 20 180 60" stroke="#c4b5fd" stroke-opacity="0.45" stroke-width="8" fill="none"/>
    <path d="M50 90c70-40 160-50 260-20" stroke="#67e8f9" stroke-opacity="0.4" stroke-width="6" fill="none"/>
  </svg>`
);

const metrics = [
  { label: "Engajamento", value: "92%", tone: "emerald" as const },
  { label: "SLA de RH", value: "4h", tone: "sky" as const },
  { label: "Hiring Flow", value: "1.8x", tone: "violet" as const },
];

export default function StyleguidePage() {
  const reduceMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const staticParallax = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 70, damping: 18 });
  const smoothY = useSpring(mouseY, { stiffness: 70, damping: 18 });
  const { scrollYProgress } = useScroll();
  const scrollShift = useTransform(scrollYProgress, [0, 1], [0, 48]);
  const parallaxY = useTransform(
    [smoothY, scrollShift] as const,
    ([y, scroll]: [number, number]) => y + scroll
  );

  useEffect(() => {
    if (reduceMotion) return;
    function handleMove(event: MouseEvent) {
      const { innerWidth, innerHeight } = window;
      const offsetX = (event.clientX / innerWidth - 0.5) * 30;
      const offsetY = (event.clientY / innerHeight - 0.5) * 30;
      mouseX.set(offsetX);
      mouseY.set(offsetY);
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY, reduceMotion]);

  return (
    <div className="liquid-shell min-h-screen">
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-80"
        style={{ x: reduceMotion ? staticParallax : smoothX, y: reduceMotion ? staticParallax : parallaxY }}
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 15% 5%, rgba(255,255,255,0.15), transparent 50%), radial-gradient(circle at 85% 15%, rgba(56,189,248,0.30), transparent 60%), radial-gradient(circle at 40% 95%, rgba(244,114,182,0.28), transparent 60%), url("data:image/svg+xml,${graffitiEdge}")`,
          }}
        />
      </motion.div>

      <div
        className="pointer-events-none absolute left-0 top-0 h-80 w-80 bg-cover bg-no-repeat opacity-70"
        style={{ backgroundImage: `url("data:image/svg+xml,${graffitiCorner}")` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 bg-cover bg-no-repeat opacity-70"
        style={{ backgroundImage: `url("data:image/svg+xml,${graffitiCorner}")` }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-16 md:px-12">
        <section className="flex flex-col gap-8">
          <KpiPill tone="rose">GC OS • Liquid Glass</KpiPill>
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                Design system premium para operações de Gente & Cultura.
              </h1>
              <p className="text-base text-white/70 md:text-lg">
                Superfícies translúcidas, luz difusa e overlays grafite para dar identidade ao
                GC OS com uma estética de “liquid glass” moderna e acessível.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <GlassButton size="lg">Criar fluxo</GlassButton>
                <GlassButton variant="outline" size="lg">
                  Ver componentes
                </GlassButton>
              </div>
            </div>
            <GlassPanel className="flex flex-col justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">Resumo</p>
                <h2 className="mt-3 text-2xl font-semibold">Sistema líquido, modular e vivo.</h2>
              </div>
              <GlowDivider />
              <div className="grid gap-4">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="text-sm text-white/70">{metric.label}</span>
                    <KpiPill tone={metric.tone}>{metric.value}</KpiPill>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </section>

        <CommandBar />

        <section className="grid gap-6 md:grid-cols-3">
          <GlassCard className="space-y-4">
            <KpiPill tone="violet">GlassCard</KpiPill>
            <h3 className="text-xl font-semibold">Cards para blocos de contexto.</h3>
            <p className="text-sm text-white/65">
              Ideal para módulos de insight, resumos e dashboards com brilho sutil.
            </p>
            <GlassButton size="sm">Abrir detalhe</GlassButton>
          </GlassCard>
          <GlassCard className="space-y-4 bg-white/8">
            <KpiPill tone="emerald">GlassPanel</KpiPill>
            <h3 className="text-xl font-semibold">Painéis translúcidos.</h3>
            <p className="text-sm text-white/65">
              Suportes para fluxos longos com hierarquia clara e proteção visual.
            </p>
            <div className="flex gap-3">
              <GlassButton size="sm">Ativar</GlassButton>
              <GlassButton size="sm" variant="ghost">
                Revisar
              </GlassButton>
            </div>
          </GlassCard>
          <GlassCard className="space-y-4">
            <KpiPill tone="sky">KPI Pills</KpiPill>
            <h3 className="text-xl font-semibold">Indicadores de performance.</h3>
            <p className="text-sm text-white/65">
              Pílulas de dados para monitorar métricas críticas com contraste e clareza.
            </p>
            <div className="flex flex-wrap gap-2">
              <KpiPill tone="emerald">+12%</KpiPill>
              <KpiPill tone="rose">SLA 92%</KpiPill>
              <KpiPill tone="violet">Tempo médio 3d</KpiPill>
            </div>
          </GlassCard>
        </section>

        <section className="grid gap-6 md:grid-cols-[0.6fr_1fr]">
          <GlassPanel className="space-y-4">
            <KpiPill tone="rose">GlowDivider</KpiPill>
            <h3 className="text-xl font-semibold">Divisórias com glow.</h3>
            <p className="text-sm text-white/65">
              Separadores com luz difusa para dividir seções extensas sem peso visual.
            </p>
            <GlowDivider />
            <GlowDivider className="opacity-60" />
          </GlassPanel>
          <GlassPanel className="space-y-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">GlassButton</p>
              <h3 className="text-2xl font-semibold">Botões com foco visível.</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <GlassButton>Primário</GlassButton>
              <GlassButton variant="outline">Outline</GlassButton>
              <GlassButton variant="ghost">Ghost</GlassButton>
              <GlassButton size="sm">Pequeno</GlassButton>
            </div>
            <p className="text-sm text-white/60">
              Inclui foco com ring, estados hover suaves e contraste mínimo para legibilidade.
            </p>
          </GlassPanel>
        </section>
      </div>
    </div>
  );
}
