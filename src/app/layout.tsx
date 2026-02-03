import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "T Group • HR Ops",
  description: "Kanban + Dashboard de Gente & Cultura",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="font-sans antialiased text-white">{children}</body>
    </html>
  );
}
