export const metadata = {
  title: "T Group • HR Ops",
  description: "Kanban + Dashboard de Gente & Cultura"
};

import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
