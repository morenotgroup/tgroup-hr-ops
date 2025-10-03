export const metadata = {
  title: "T Group • HR Ops",
  description: "Kanban + Dashboard de Gente & Cultura",
};

import "./globals.css";
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br" className={montserrat.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
