import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toneStyles = {
  orange: "border-orange-100 bg-orange-50 text-orange-600",
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-600",
} as const;

interface CohortMetricCellProps {
  icon: LucideIcon;
  value: number;
  label: string;
  tone: keyof typeof toneStyles;
}

export function CohortMetricCell({ icon: Icon, value, label, tone }: CohortMetricCellProps) {
  return (
    <div className="inline-flex min-w-28 items-center gap-2.5 text-left">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border", toneStyles[tone])}>
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </span>
    </div>
  );
}
