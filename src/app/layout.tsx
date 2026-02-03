export const metadata = {
  title: "T Group • HR Ops",
  description: "Kanban + Dashboard de Gente & Cultura",
};

import "./globals.css";
import type { ReactNode } from "react";
import { Space_Grotesk } from "next/font/google";
import RouteTransition from "@/components/route-transition";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br" className={spaceGrotesk.variable}>
      <body className="font-sans antialiased text-white">
        <RouteTransition>{children}</RouteTransition>
      </body>
    </html>
  );
}
