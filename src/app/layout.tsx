import type { Metadata } from "next";
import { Exo_2, Inter } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const exo = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SAN TECH Platform",
    template: "%s | SAN TECH Platform",
  },
  description: "SAN TECH learning and operations platform.",
  icons: {
    icon: "/santech-mark.png",
    apple: "/santech-mark.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${exo.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <QueryProvider><TooltipProvider>{children}</TooltipProvider></QueryProvider>
      </body>
    </html>
  );
}
