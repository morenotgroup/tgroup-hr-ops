import * as React from "react";

type GlassVariant = "primary" | "outline" | "ghost";
type GlassSize = "sm" | "md" | "lg";

const surfaceBase =
  "relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_25px_80px_-45px_rgba(0,0,0,0.8)]";

const surfaceHighlight =
  "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.38),transparent_58%)] before:opacity-70";

export function GlassCard({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${surfaceBase} ${surfaceHighlight} p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function GlassPanel({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`${surfaceBase} ${surfaceHighlight} bg-white/8 p-8 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

const buttonVariants: Record<GlassVariant, string> = {
  primary:
    "bg-white/15 text-white hover:bg-white/22 border-white/20 shadow-[0_12px_30px_-18px_rgba(255,255,255,0.6)]",
  outline: "bg-white/5 text-white border-white/25 hover:bg-white/12",
  ghost: "bg-transparent text-white border-white/10 hover:bg-white/10",
};

const buttonSizes: Record<GlassSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-base",
};

type GlassButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: GlassVariant;
  size?: GlassSize;
};

export function GlassButton({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...rest
}: GlassButtonProps) {
  return (
    <button
      type="button"
      className={[
        "group relative inline-flex items-center justify-center gap-2 rounded-full border backdrop-blur-xl transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_60%)] opacity-60" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function GlowDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-px w-full overflow-hidden ${className}`}>
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <span className="absolute inset-0 blur-md bg-gradient-to-r from-transparent via-fuchsia-300/60 to-transparent" />
    </div>
  );
}

type KpiPillProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "emerald" | "sky" | "violet" | "rose";
};

const pillTones: Record<NonNullable<KpiPillProps["tone"]>, string> = {
  emerald: "from-emerald-300/40 to-emerald-500/30 text-emerald-50",
  sky: "from-sky-300/40 to-sky-500/30 text-sky-50",
  violet: "from-violet-300/40 to-violet-500/30 text-violet-50",
  rose: "from-rose-300/40 to-rose-500/30 text-rose-50",
};

export function KpiPill({
  children,
  className = "",
  tone = "sky",
  ...rest
}: KpiPillProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] backdrop-blur-lg",
        pillTones[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}

type CommandBarProps = React.HTMLAttributes<HTMLDivElement> & {
  placeholder?: string;
  actions?: React.ReactNode;
};

export function CommandBar({
  className = "",
  placeholder = "Busque por comandos, pessoas ou squads",
  actions,
  ...rest
}: CommandBarProps) {
  return (
    <div
      className={`${surfaceBase} ${surfaceHighlight} flex flex-col gap-4 rounded-[28px] bg-white/9 p-5 md:flex-row md:items-center md:justify-between ${className}`}
      {...rest}
    >
      <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-xl">
        <span className="text-sm uppercase tracking-[0.2em] text-white/60">⌘</span>
        <input
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/45 focus-visible:outline-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">⌥ + K</span>
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Shift + L</span>
        {actions}
      </div>
    </div>
  );
}
