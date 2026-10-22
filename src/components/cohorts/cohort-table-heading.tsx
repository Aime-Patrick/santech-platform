import { Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CohortTableHeading({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Layers3 aria-hidden="true" className="size-4" />
      </span>
      <span>Cohort overview</span>
      <Badge variant="secondary" className="tabular-nums">{count}</Badge>
    </span>
  );
}
