"use client";

import { usePathname } from "next/navigation";
import AnimatedContent from "@/components/AnimatedContent";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatedContent
      key={pathname}
      trigger="mount"
      distance={8}
      duration={0.32}
      ease="power2.out"
      initialOpacity={0}
      className="min-h-full"
    >
      {children}
    </AnimatedContent>
  );
}
