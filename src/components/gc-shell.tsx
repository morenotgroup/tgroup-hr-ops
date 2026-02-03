import type { ReactNode } from "react";

const PHOTO_URL =
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=80";
const NOISE_DATA =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E";
const GRAFITE_DATA =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Cpath d='M40 120C160 40 280 180 400 120C520 60 640 120 760 40' stroke='%23ffffff' stroke-width='3' fill='none' opacity='0.4'/%3E%3Cpath d='M60 300C200 240 260 380 420 320C580 260 660 360 740 300' stroke='%23ffffff' stroke-width='2' fill='none' opacity='0.3'/%3E%3Cpath d='M80 520C240 460 340 620 520 560C640 520 720 600 760 560' stroke='%23ffffff' stroke-width='2' fill='none' opacity='0.25'/%3E%3C/svg%3E";

export default function GCShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${PHOTO_URL})` }}
        />
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xl" />
        <div
          className="absolute inset-0 opacity-60 mix-blend-soft-light"
          style={{ backgroundImage: `url(${NOISE_DATA})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-35 mix-blend-overlay"
          style={{ backgroundImage: `url(${GRAFITE_DATA})` }}
          aria-hidden
        />
      </div>
      {children}
    </div>
  );
}
