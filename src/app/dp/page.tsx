import PlaceholderPage from "@/components/placeholder-page";

export default function DPPage() {
  return (
    <PlaceholderPage
      title="DP"
      description="Área dedicada a folha, benefícios e documentação. Conteúdo em construção."
    />
import DpDashboard from "./DpDashboard";
import { getDpSnapshot } from "@/lib/dp-service";

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

export default async function DpPage() {
  const data = await getDpSnapshot();

  return (
    <div className="liquid-shell min-h-screen">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-80"
        style={{
          backgroundImage: `radial-gradient(circle at 15% 5%, rgba(255,255,255,0.15), transparent 50%), radial-gradient(circle at 85% 15%, rgba(56,189,248,0.30), transparent 60%), radial-gradient(circle at 40% 95%, rgba(244,114,182,0.28), transparent 60%), url(\"data:image/svg+xml,${graffitiEdge}\")`,
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute left-0 top-0 h-80 w-80 bg-cover bg-no-repeat opacity-70"
        style={{ backgroundImage: `url(\"data:image/svg+xml,${graffitiCorner}\")` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 bg-cover bg-no-repeat opacity-70"
        style={{ backgroundImage: `url(\"data:image/svg+xml,${graffitiCorner}\")` }}
        aria-hidden
      />

      <DpDashboard data={data} />
    </div>
  );
}
