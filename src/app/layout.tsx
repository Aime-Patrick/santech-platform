import type { Metadata } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <QueryProvider><TooltipProvider>{children}</TooltipProvider></QueryProvider>
      </body>
    </html>
  );
}
