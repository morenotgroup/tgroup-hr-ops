import Link from "next/link";
import type { ReactNode } from "react";
import GCShell from "@/components/gc-shell";

type PlaceholderPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export default function PlaceholderPage({
  title,
  description,
  children,
}: PlaceholderPageProps) {
  return (
    <GCShell>
      <div className="relative z-10">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6 px-6 py-16">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              GC OS Launcher
            </p>
            <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
            <p className="text-white/70">{description}</p>
          </div>
          {children}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80 transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20"
            >
              ← Voltar ao Launcher
            </Link>
          </div>
        </div>
      </div>
    </GCShell>
  );
}
