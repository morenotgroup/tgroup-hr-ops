import React from "react";

type Props = {
  value: number;      // 0..100
  label: string;
  subtitle?: string;
  size?: number;      // px
  from?: string;      // cor início
  to?: string;        // cor fim
};

export default function Gauge({
  value,
  label,
  subtitle,
  size = 170,
  from = "#6d28d9",   // purple
  to   = "#06b6d4",   // cyan
}: Props){
  const pct = Math.max(0, Math.min(100, value||0));
  const angle = (pct/100)*360;
  const ring = {
    background: `conic-gradient(${from} 0deg, ${to} ${angle}deg, rgba(255,255,255,.08) ${angle}deg 360deg)`,
  } as React.CSSProperties;

  const dotStyle = {
    transform: `rotate(${angle}deg) translate(${size/2 - 16}px)`,
    background: `radial-gradient(circle at 30% 30%, ${to}, ${from})`
  } as React.CSSProperties;

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-white/70">{subtitle}</div>
        <div className="chip">glow</div>
      </div>

      <div className="mx-auto relative" style={{ width:size, height:size }}>
        <div className="absolute inset-0 rounded-full" style={ring} />
        <div className="absolute inset-[10%] rounded-full bg-white/10 backdrop-blur" />
        {/* marcador luminoso */}
        <div className="absolute left-1/2 top-1/2 w-6 h-6 rounded-full shadow-[0_0_20px_6px_rgba(6,182,212,.55)]" style={dotStyle} />
        {/* valor */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-4xl font-semibold">{Math.round(pct)}%</div>
            <div className="text-sm text-white/70">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
